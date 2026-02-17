
import { Product, Supplier, ProductImage, Customer, Sale } from '../types';

const STORAGE_KEYS = {
  SUPPLIERS: 'cf_inventory_suppliers',
  PRODUCTS: 'cf_inventory_products',
  IMAGES: 'cf_inventory_images',
  CUSTOMERS: 'cf_inventory_customers',
  SALES: 'cf_inventory_sales',
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

// --- CUSTOMERS ---
export const getCustomers = (): Customer[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  return data ? JSON.parse(data) : [];
};

export const saveCustomer = (customer: Customer): Customer => {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.push(customer);
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  return customer;
};

export const findCustomerByPhone = (phone: string): Customer | undefined => {
  return getCustomers().find(c => c.phone_number === phone);
};

export const deleteCustomer = (id: string) => {
  const customers = getCustomers().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

// --- SALES ---
export const getSales = (): Sale[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SALES);
  const sales: Sale[] = data ? JSON.parse(data) : [];
  const customers = getCustomers();
  const products = getProducts();
  
  return sales.map(s => ({
    ...s,
    customer: customers.find(c => c.id === s.customer_id),
    product: products.find(p => p.id === s.product_id)
  }));
};

export const addSale = (saleData: { 
  customerName: string, 
  phone: string, 
  productId: string, 
  quantity: number, 
  soldPrice: number 
}) => {
  const products = getProducts();
  const product = products.find(p => p.id === saleData.productId);
  
  if (!product || product.stock_quantity < saleData.quantity) {
    throw new Error('Insufficient stock');
  }

  // Handle Customer Auto-creation/Lookup
  let customer = findCustomerByPhone(saleData.phone);
  if (!customer) {
    customer = saveCustomer({
      id: Math.random().toString(36).substr(2, 9),
      full_name: saleData.customerName,
      phone_number: saleData.phone,
      created_at: new Date().toISOString()
    });
  }

  // Create Sale
  const sale: Sale = {
    id: Math.random().toString(36).substr(2, 9),
    customer_id: customer.id,
    product_id: product.id,
    quantity: saleData.quantity,
    sold_price: saleData.soldPrice,
    total_amount: saleData.quantity * saleData.soldPrice,
    sale_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const sales = getSales();
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([...sales, sale]));

  // Update Product Stock
  product.stock_quantity -= saleData.quantity;
  saveProduct(product, []); // Already has images stored
};

// --- REPORTS ---
export const getDashboardMetrics = () => {
  const sales = getSales();
  const customers = getCustomers();
  const products = getProducts();
  
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_amount, 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
  
  const now = new Date();
  const thisMonthSales = sales.filter(s => {
    const saleDate = new Date(s.sale_date);
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonthSales.reduce((acc, s) => acc + s.total_amount, 0);

  return {
    totalRevenue,
    totalSalesCount: sales.length,
    totalItemsSold,
    totalCustomers: customers.length,
    monthlyRevenue,
    lowStockCount: products.filter(p => p.stock_quantity < 10).length
  };
};

export const getMonthlyReport = () => {
  const sales = getSales();
  const months: Record<string, number> = {};
  
  sales.forEach(s => {
    const date = new Date(s.sale_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months[key] = (months[key] || 0) + s.total_amount;
  });

  return Object.entries(months).map(([month, total]) => ({ month, total })).sort((a,b) => b.month.localeCompare(a.month));
};

export const getCustomerSpendingReport = () => {
  const sales = getSales();
  const customers = getCustomers();
  
  return customers.map(c => {
    const customerSales = sales.filter(s => s.customer_id === c.id);
    return {
      name: c.full_name,
      phone: c.phone_number,
      totalSpent: customerSales.reduce((acc, s) => acc + s.total_amount, 0),
      purchaseCount: customerSales.length
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
};
