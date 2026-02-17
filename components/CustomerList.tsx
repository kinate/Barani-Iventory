
import React, { useState, useEffect } from 'react';
import { Customer, Sale } from '../types';
import { getCustomers, getSales, deleteCustomer } from '../services/mockDataService';
import { User, Phone, Mail, MapPin, History, Trash2, X, HandCoins } from 'lucide-react';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const handleViewHistory = (c: Customer) => {
    const allSales = getSales();
    const history = allSales.filter(s => s.customer_id === c.id);
    setSelectedCustomer(c);
    setCustomerSales(history);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure? This will not delete their purchase history but will remove the profile.')) {
      deleteCustomer(id);
      setCustomers(getCustomers());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Records</h2>
          <p className="text-slate-500 text-sm">Monitor purchase history and customer loyalty</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewHistory(c)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <History className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-900 text-lg mb-4">{c.full_name}</h3>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="w-3 h-3" /> {c.phone_number}
              </div>
              {c.email && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-3 h-3" /> {c.email}
                </div>
              )}
              {c.address && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-3 h-3" /> {c.address}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer since</span>
              <span className="text-xs font-bold text-slate-700">{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {customers.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            No customers registered yet. Record a sale to see them here!
          </div>
        )}
      </div>

      {/* History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedCustomer.full_name}</h3>
                <p className="text-xs text-slate-500">Purchase History</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {customerSales.length > 0 ? (
                <div className="space-y-4">
                  {customerSales.map(s => (
                    <div key={s.id} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{s.product?.name || 'Deleted Item'}</p>
                          <p className="text-[10px] text-slate-500">{new Date(s.sale_date).toLocaleDateString()} • {s.quantity} units</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600">TSh {s.total_amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">TSh {s.sold_price.toLocaleString()} / ea</p>
                        </div>
                      </div>
                      {s.commission > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1"><HandCoins className="w-3 h-3" /> Commission Paid</span>
                          <span>TSh {s.commission.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-10 text-slate-400">No purchases found for this customer.</p>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between font-bold">
               <span className="text-slate-500">Lifetime Spending</span>
               <span className="text-xl text-slate-900">TSh {customerSales.reduce((acc, s) => acc + s.total_amount, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
