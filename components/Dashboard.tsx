
import React, { useState, useEffect } from 'react';
import { ViewState, Product, Supplier } from '../types';
import { getProducts, getSuppliers } from '../services/mockDataService';
import { Package, Truck, AlertTriangle, DollarSign, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

const StatCard = ({ title, value, icon: IconComponent, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      {trend && (
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
          <ArrowUpRight className="w-3 h-3" />
          {trend} from last month
        </p>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
      <IconComponent className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    products: 0,
    suppliers: 0,
    lowStock: 0,
    totalValue: 0
  });

  useEffect(() => {
    const products = getProducts();
    const suppliers = getSuppliers();
    
    setStats({
      products: products.length,
      suppliers: suppliers.length,
      lowStock: products.filter(p => p.stock_quantity < 10).length,
      totalValue: products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0)
    });
  }, []);

  const recentProducts = getProducts().slice(-5).reverse();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.products} 
          icon={Package} 
          color="bg-blue-600" 
          trend="+12%" 
        />
        <StatCard 
          title="Suppliers" 
          value={stats.suppliers} 
          icon={Truck} 
          color="bg-purple-600" 
          trend="+3%" 
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Inventory Value" 
          value={`$${stats.totalValue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recently Added Products</h3>
            <button 
              onClick={() => onNavigate('products')}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-100">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length > 0 ? recentProducts.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-none">
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex-shrink-0">
                        {p.images?.[0] && <img src={p.images[0].image_url} className="w-full h-full object-cover rounded" />}
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </td>
                    <td className="py-4 text-sm text-slate-500">{p.product_number}</td>
                    <td className="py-4 text-sm text-slate-900 text-right font-semibold">${p.price}</td>
                    <td className="py-4 text-right">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock_quantity < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {p.stock_quantity} units
                       </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">No products found. Start adding some!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-4">Ready to expand?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Connect more suppliers and use our Gemini-powered AI to generate perfect product listings in seconds.
            </p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => onNavigate('suppliers')}
              className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Manage Suppliers
            </button>
            <button 
              onClick={() => onNavigate('products')}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Add New Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
