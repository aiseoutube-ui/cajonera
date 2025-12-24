
export interface Product {
  id: string | number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  meta_stock: number;
  vendidos_actual: number;
  estado: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderData {
  userName: string;
  cart: CartItem[];
  total: number;
  voucherBase64?: string | null;
}
