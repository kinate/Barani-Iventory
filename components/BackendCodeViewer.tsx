import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

const BackendCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const wranglerConfig = `# wrangler.toml
name = "batani-store"
main = "worker.ts"
compatibility_date = "2024-04-03"

[assets]
directory = "./"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "batani_db"
database_id = "your-database-id-from-cloudflare-dashboard"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "batani-assets"
`;

  const schemaSql = `-- Batani Store D1 Database Schema
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

CREATE INDEX idx_product_number ON products(product_number);
CREATE INDEX idx_customer_phone ON customers(phone_number);`;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
        <div className="p-3 bg-blue-600 rounded-xl">
          <Terminal className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-blue-900">Deployment Instructions</h2>
          <p className="text-blue-700 text-sm mt-1 leading-relaxed">
            Ensure your project root contains both <code className="bg-white px-2 py-0.5 rounded border border-blue-200">wrangler.toml</code> and <code className="bg-white px-2 py-0.5 rounded border border-blue-200">worker.ts</code>.
          </p>
          <div className="mt-4 flex gap-2">
             <code className="bg-slate-900 text-slate-100 px-3 py-1 rounded text-xs">npx wrangler d1 create batani_db</code>
             <code className="bg-slate-900 text-slate-100 px-3 py-1 rounded text-xs">npx wrangler deploy</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><FileCode className="w-5 h-5" /> wrangler.toml</h3>
          <button 
            onClick={() => copyToClipboard(wranglerConfig, 'wrangler')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm"
          >
            {copied === 'wrangler' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied === 'wrangler' ? 'Copied' : 'Copy TOML'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed shadow-xl">
          {wranglerConfig}
        </pre>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">D1 Database Schema</h3>
          <button 
            onClick={() => copyToClipboard(schemaSql, 'schema')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm"
          >
            {copied === 'schema' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied === 'schema' ? 'Copied' : 'Copy SQL'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed shadow-xl">
          {schemaSql}
        </pre>
      </div>
    </div>
  );
};

export default BackendCodeViewer;