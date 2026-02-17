
/**
 * Batani Store - Cloudflare Worker Backend
 * Handles D1 (SQLite) and R2 (Storage) operations.
 */

// Added missing Cloudflare Worker type definitions to resolve compilation errors
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Response>;
  first<T = any>(column?: string): Promise<T | null>;
}

interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: any;
}

interface D1Response {
  success: boolean;
  meta: any;
}

interface R2Bucket {
  put(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
}

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Helper for JSON responses
    const jsonResponse = (data: any, status = 200) => 
      new Response(JSON.stringify(data), {
        status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return jsonResponse({}, 204);
    }

    try {
      // --- SUPPLIERS ---
      if (path === '/api/suppliers') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
          return jsonResponse(results);
        }
        if (method === 'POST') {
          const { name, contact_person, phone, email, address } = await request.json();
          // Fix: Use .all() instead of .run() to correctly retrieve results from RETURNING query
          const { results } = await env.DB.prepare(
            'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?) RETURNING *'
          ).bind(name, contact_person, phone, email, address).all();
          return jsonResponse(results[0], 201);
        }
      }

      // --- PRODUCTS ---
      if (path === '/api/products') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(`
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.created_at DESC
          `).all();
          
          // Attach images to each product
          const productsWithImages = await Promise.all(results.map(async (p: any) => {
            const images = await env.DB.prepare('SELECT * FROM product_images WHERE product_id = ?').bind(p.id).all();
            return { ...p, images: images.results };
          }));
          
          return jsonResponse(productsWithImages);
        }
        if (method === 'POST') {
          const data = await request.json();
          // Fix: Use .all() instead of .run() to correctly retrieve results from RETURNING query
          const { results } = await env.DB.prepare(`
            INSERT INTO products (product_number, name, description, supplier_id, stock_quantity, price) 
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
          `).bind(data.product_number, data.name, data.description, data.supplier_id, data.stock_quantity, data.price).all();
          
          const productId = results[0].id;

          // If images are provided (as base64 or R2 keys), handle them here
          // This is a simplified version; real R2 implementation would involve put()
          if (data.images && Array.isArray(data.images)) {
            for (const imgUrl of data.images) {
              await env.DB.prepare('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)')
                .bind(productId, imgUrl).run();
            }
          }

          return jsonResponse({ id: productId, success: true }, 201);
        }
      }

      // --- SEARCH PRODUCT BY SKU ---
      if (path.startsWith('/api/products/search/')) {
        const sku = decodeURIComponent(path.split('/').pop() || '');
        const product = await env.DB.prepare(`
          SELECT p.*, s.name as supplier_name, s.contact_person as supplier_contact, s.phone as supplier_phone
          FROM products p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE p.product_number = ?
        `).bind(sku).first();

        if (!product) return jsonResponse({ error: 'Product not found' }, 404);

        const { results: images } = await env.DB.prepare('SELECT * FROM product_images WHERE product_id = ?')
          .bind((product as any).id).all();

        return jsonResponse({ ...product, images });
      }

      // --- SALES TRANSACTION ---
      if (path === '/api/sales' && method === 'POST') {
        const { customerName, phone, productId, quantity, soldPrice, commission } = await request.json();

        // 1. Get Product and Check Stock
        const product: any = await env.DB.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').bind(productId).first();
        if (!product) return jsonResponse({ error: 'Product not found' }, 404);
        if (product.stock_quantity < quantity) {
          return jsonResponse({ error: `Insufficient stock for ${product.name}` }, 400);
        }

        // 2. Customer Handling (Lookup or Create)
        let customer: any = await env.DB.prepare('SELECT id FROM customers WHERE phone_number = ?').bind(phone).first();
        if (!customer) {
          // Fix: Use .all() instead of .run() to correctly retrieve results from RETURNING query
          const { results: newCust } = await env.DB.prepare(
            'INSERT INTO customers (full_name, phone_number) VALUES (?, ?) RETURNING id'
          ).bind(customerName, phone).all();
          customer = newCust[0];
        }

        // 3. Record Sale
        const totalAmount = quantity * soldPrice;
        await env.DB.prepare(`
          INSERT INTO sales (customer_id, product_id, quantity, sold_price, commission, total_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(customer.id, productId, quantity, soldPrice, commission || 0, totalAmount).run();

        // 4. Reduce Stock
        await env.DB.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
          .bind(quantity, productId).run();

        return jsonResponse({ success: true, totalAmount });
      }

      // --- CUSTOMERS ---
      if (path === '/api/customers' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM customers ORDER BY full_name ASC').all();
        return jsonResponse(results);
      }

      if (path.startsWith('/api/customers/') && path.endsWith('/history')) {
        const customerId = path.split('/')[3];
        const { results } = await env.DB.prepare(`
          SELECT s.*, p.name as product_name
          FROM sales s
          JOIN products p ON s.product_id = p.id
          WHERE s.customer_id = ?
          ORDER BY s.sale_date DESC
        `).bind(customerId).all();
        return jsonResponse(results);
      }

      // --- DASHBOARD REPORTS ---
      if (path === '/api/reports/dashboard') {
        const stats = await env.DB.prepare(`
          SELECT 
            IFNULL(SUM(total_amount), 0) as totalRevenue,
            IFNULL(SUM(commission), 0) as totalCommission,
            COUNT(*) as totalSalesCount,
            IFNULL(SUM(quantity), 0) as totalItemsSold,
            (SELECT COUNT(*) FROM customers) as totalCustomers,
            (SELECT COUNT(*) FROM products WHERE stock_quantity < 10) as lowStockCount,
            (SELECT IFNULL(SUM(total_amount), 0) FROM sales WHERE strftime('%m', sale_date) = strftime('%m', 'now')) as monthlyRevenue
          FROM sales
        `).first();
        
        return jsonResponse(stats);
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);

    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
};
