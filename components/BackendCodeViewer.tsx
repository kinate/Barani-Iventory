
import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

const BackendCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const schemaSql = `-- Cloudflare D1 Database Schema
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

-- Index for fast searching
CREATE INDEX idx_product_number ON products(product_number);`;

  const workerCode = `/**
 * Cloudflare Worker - Inventory API
 * Uses D1 (SQLite) and R2 (Storage)
 */

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

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
      // --- SUPPLIERS ENDPOINTS ---
      if (path === '/api/suppliers') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM suppliers').all();
          return jsonResponse(results);
        }
        if (method === 'POST') {
          const { name, contact_person, phone, email, address } = await request.json();
          await env.DB.prepare(
            'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)'
          ).bind(name, contact_person, phone, email, address).run();
          return jsonResponse({ success: true }, 201);
        }
      }

      // --- PRODUCTS ENDPOINTS ---
      if (path === '/api/products') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(\`
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
          \`).all();
          return jsonResponse(results);
        }
        if (method === 'POST') {
          const data = await request.json();
          const { results } = await env.DB.prepare(
            'INSERT INTO products (product_number, name, description, supplier_id, stock_quantity, price) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
          ).bind(data.product_number, data.name, data.description, data.supplier_id, data.stock_quantity, data.price).run();
          return jsonResponse({ id: results[0].id, success: true }, 201);
        }
      }

      // --- SEARCH PRODUCT ---
      if (path.startsWith('/api/products/search/')) {
        const productNumber = path.split('/').pop();
        const product = await env.DB.prepare(\`
          SELECT p.*, s.name as supplier_name, s.email as supplier_email
          FROM products p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE p.product_number = ?
        \`).bind(productNumber).first();

        if (!product) return jsonResponse({ error: 'Not found' }, 404);

        const { results: images } = await env.DB.prepare(
          'SELECT image_url FROM product_images WHERE product_id = ?'
        ).bind(product.id).all();

        return jsonResponse({ ...product, images });
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);

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
            Follow these steps to deploy your inventory system to Cloudflare:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 font-medium">
            <li>Install Wrangler CLI: <code className="bg-white px-2 py-0.5 rounded border border-blue-200">npm install -g wrangler</code></li>
            <li>Create D1 database: <code className="bg-white px-2 py-0.5 rounded border border-blue-200">wrangler d1 create my-inventory-db</code></li>
            <li>Run the SQL schema below using Wrangler or the Cloudflare dashboard.</li>
            <li>Deploy the worker code to your project.</li>
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">1. D1 Database Schema</h3>
          <button 
            onClick={() => copyToClipboard(schemaSql, 'schema')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            {copied === 'schema' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied === 'schema' ? 'Copied' : 'Copy SQL'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl overflow-x-auto text-xs font-mono leading-relaxed shadow-inner">
          {schemaSql}
        </pre>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">2. Worker API Code (TypeScript)</h3>
          <button 
            onClick={() => copyToClipboard(workerCode, 'worker')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            {copied === 'worker' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied === 'worker' ? 'Copied' : 'Copy Code'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl overflow-x-auto text-xs font-mono leading-relaxed shadow-inner">
          {workerCode}
        </pre>
      </div>

      <div className="bg-white border border-slate-200 p-8 rounded-2xl">
        <h3 className="font-bold text-lg mb-4">Example API Response</h3>
        <p className="text-sm text-slate-500 mb-6">Request: <code className="bg-slate-100 px-2 py-1 rounded">GET /api/products/search/SKU-1001</code></p>
        <pre className="bg-slate-50 p-6 rounded-xl text-xs font-mono text-slate-700">
{`{
  "id": 1,
  "product_number": "SKU-1001",
  "name": "Cloud Camera Pro",
  "description": "High resolution streaming camera.",
  "supplier_id": 5,
  "stock_quantity": 42,
  "price": 199.99,
  "supplier_name": "Vision Tech Inc",
  "supplier_email": "sales@visiontech.com",
  "images": [
    { "image_url": "https://r2.your-bucket.com/img1.png" },
    { "image_url": "https://r2.your-bucket.com/img2.png" }
  ]
}`}
        </pre>
      </div>
    </div>
  );
};

export default BackendCodeViewer;
