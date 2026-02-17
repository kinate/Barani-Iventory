
import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

const BackendCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const schemaSql = `-- Batani Store D1 Database Schema
-- Run this in your D1 dashboard or using Wrangler

CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    supplier_id INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    price REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sold_price REAL NOT NULL,
    commission REAL DEFAULT 0.0,
    total_amount REAL NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Index for fast searching
CREATE INDEX idx_product_number ON products(product_number);
CREATE INDEX idx_customer_phone ON customers(phone_number);`;

  const workerCode = `/**
 * Batani Store Cloudflare Worker - Inventory & Sales API
 */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const jsonResponse = (data: any, status = 200) => 
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    try {
      // --- SALES HANDLER (Transaction Logic) ---
      if (path === '/api/sales' && method === 'POST') {
        const { customerName, phone, productId, quantity, soldPrice, commission } = await request.json();
        
        // 1. Transaction Start (Simulated with sequential awaits)
        // Find or create customer
        let customer = await env.DB.prepare('SELECT id FROM customers WHERE phone_number = ?').bind(phone).first();
        if (!customer) {
          customer = await env.DB.prepare(
            'INSERT INTO customers (full_name, phone_number) VALUES (?, ?) RETURNING id'
          ).bind(customerName, phone).first();
        }

        // 2. Check stock
        const product = await env.DB.prepare('SELECT stock_quantity FROM products WHERE id = ?').bind(productId).first();
        if (!product || product.stock_quantity < quantity) {
          return jsonResponse({ error: 'Insufficient stock' }, 400);
        }

        // 3. Record Sale
        const total = quantity * soldPrice;
        await env.DB.prepare(\`
          INSERT INTO sales (customer_id, product_id, quantity, sold_price, commission, total_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        \`).bind(customer.id, productId, quantity, soldPrice, commission || 0, total).run();

        // 4. Update Product Stock
        await env.DB.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
          .bind(quantity, productId).run();

        return jsonResponse({ success: true, total });
      }

      // --- REPORTS ---
      if (path === '/api/reports/dashboard' && method === 'GET') {
        const stats = await env.DB.prepare(\`
          SELECT 
            (SELECT SUM(total_amount) FROM sales) as totalRevenue,
            (SELECT SUM(commission) FROM sales) as totalCommission,
            (SELECT COUNT(*) FROM sales) as totalSalesCount,
            (SELECT SUM(quantity) FROM sales) as totalItemsSold,
            (SELECT COUNT(*) FROM customers) as totalCustomers
        \`).first();
        return jsonResponse(stats);
      }

      // ... other standard CRUD endpoints ...

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
};`;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
        <div className="p-3 bg-blue-600 rounded-xl">
          <Terminal className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-blue-900">Deployment Guide</h2>
          <p className="text-blue-700 text-sm mt-1 mb-4 leading-relaxed">
            Updated schema includes <code className="bg-white px-2 py-0.5 rounded border border-blue-200">commission</code> column in the <code className="bg-white px-2 py-0.5 rounded border border-blue-200">sales</code> table.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">1. Updated D1 Database Schema</h3>
          <button 
            onClick={() => copyToClipboard(schemaSql, 'schema')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm"
          >
            {copied === 'schema' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied === 'schema' ? 'Copied' : 'Copy SQL'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed shadow-2xl">
          {schemaSql}
        </pre>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">2. Sales Transaction Logic</h3>
          <button 
            onClick={() => copyToClipboard(workerCode, 'worker')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm"
          >
            {copied === 'worker' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied === 'worker' ? 'Copied' : 'Copy Code'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed shadow-2xl">
          {workerCode}
        </pre>
      </div>
    </div>
  );
};

export default BackendCodeViewer;
