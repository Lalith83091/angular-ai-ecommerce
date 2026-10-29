import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, EMPTY, finalize, Subject, switchMap } from 'rxjs';
import { ProductCardComponent } from '../product-card/product-card.component';
import { PriceOrder, Product, ProductCategory, ProductQuery } from '../product.model';
import { ProductService } from '../product.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries = new Subject<ProductQuery>();
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly priceOrder = signal<PriceOrder>('featured');
  readonly categories = signal<ProductCategory[]>([]);
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly categoriesLoading = signal(true);
  readonly errorMessage = signal('');
  readonly categoryError = signal('');

  ngOnInit(): void {
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.categoriesLoading.set(false);
        },
        error: (error: unknown) => {
          this.categoryError.set(this.getErrorMessage(error));
          this.categoriesLoading.set(false);
        },
      });

    this.queries
      .pipe(
        debounceTime(250),
        switchMap((query) => {
          this.loading.set(true);
          this.errorMessage.set('');
          return this.productService.getProducts(query).pipe(
            catchError((error: unknown) => {
              this.errorMessage.set(this.getErrorMessage(error));
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.products.update((current) =>
          page.skip === 0 ? page.products : [...current, ...page.products],
        );
        this.total.set(page.total);
      });

    this.loadFirstPage();
  }

  updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchTerm.set(input.value);
      this.loadFirstPage();
    }
  }

  updateCategory(event: Event): void {
    const select = event.target;
    if (select instanceof HTMLSelectElement) {
      this.selectedCategory.set(select.value);
      this.loadFirstPage();
    }
  }

  updatePriceOrder(event: Event): void {
    const select = event.target;
    if (
      select instanceof HTMLSelectElement &&
      ['featured', 'low-high', 'high-low'].includes(select.value)
    ) {
      this.priceOrder.set(select.value as PriceOrder);
      this.loadFirstPage();
    }
  }

  loadMore(): void {
    if (this.loading() || this.products().length >= this.total()) return;
    this.queries.next(this.createQuery(this.products().length));
  }

  retry(): void {
    if (this.products().length) {
      this.errorMessage.set('');
      this.queries.next(this.createQuery(this.products().length));
      return;
    }
    this.loadFirstPage();
  }

  private loadFirstPage(): void {
    this.products.set([]);
    this.total.set(0);
    this.errorMessage.set('');
    this.loading.set(true);
    this.queries.next(this.createQuery(0));
  }

  private createQuery(skip: number): ProductQuery {
    return {
      searchTerm: this.searchTerm(),
      categorySlug: this.selectedCategory(),
      priceOrder: this.priceOrder(),
      skip,
      limit: PAGE_SIZE,
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}
