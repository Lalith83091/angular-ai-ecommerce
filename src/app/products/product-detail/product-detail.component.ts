import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, map, Subject, switchMap, tap } from 'rxjs';
import { CartService } from '../../cart/cart.service';
import { ImageFallbackDirective } from '../../shared/image-fallback.directive';
import { Product } from '../product.model';
import { ProductNotFoundError, ProductService } from '../product.service';
import { WishlistService } from '../../wishlist/wishlist.service';
import { getAuthErrorMessage } from '../../auth/auth-error';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ImageFallbackDirective],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productIds = new Subject<string>();
  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly productNotFound = signal(false);
  readonly quantity = signal(1);
  readonly selectedImage = signal(0);
  readonly addedMessage = signal('');
  readonly wishlistError = signal('');
  readonly wishlistMessage = signal('');
  readonly savingToWishlist = signal(false);

  isWishlisted(productId: string): boolean {
    return this.wishlist.contains(productId);
  }

  ngOnInit(): void {
    this.productIds
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.product.set(null);
          this.errorMessage.set('');
          this.productNotFound.set(false);
          this.selectedImage.set(0);
          this.quantity.set(1);
          this.addedMessage.set('');
          return this.productService.getProductById(id).pipe(
            tap((product) => this.product.set(product)),
            catchError((error: unknown) => {
              this.productNotFound.set(error instanceof ProductNotFoundError);
              this.errorMessage.set(
                error instanceof Error ? error.message : 'Unable to load this product.',
              );
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => this.productIds.next(id));
  }

  updateQuantity(event: Event): void {
    const input = event.target;
    const product = this.product();
    if (!(input instanceof HTMLInputElement) || !product) return;
    const parsed = Number.parseInt(input.value, 10);
    this.quantity.set(
      Math.max(1, Math.min(Number.isNaN(parsed) ? 1 : parsed, Math.max(product.stock, 1))),
    );
    input.value = String(this.quantity());
  }

  selectImage(index: number): void {
    const product = this.product();
    if (product && index >= 0 && index < product.images.length) {
      this.selectedImage.set(index);
    }
  }

  async addToCart(): Promise<void> {
    const product = this.product();
    if (!product || product.stock < 1) return;
    this.addedMessage.set('');
    this.errorMessage.set('');
    try {
      await this.cart.addToCart(product, this.quantity());
      this.addedMessage.set(`${this.quantity()} added to your cart.`);
    } catch (error) {
      this.errorMessage.set(getAuthErrorMessage(error));
    }
  }

  async toggleWishlist(): Promise<void> {
    const product = this.product();
    if (!product || this.savingToWishlist()) return;
    this.wishlistError.set('');
    this.wishlistMessage.set('');
    this.savingToWishlist.set(true);
    try {
      if (this.wishlist.contains(product.id)) {
        await this.wishlist.remove(product.id);
        this.wishlistMessage.set('Removed from your wishlist.');
      } else {
        await this.wishlist.add(product);
        this.wishlistMessage.set('Saved to your wishlist.');
      }
    } catch (error) {
      this.wishlistError.set(getAuthErrorMessage(error));
    } finally {
      this.savingToWishlist.set(false);
    }
  }

  retry(): void {
    this.productIds.next(this.route.snapshot.paramMap.get('id') ?? '');
  }
}
