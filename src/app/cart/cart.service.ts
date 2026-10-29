import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Product } from '../products/product.model';
import { ProductService } from '../products/product.service';
import { SupabaseClientService } from '../shared/supabase-client.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

export function mergeCartItems(savedItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const itemsById = new Map(savedItems.map((item) => [item.product.id, item]));
  for (const guestItem of guestItems) {
    const savedItem = itemsById.get(guestItem.product.id);
    const quantity = Math.min(
      (savedItem?.quantity ?? 0) + guestItem.quantity,
      guestItem.product.stock,
      99,
    );
    itemsById.set(guestItem.product.id, {
      product: savedItem?.product ?? guestItem.product,
      quantity,
    });
  }
  return [...itemsById.values()];
}

interface StoredCartItem {
  product_id: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly auth = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly cartItems = signal<CartItem[]>([]);
  private readonly cartId = signal<string | null>(null);
  private currentUserId: string | null = null;
  private loadVersion = 0;
  private cartReady: Promise<void> = Promise.resolve();
  readonly items = this.cartItems.asReadonly();
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly itemCount = computed(() =>
    this.cartItems().reduce((count, item) => count + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.product.price * item.quantity, 0),
  );

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      const guestItems =
        this.currentUserId === null && userId !== null ? this.cartItems() : [];
      this.currentUserId = userId;
      this.cartItems.set(guestItems);
      this.cartId.set(null);
      this.errorMessage.set('');
      const version = ++this.loadVersion;
      if (!userId) {
        this.loading.set(false);
        this.cartReady = Promise.resolve();
        return;
      }

      this.loading.set(true);
      this.cartReady = this.loadUserCart(userId, version, guestItems);
      void this.cartReady.catch(() => undefined);
    });
  }

  async addToCart(product: Product, quantity = 1): Promise<void> {
    if (!Number.isFinite(quantity)) throw new Error('Enter a valid product quantity.');
    if (product.stock < 1) throw new Error('This product is out of stock.');
    const userId = this.auth.user()?.id ?? null;
    if (userId) await this.cartReady;
    this.assertSameUser(userId);

    const safeQuantity = Math.min(Math.max(1, Math.floor(quantity)), product.stock, 99);
    const existing = this.cartItems().find((item) => item.product.id === product.id);
    const nextQuantity = Math.min((existing?.quantity ?? 0) + safeQuantity, product.stock);
    if (userId) await this.saveItem(userId, product.id, nextQuantity);
    this.assertSameUser(userId);

    this.cartItems.update((items) => {
      const updatedItem = { product, quantity: nextQuantity };
      return existing
        ? items.map((item) => (item.product.id === product.id ? updatedItem : item))
        : [...items, updatedItem];
    });
    this.errorMessage.set('');
  }

  async setQuantity(productId: string, quantity: number): Promise<void> {
    if (!Number.isFinite(quantity)) throw new Error('Enter a valid product quantity.');
    const requestedQuantity = Math.floor(quantity);
    if (requestedQuantity < 1) {
      await this.removeFromCart(productId);
      return;
    }

    const item = this.cartItems().find((cartItem) => cartItem.product.id === productId);
    if (!item) return;
    if (item.product.stock < 1) throw new Error('This product is out of stock.');
    const safeQuantity = Math.min(requestedQuantity, item.product.stock, 99);
    const userId = this.auth.user()?.id ?? null;
    if (userId) await this.cartReady;
    this.assertSameUser(userId);
    if (userId) await this.saveItem(userId, productId, safeQuantity);
    this.assertSameUser(userId);

    this.cartItems.update((items) =>
      items.map((cartItem) =>
        cartItem.product.id === productId ? { ...cartItem, quantity: safeQuantity } : cartItem,
      ),
    );
    this.errorMessage.set('');
  }

  async removeFromCart(productId: string): Promise<void> {
    const userId = this.auth.user()?.id ?? null;
    if (userId) await this.cartReady;
    this.assertSameUser(userId);
    const currentCartId = this.cartId();
    if (userId && currentCartId) {
      const { error } = await this.supabase
        .requireClient()
        .from('cart_items')
        .delete()
        .eq('cart_id', currentCartId)
        .eq('product_id', productId);
      if (error) throw error;
    }
    this.assertSameUser(userId);
    this.cartItems.update((items) => items.filter((item) => item.product.id !== productId));
    this.errorMessage.set('');
  }

  clearAfterCheckout(): void {
    this.cartItems.set([]);
    this.errorMessage.set('');
  }

  private async loadUserCart(
    userId: string,
    version: number,
    guestItems: CartItem[],
  ): Promise<void> {
    try {
      const client = this.supabase.requireClient();
      const { data: existingCart, error: cartError } = await client
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (cartError) throw cartError;

      let activeCart = existingCart;
      if (!activeCart) {
        const { data, error } = await client
          .from('carts')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (error?.code === '23505') {
          const { data: concurrentCart, error: retryError } = await client
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();
          if (retryError) throw retryError;
          activeCart = concurrentCart;
        } else if (error) {
          throw error;
        } else {
          activeCart = data;
        }
      }
      if (!activeCart || !this.isCurrentLoad(userId, version)) return;
      this.cartId.set(activeCart.id);

      const { data: storedItems, error: itemsError } = await client
        .from('cart_items')
        .select('product_id, quantity')
        .eq('cart_id', activeCart.id);
      if (itemsError) throw itemsError;

      const savedItems = await Promise.all(
        (storedItems ?? []).map(async (storedItem: StoredCartItem) => ({
          product: await firstValueFrom(this.productService.getProductById(storedItem.product_id)),
          quantity: storedItem.quantity,
        })),
      );
      if (!this.isCurrentLoad(userId, version)) return;

      const mergedItems = mergeCartItems(savedItems, guestItems);
      const itemsById = new Map(mergedItems.map((item) => [item.product.id, item]));
      this.cartItems.set(mergedItems);
      await Promise.all(
        guestItems.map(async (guestItem) => {
          const mergedItem = itemsById.get(guestItem.product.id);
          if (!mergedItem) return;
          const { error } = await client
            .from('cart_items')
            .upsert(
              {
                cart_id: activeCart.id,
                product_id: guestItem.product.id,
                quantity: mergedItem.quantity,
              },
              { onConflict: 'cart_id,product_id' },
            );
          if (error) throw error;
        }),
      );
    } catch (error) {
      if (this.isCurrentLoad(userId, version)) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Your saved cart could not be loaded.',
        );
      }
      throw error;
    } finally {
      if (this.isCurrentLoad(userId, version)) this.loading.set(false);
    }
  }

  private async saveItem(userId: string, productId: string, quantity: number): Promise<void> {
    this.assertSameUser(userId);
    const activeCartId = this.cartId();
    if (!activeCartId) throw new Error('Your saved cart is still loading. Please try again.');
    const { error } = await this.supabase
      .requireClient()
      .from('cart_items')
      .upsert(
        { cart_id: activeCartId, product_id: productId, quantity },
        { onConflict: 'cart_id,product_id' },
      );
    if (error) throw error;
  }

  private isCurrentLoad(userId: string, version: number): boolean {
    return this.currentUserId === userId && this.loadVersion === version;
  }

  private assertSameUser(userId: string | null): void {
    if ((this.auth.user()?.id ?? null) !== userId || this.currentUserId !== userId) {
      throw new Error('Your sign-in changed. Please try the cart action again.');
    }
  }
}
