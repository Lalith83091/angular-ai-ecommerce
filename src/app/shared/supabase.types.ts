type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type UserProfileRow = {
  user_id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

type CartRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

type WishlistRow = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  customer_name: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
  subtotal: number;
  shipping_amount: number;
  total_amount: number;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
};

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: TableDefinition<
        UserProfileRow,
        Pick<UserProfileRow, 'user_id'> & Partial<Pick<UserProfileRow, 'full_name'>>,
        Partial<Pick<UserProfileRow, 'full_name' | 'updated_at'>>
      >;
      carts: TableDefinition<
        CartRow,
        Pick<CartRow, 'user_id'> & Partial<Pick<CartRow, 'id' | 'created_at' | 'updated_at'>>,
        Partial<Pick<CartRow, 'user_id' | 'updated_at'>>
      >;
      cart_items: TableDefinition<
        CartItemRow,
        Pick<CartItemRow, 'cart_id' | 'product_id' | 'quantity'> &
          Partial<Pick<CartItemRow, 'id' | 'created_at' | 'updated_at'>>,
        Partial<Pick<CartItemRow, 'cart_id' | 'product_id' | 'quantity' | 'updated_at'>>
      >;
      wishlists: TableDefinition<
        WishlistRow,
        Pick<WishlistRow, 'user_id' | 'product_id'> & Partial<Pick<WishlistRow, 'id' | 'created_at'>>,
        Partial<Pick<WishlistRow, 'user_id' | 'product_id'>>
      >;
      orders: TableDefinition<
        OrderRow,
        Omit<OrderRow, 'id' | 'created_at'> & Partial<Pick<OrderRow, 'id' | 'created_at'>>,
        Partial<OrderRow>
      >;
      order_items: TableDefinition<
        OrderItemRow,
        Omit<OrderItemRow, 'id' | 'created_at' | 'line_total'> &
          Partial<Pick<OrderItemRow, 'id' | 'created_at'>>,
        Partial<Omit<OrderItemRow, 'line_total'>>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      place_order: {
        Args: {
          p_customer_name: string;
          p_email: string;
          p_address_line1: string;
          p_address_line2: string;
          p_city: string;
          p_state_region: string;
          p_postal_code: string;
          p_country: string;
          p_items: Json;
        };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
