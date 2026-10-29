import { effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Product } from '../products/product.model';
import { ProductService } from '../products/product.service';
import { SupabaseClientService } from '../shared/supabase-client.service';

interface StoredWishlistItem {
  product_id: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly auth = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly wishlistItems = signal<Product[]>([]);
  private currentUserId: string | null = null;
  private loadVersion = 0;
  private wishlistReady: Promise<void> = Promise.resolve();
  readonly items = this.wishlistItems.asReadonly();
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      this.currentUserId = userId;
      this.wishlistItems.set([]);
      this.errorMessage.set('');
      const version = ++this.loadVersion;
      if (!userId) {
        this.loading.set(false);
        this.wishlistReady = Promise.resolve();
        return;
      }

      this.loading.set(true);
      this.wishlistReady = this.loadUserWishlist(userId, version);
      void this.wishlistReady.catch(() => undefined);
    });
  }

  contains(productId: string): boolean {
    return this.wishlistItems().some((product) => product.id === productId);
  }

  async add(product: Product): Promise<void> {
    const userId = this.requireUserId();
    await this.wishlistReady;
    this.assertSameUser(userId);
    if (this.contains(product.id)) return;

    const { error } = await this.supabase
      .requireClient()
      .from('wishlists')
      .upsert(
        { user_id: userId, product_id: product.id },
        { onConflict: 'user_id,product_id' },
      );
    if (error) throw error;
    this.assertSameUser(userId);
    this.wishlistItems.update((items) =>
      items.some((item) => item.id === product.id) ? items : [...items, product],
    );
    this.errorMessage.set('');
  }

  async remove(productId: string): Promise<void> {
    const userId = this.requireUserId();
    await this.wishlistReady;
    this.assertSameUser(userId);
    const { error } = await this.supabase
      .requireClient()
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
    this.assertSameUser(userId);
    this.wishlistItems.update((items) => items.filter((item) => item.id !== productId));
    this.errorMessage.set('');
  }

  private async loadUserWishlist(userId: string, version: number): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .requireClient()
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId);
      if (error) throw error;

      const products = await Promise.all(
        (data ?? []).map((item: StoredWishlistItem) =>
          firstValueFrom(this.productService.getProductById(item.product_id)),
        ),
      );
      if (this.isCurrentLoad(userId, version)) this.wishlistItems.set(products);
    } catch (error) {
      if (this.isCurrentLoad(userId, version)) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Your saved wishlist could not be loaded.',
        );
      }
      throw error;
    } finally {
      if (this.isCurrentLoad(userId, version)) this.loading.set(false);
    }
  }

  private requireUserId(): string {
    const userId = this.auth.user()?.id;
    if (!userId) throw new Error('Log in to save products to your wishlist.');
    return userId;
  }

  private isCurrentLoad(userId: string, version: number): boolean {
    return this.currentUserId === userId && this.loadVersion === version;
  }

  private assertSameUser(userId: string): void {
    if (this.auth.user()?.id !== userId || this.currentUserId !== userId) {
      throw new Error('Your sign-in changed. Please try the wishlist action again.');
    }
  }
}
