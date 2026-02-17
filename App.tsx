
import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import Dashboard from './components/Dashboard';
import SupplierList from './components/SupplierList';
import ProductList from './components/ProductList';
import BackendCodeViewer from './components/BackendCodeViewer';
import { LayoutDashboard, Box, Users, Code, Search } from 'lucide-react';

// Using simple lucide-style icons as components
const Icon = ({ name, className }: { name: string, className?: string }) => {
  switch(name) {
    case 'dashboard': return <LayoutDashboard className={className} />;
    case 'products': return <Box className={className} />;
    case 'suppliers': return <Users className={className} />;
    case 'code': return <Code className={className} />;
    case 'search': return <Search className={className} />;
    default: return null;
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'products', label: 'Products', icon: 'products' },
    { id: 'suppliers', label: 'Suppliers', icon: 'suppliers' },
    { id: 'backend-code', label: 'Worker Code', icon: 'code' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">CF</div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">Inventory Pro</span>}
        </div>
        
        <nav className="mt-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewState)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-3">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center gap-3 p-3 text-slate-400 hover:text-white border border-slate-800 rounded-lg"
          >
            {isSidebarOpen ? 'Collapse' : '»'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold capitalize">
            {currentView.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Global product search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setCurrentView('products');
                }}
              />
              <Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
              JD
            </div>
          </div>
        </header>

        <div className="p-8">
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
          {currentView === 'suppliers' && <SupplierList />}
          {currentView === 'products' && <ProductList />}
          {currentView === 'backend-code' && <BackendCodeViewer />}
        </div>
      </main>
    </div>
  );
};

export default App;
