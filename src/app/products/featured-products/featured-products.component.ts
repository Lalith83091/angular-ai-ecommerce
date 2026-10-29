import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Product } from '../product.model';
import { ProductService } from '../product.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
})
export class FeaturedProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.productService
      .getProducts({
        searchTerm: '',
        categorySlug: '',
        priceOrder: 'featured',
        skip: 0,
        limit: 4,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.products.set(page.products);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Featured products could not be loaded.',
          );
          this.loading.set(false);
        },
      });
  }
}
