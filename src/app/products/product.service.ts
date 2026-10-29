import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  DummyJsonProduct,
  PriceOrder,
  Product,
  ProductApiResponse,
  ProductCategory,
  ProductPage,
  ProductQuery,
} from './product.model';

const API_URL = 'https://dummyjson.com/products';

export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found.');
    this.name = 'ProductNotFoundError';
  }
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getProducts(query: ProductQuery): Observable<ProductPage> {
    if (query.searchTerm.trim()) {
      const params = new HttpParams()
        .set('q', query.searchTerm.trim())
        .set('limit', 0)
        .set('skip', 0);

      return this.http.get<ProductApiResponse>(`${API_URL}/search`, { params }).pipe(
        map((response) =>
          this.filterSortAndPage(
            response.products,
            response.total,
            query.categorySlug,
            query.priceOrder,
            query.skip,
            query.limit,
          ),
        ),
        catchError((error: unknown) =>
          throwError(() => this.toApiError(error, 'load search results')),
        ),
      );
    }

    const endpoint = query.categorySlug
      ? `${API_URL}/category/${encodeURIComponent(query.categorySlug)}`
      : API_URL;
    let params = new HttpParams().set('limit', query.limit).set('skip', query.skip);
    const sortOrder = this.toApiSortOrder(query.priceOrder);
    if (sortOrder) {
      params = params.set('sortBy', 'price').set('order', sortOrder);
    }

    return this.http.get<ProductApiResponse>(endpoint, { params }).pipe(
      map((response) => ({
        products: response.products.map((product) => this.mapProduct(product)),
        total: response.total,
        skip: response.skip,
        limit: response.limit,
      })),
      catchError((error: unknown) =>
        throwError(() => this.toApiError(error, 'load products')),
      ),
    );
  }

  getProductById(id: string): Observable<Product> {
    if (!/^\d+$/.test(id)) {
      return throwError(() => new ProductNotFoundError());
    }

    return this.http.get<DummyJsonProduct>(`${API_URL}/${id}`).pipe(
      map((product) => this.mapProduct(product)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return throwError(() => new ProductNotFoundError());
        }
        return throwError(() => this.toApiError(error, 'load this product'));
      }),
    );
  }

  getCategories(): Observable<ProductCategory[]> {
    return this.http.get<Array<string | { slug: string; name: string }>>(`${API_URL}/categories`).pipe(
      map((categories) =>
        categories
          .map((category) =>
            typeof category === 'string'
              ? { slug: category, name: this.toCategoryName(category) }
              : { slug: category.slug, name: category.name },
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      ),
      catchError((error: unknown) =>
        throwError(() => this.toApiError(error, 'load product categories')),
      ),
    );
  }

  private mapProduct(product: DummyJsonProduct): Product {
    const images = product.images?.length
      ? product.images
      : product.thumbnail
        ? [product.thumbnail]
        : [];
    return {
      id: String(product.id),
      name: product.title,
      price: product.price,
      image: product.thumbnail || images[0] || '',
      images,
      description: product.description,
      category: product.category,
      rating: product.rating,
      stock: product.stock,
      brand: product.brand ?? null,
    };
  }

  private filterSortAndPage(
    products: DummyJsonProduct[],
    total: number,
    categorySlug: string,
    priceOrder: PriceOrder,
    skip: number,
    limit: number,
  ): ProductPage {
    let filtered = products.map((product) => this.mapProduct(product));
    if (categorySlug) {
      filtered = filtered.filter((product) => product.category === categorySlug);
    }
    if (priceOrder === 'low-high') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceOrder === 'high-low') {
      filtered.sort((a, b) => b.price - a.price);
    }
    return {
      products: filtered.slice(skip, skip + limit),
      total: categorySlug ? filtered.length : total,
      skip,
      limit,
    };
  }

  private toApiSortOrder(order: PriceOrder): 'asc' | 'desc' | null {
    if (order === 'low-high') return 'asc';
    if (order === 'high-low') return 'desc';
    return null;
  }

  private toCategoryName(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private toApiError(error: unknown, action: string): Error {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return new Error(`Could not reach DummyJSON to ${action}. Check your internet connection and try again.`);
    }
    if (error instanceof HttpErrorResponse) {
      return new Error(`DummyJSON could not ${action} (HTTP ${error.status}). Please try again.`);
    }
    return error instanceof Error
      ? error
      : new Error(`An unexpected error occurred while trying to ${action}.`);
  }
}
