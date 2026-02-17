
export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_number: string;
  name: string;
  description: string;
  supplier_id: string;
  stock_quantity: number;
  price: number;
  created_at: string;
  images?: ProductImage[];
  supplier?: Supplier;
}

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  sold_price: number;
  commission: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
  // Join data
  customer?: Customer;
  product?: Product;
}

export type ViewState = 'dashboard' | 'suppliers' | 'products' | 'sales' | 'customers' | 'backend-code';
