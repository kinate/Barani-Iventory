import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getProducts, addSale } from '../services/mockDataService';
import { ShoppingBag, Search, Plus, Minus, CheckCircle, AlertCircle, X, HandCoins, TrendingUp } from 'lucide-react';

interface SalesEntryProps {
  onSuccess: () => void;
}

const SalesEntry: React.FC<SalesEntryProps> = ({ onSuccess }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    quantity: 1,
    soldPrice: 0,
    commission: 0
  });

  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.product_number.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5));
    } else {
      setFilteredProducts([]);
    }
  }, [searchQuery, products]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setFormData({ ...formData, soldPrice: p.price, quantity: 1, commission: 0 });
    setSearchQuery('');
    setFilteredProducts([]);
  };

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    if (formData.commission > (formData.soldPrice * formData.quantity)) {
      setError('Commission cannot be greater than the sale price.');
      return;
    }

    try {
      addSale({
        ...formData,
        productId: selectedProduct.id
      });
      setIsSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const totalRevenue = formData.quantity * formData.soldPrice;
  const netRevenue = totalRevenue - formData.commission;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sale Recorded!</h2>
        <p className="text-slate-500">Inventory updated successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Product Selector */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Product Details
            </h3>
            
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Product (Name or SKU)</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              
              {filteredProducts.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">SKU: {p.product_number}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${p.stock_quantity === 0 ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        {p.stock_quantity} Left
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-blue-900">{selectedProduct.name}</h4>
                    <p className="text-xs text-blue-700">Ref: {selectedProduct.product_number}</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-blue-400 hover:text-blue-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Gross Revenue</label>
                        <div className="font-black text-xl text-blue-900">
                          TSh {totalRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Commission Deduction</label>
                        <div className="font-black text-xl text-rose-600 flex items-center gap-1">
                          - TSh {formData.commission.toLocaleString()}
                        </div>
                      </div>
                   </div>
                   <div className="bg-white/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center text-right">
                      <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> Net Profit
                      </label>
                      <div className="font-black text-3xl text-emerald-600">
                        TSh {netRevenue.toLocaleString()}
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer & Finalization */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSale} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-xl">Sale Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Phone</label>
                <input 
                  required
                  type="tel"
                  placeholder="e.g. 255..."
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
                <input 
                  required
                  type="text"
                  placeholder="Full Name"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Quantity</label>
                <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                    className="p-2 bg-white rounded-lg hover:bg-slate-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-8 text-center">{formData.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                    className="p-2 bg-white rounded-lg hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Price (TSh)</label>
                <input 
                  required
                  type="number"
                  value={formData.soldPrice}
                  onChange={e => setFormData({ ...formData, soldPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Commission to Deduct</span>
                  <HandCoins className="w-4 h-4 text-rose-500" />
                </label>
                <input 
                  type="number"
                  placeholder="Commission Amount"
                  value={formData.commission}
                  onChange={e => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-rose-600"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={!selectedProduct || selectedProduct.stock_quantity < formData.quantity}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-50 transition-all transform hover:bg-slate-800 active:scale-95"
            >
              FINALIZE SALE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesEntry;