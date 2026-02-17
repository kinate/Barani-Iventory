
import React, { useState, useEffect } from 'react';
import { Product, Supplier } from '../types';
import { getProducts, getSuppliers, saveProduct, deleteProduct, findProductByNumber } from '../services/mockDataService';
import { generateProductDescription } from '../services/geminiService';
// Added Box to imports from lucide-react to fix missing component error
import { PackagePlus, Pencil, Trash2, X, Search, Sparkles, Camera, Image as ImageIcon, Box } from 'lucide-react';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    product_number: '',
    name: '',
    description: '',
    supplier_id: '',
    stock_quantity: 0,
    price: 0,
    images: [] as string[]
  });

  const loadData = () => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    if (!searchQuery) {
      loadData();
      return;
    }
    const result = findProductByNumber(searchQuery);
    setProducts(result ? [result] : []);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        product_number: product.product_number,
        name: product.name,
        description: product.description,
        supplier_id: product.supplier_id,
        stock_quantity: product.stock_quantity,
        price: product.price,
        images: product.images?.map(i => i.image_url) || []
      });
    } else {
      setEditingProduct(null);
      setFormData({
        product_number: '',
        name: '',
        description: '',
        supplier_id: suppliers[0]?.id || '',
        stock_quantity: 0,
        price: 0,
        images: []
      });
    }
    setIsModalOpen(true);
  };

  const handleAiDescription = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const desc = await generateProductDescription(formData.name, "Generic");
    setFormData({ ...formData, description: desc });
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      created_at: editingProduct?.created_at || new Date().toISOString()
    };
    saveProduct(newProduct, formData.images);
    setIsModalOpen(false);
    loadData();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fix: Explicitly cast Array.from(files) to File[] to avoid 'unknown' type errors in strict mode
    (Array.from(files) as File[]).slice(0, 5).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string].slice(0, 5)
        }));
      };
      // Fixed: readAsDataURL now receives a File object (subtype of Blob) which resolves the 'unknown' error
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Product Inventory</h2>
          <p className="text-slate-500 text-sm">Monitor stock levels and manage item details</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search SKU..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-48 md:w-64"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-shadow shadow-md shadow-blue-200"
          >
            <PackagePlus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0].image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-xs uppercase font-bold tracking-widest">No Image</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(p)}
                  className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-blue-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3">
                {p.stock_quantity === 0 ? (
                  <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-lg">
                    Sold out
                  </span>
                ) : (
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${p.stock_quantity < 10 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {p.stock_quantity} in stock
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 truncate pr-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">SKU: {p.product_number}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-blue-600 text-lg block leading-tight">TSh {p.price.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10 leading-relaxed">
                {p.description}
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {p.supplier?.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-slate-600 truncate">{p.supplier?.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-40 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
          <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No products found matching your search.</p>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      placeholder="e.g. Wireless Headphones"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">SKU / Product Number</label>
                    <input 
                      required
                      type="text" 
                      value={formData.product_number}
                      onChange={e => setFormData({...formData, product_number: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      placeholder="PROD-001"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Stock</label>
                      <input 
                        required
                        type="number" 
                        value={formData.stock_quantity}
                        onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Price (TSh)</label>
                      <input 
                        required
                        type="number" 
                        step="1"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier</label>
                    <select 
                      value={formData.supplier_id}
                      onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-semibold text-slate-700">Description</label>
                      <button 
                        type="button"
                        onClick={handleAiDescription}
                        disabled={isGenerating || !formData.name}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        {isGenerating ? 'Generating...' : 'Magic Write'}
                      </button>
                    </div>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none h-32 text-sm leading-relaxed"
                      placeholder="Tell us about the product..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Images (Max 5)</label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {formData.images.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})}
                            className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {formData.images.length < 5 && (
                        <label className="aspect-square rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                          <Camera className="w-5 h-5 text-slate-400" />
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Supported formats: JPG, PNG, GIF</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
