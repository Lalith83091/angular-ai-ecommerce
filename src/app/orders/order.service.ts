import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CartItem } from '../cart/cart.service';
import { SupabaseClientService } from '../shared/supabase-client.service';

export interface ShippingDetails {
  customerName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CustomerOrder {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  items: OrderLine[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);
  private currentUserId: string | null = null;
  private loadVersion = 0;
  private readonly orderList = signal<CustomerOrder[]>([]);
  private ordersReady: Promise<void> = Promise.resolve();
  readonly orders = this.orderList.asReadonly();
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      this.currentUserId = userId;
      this.orderList.set([]);
      this.errorMessage.set('');
      const version = ++this.loadVersion;
      if (!userId) {
        this.loading.set(false);
        this.ordersReady = Promise.resolve();
        return;
      }

      this.loading.set(true);
      this.ordersReady = this.loadUserOrders(userId, version);
      void this.ordersReady.catch(() => undefined);
    });
  }

  async placeOrder(details: ShippingDetails, cartItems: CartItem[]): Promise<string> {
    const userId = this.auth.user()?.id;
    if (!userId) throw new Error('Log in before placing an order.');
    if (!cartItems.length) throw new Error('Your cart is empty.');

    const { data, error } = await this.supabase.requireClient().rpc('place_order', {
      p_customer_name: details.customerName.trim(),
      p_email: details.email.trim(),
      p_address_line1: details.addressLine1.trim(),
      p_address_line2: details.addressLine2.trim(),
      p_city: details.city.trim(),
      p_state_region: details.stateRegion.trim(),
      p_postal_code: details.postalCode.trim(),
      p_country: details.country.trim(),
      p_items: cartItems.map(({ product, quantity }) => ({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity,
      })),
    });
    if (error) throw error;
    if (this.auth.user()?.id !== userId || this.currentUserId !== userId) {
      throw new Error('Your sign-in changed while placing the order. Check My Orders before retrying.');
    }
    const orderItems = cartItems.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    }));
    this.loadVersion++;
    this.orderList.update((orders) => [
      {
        id: data,
        status: 'placed',
        createdAt: new Date().toISOString(),
        totalAmount: orderItems.reduce((total, item) => total + item.lineTotal, 0),
        items: orderItems,
      },
      ...orders,
    ]);
    this.loading.set(false);
    this.errorMessage.set('');
    return data;
  }

  reload(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const version = ++this.loadVersion;
    this.errorMessage.set('');
    this.loading.set(true);
    this.ordersReady = this.loadUserOrders(userId, version);
    void this.ordersReady.catch(() => undefined);
  }

  private async loadUserOrders(userId: string, version: number): Promise<void> {
    try {
      const client = this.supabase.requireClient();
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('id, status, created_at, total_amount')
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;
      if (!this.isCurrentLoad(userId, version)) return;

      const orderRows = orders ?? [];
      if (!orderRows.length) {
        this.orderList.set([]);
        return;
      }

      const orderIds = orderRows.map((order) => order.id);
      const { data: items, error: itemsError } = await client
        .from('order_items')
        .select('order_id, product_id, product_name, unit_price, quantity, line_total')
        .in('order_id', orderIds);
      if (itemsError) throw itemsError;

      const itemsByOrder = new Map<string, OrderLine[]>();
      for (const item of items ?? []) {
        const orderItems = itemsByOrder.get(item.order_id) ?? [];
        orderItems.push({
          productId: item.product_id,
          productName: item.product_name,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          lineTotal: item.line_total,
        });
        itemsByOrder.set(item.order_id, orderItems);
      }

      if (this.isCurrentLoad(userId, version)) {
        this.orderList.set(
          orderRows.map((order) => ({
            id: order.id,
            status: order.status,
            createdAt: order.created_at,
            totalAmount: order.total_amount,
            items: itemsByOrder.get(order.id) ?? [],
          })),
        );
      }
    } catch (error) {
      if (this.isCurrentLoad(userId, version)) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Your order history could not be loaded.',
        );
      }
      throw error;
    } finally {
      if (this.isCurrentLoad(userId, version)) this.loading.set(false);
    }
  }

  private isCurrentLoad(userId: string, version: number): boolean {
    return this.currentUserId === userId && this.loadVersion === version;
  }
}
