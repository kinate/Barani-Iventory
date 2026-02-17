import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { getDashboardMetrics, getMonthlyReport, getCustomerSpendingReport } from '../services/mockDataService';
import { Package, Users, AlertTriangle, DollarSign, ShoppingCart, TrendingUp, HandCoins, Wallet } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

const StatCard = ({ title, value, icon: IconComponent, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      {trend && (
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
      <IconComponent className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
  const [customerReport, setCustomerReport] = useState<any[]>([]);

  useEffect(() => {
    setMetrics(getDashboardMetrics());
    setMonthlyReport(getMonthlyReport());
    setCustomerReport(getCustomerSpendingReport().slice(0, 5));
  }, []);

  if (!metrics) return null;

  const netRevenue = metrics.totalRevenue - metrics.totalCommission;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
          title="Net Revenue" 
          value={`TSh ${netRevenue.toLocaleString()}`} 
          icon={Wallet} 
          color="bg-emerald-600" 
          trend="After Commissions"
        />
        <StatCard 
          title="Gross Sales" 
          value={`TSh ${metrics.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-blue-600" 
          trend={`TSh ${metrics.monthlyRevenue.toLocaleString()} this month`}
        />
        <StatCard 
          title="Total Commission" 
          value={`TSh ${metrics.totalCommission.toLocaleString()}`} 
          icon={HandCoins} 
          color="bg-rose-600" 
        />
        <StatCard 
          title="Total Orders" 
          value={metrics.totalSalesCount} 
          icon={ShoppingCart} 
          color="bg-slate-700" 
        />
        <StatCard 
          title="Active Customers" 
          value={metrics.totalCustomers} 
          icon={Users} 
          color="bg-purple-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-6">Monthly Revenue & Commission</h3>
            <div className="space-y-6">
              {monthlyReport.length > 0 ? monthlyReport.map((item, idx) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{item.month}</span>
                    <span className="font-black text-slate-900">TSh {item.total.toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${Math.min(100, (item.total / metrics.totalRevenue) * 100)}%` }}
                    />
                  </div>
                </div>
              )) : <p className="text-slate-400 text-sm">No sales data recorded yet.</p>}
            </div>
          </div>

          {metrics.lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-xl text-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Inventory Alert</h4>
                  <p className="text-amber-700 text-sm">{metrics.lowStockCount} items are running low on stock.</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('products')}
                className="px-4 py-2 bg-white text-amber-900 font-bold text-sm rounded-lg border border-amber-200 hover:bg-amber-100"
              >
                Restock
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <h3 className="text-xl font-bold mb-6">Top Spenders</h3>
            <div className="space-y-6">
              {customerReport.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.purchaseCount} purchases</p>
                    </div>
                  </div>
                  <span className="text-blue-400 font-black text-sm">TSh {c.totalSpent.toLocaleString()}</span>
                </div>
              ))}
              {customerReport.length === 0 && <p className="text-slate-600 text-sm">No customer data.</p>}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('sales')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            RECORD NEW SALE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;