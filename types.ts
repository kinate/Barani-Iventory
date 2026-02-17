
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

export type ViewState = 'dashboard' | 'suppliers' | 'products' | 'search' | 'backend-code';
