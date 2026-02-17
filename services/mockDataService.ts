
import { Product, Supplier, ProductImage } from '../types';

const STORAGE_KEYS = {
  SUPPLIERS: 'cf_inventory_suppliers',
  PRODUCTS: 'cf_inventory_products',
  IMAGES: 'cf_inventory_images',
};

// Initial mock data
const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Global Tech Solutions', contact_person: 'John Doe', phone: '555-0101', email: 'john@globaltech.com', address: '123 Innovation Dr, SF', created_at: new Date().toISOString() },
  { id: 's2', name: 'Premium Parts Co.', contact_person: 'Jane Smith', phone: '555-0202', email: 'sales@premiumparts.com', address: '456 Industrial Way, NY', created_at: new Date().toISOString() },
];

export const getSuppliers = (): Supplier[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(initialSuppliers));
    return initialSuppliers;
  }
  return JSON.parse(data);
};

export const saveSupplier = (supplier: Supplier) => {
  const suppliers = getSuppliers();
  const index = suppliers.findIndex(s => s.id === supplier.id);
  if (index >= 0) {
    suppliers[index] = supplier;
  } else {
    suppliers.push(supplier);
  }
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
};

export const deleteSupplier = (id: string) => {
  const suppliers = getSuppliers().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
};

export const getProducts = (): Product[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  const products: Product[] = data ? JSON.parse(data) : [];
  const suppliers = getSuppliers();
  const images = getProductImages();
  
  return products.map(p => ({
    ...p,
    supplier: suppliers.find(s => s.id === p.supplier_id),
    images: images.filter(img => img.product_id === p.id)
  }));
};

export const getProductImages = (): ProductImage[] => {
  const data = localStorage.getItem(STORAGE_KEYS.IMAGES);
  return data ? JSON.parse(data) : [];
};

export const saveProduct = (product: Product, newImages: string[]) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // Handle images (mock R2)
  if (newImages.length > 0) {
    const images = getProductImages();
    const productImages = newImages.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      product_id: product.id,
      image_url: url,
      created_at: new Date().toISOString()
    }));
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify([...images, ...productImages]));
  }
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  
  const images = getProductImages().filter(img => img.product_id !== id);
  localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
};

export const findProductByNumber = (productNumber: string): Product | undefined => {
  return getProducts().find(p => p.product_number.toLowerCase() === productNumber.toLowerCase());
};
