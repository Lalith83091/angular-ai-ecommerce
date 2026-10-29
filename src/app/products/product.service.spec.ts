import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DummyJsonProduct, ProductApiResponse, ProductQuery } from './product.model';
import { ProductNotFoundError, ProductService } from './product.service';

const API_URL = 'https://dummyjson.com/products';

function makeProduct(
  id: number,
  title: string,
  price: number,
  category = 'mobile-accessories',
): DummyJsonProduct {
  return {
    id,
    title,
    description: `${title} description`,
    category,
    price,
    rating: 4.5,
    stock: 10,
    brand: 'Demo Brand',
    thumbnail: `https://images.example/${id}-thumbnail.webp`,
    images: [`https://images.example/${id}-1.webp`, `https://images.example/${id}-2.webp`],
  };
}

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses server pagination and price sorting for the unfiltered catalog', () => {
    const query: ProductQuery = {
      searchTerm: '',
      categorySlug: '',
      priceOrder: 'low-high',
      skip: 12,
      limit: 12,
    };
    let response: ProductApiResponse | undefined;
    let mappedName = '';

    service.getProducts(query).subscribe((page) => {
      response = {
        products: [],
        total: page.total,
        skip: page.skip,
        limit: page.limit,
      };
      mappedName = page.products[0]?.name ?? '';
    });
    const request = http.expectOne(
      (req) =>
        req.url === API_URL &&
        req.params.get('limit') === '12' &&
        req.params.get('skip') === '12' &&
        req.params.get('sortBy') === 'price' &&
        req.params.get('order') === 'asc',
    );
    request.flush({
      products: [makeProduct(21, 'USB-C Charger', 19.99)],
      total: 40,
      skip: 12,
      limit: 12,
    });

    expect(response).toEqual({ products: [], total: 40, skip: 12, limit: 12 });
    expect(mappedName).toBe('USB-C Charger');
  });

  it('filters search/category combinations, sorts, and paginates consistently', () => {
    const query: ProductQuery = {
      searchTerm: 'phone',
      categorySlug: 'mobile-accessories',
      priceOrder: 'low-high',
      skip: 1,
      limit: 1,
    };
    let result: { names: string[]; total: number } | undefined;

    service.getProducts(query).subscribe((page) => {
      result = { names: page.products.map((product) => product.name), total: page.total };
    });
    const request = http.expectOne(
      (req) =>
        req.url === `${API_URL}/search` &&
        req.params.get('q') === 'phone' &&
        req.params.get('limit') === '0',
    );
    request.flush({
      products: [
        makeProduct(1, 'Premium Phone', 200, 'smartphones'),
        makeProduct(2, 'Phone Charger', 20),
        makeProduct(3, 'Phone Case', 5, 'mobile-accessories'),
      ],
      total: 3,
      skip: 0,
      limit: 0,
    });

    expect(result).toEqual({ names: ['Phone Charger'], total: 2 });
  });

  it('normalizes DummyJSON categories for the filter controls', () => {
    let categories: Array<{ slug: string; name: string }> = [];
    service.getCategories().subscribe((value) => (categories = value));
    http.expectOne(`${API_URL}/categories`).flush([
      { slug: 'mobile-accessories', name: 'Mobile Accessories', url: `${API_URL}/category/mobile-accessories` },
      { slug: 'smartphones', name: 'Smartphones', url: `${API_URL}/category/smartphones` },
    ]);

    expect(categories.map((category) => category.name)).toEqual([
      'Mobile Accessories',
      'Smartphones',
    ]);
  });

  it('loads one product and maps its detail images and USD price', () => {
    let productName = '';
    let productImages: string[] = [];
    service.getProductById('2').subscribe((product) => {
      productName = product.name;
      productImages = product.images;
    });
    http.expectOne(`${API_URL}/2`).flush(makeProduct(2, 'Smartphone', 499.99));

    expect(productName).toBe('Smartphone');
    expect(productImages).toHaveLength(2);
  });

  it('reports an invalid product ID as not found without making a request', () => {
    let error: unknown;
    service.getProductById('bad-id').subscribe({ error: (value: unknown) => (error = value) });
    expect(error).toBeInstanceOf(ProductNotFoundError);
  });

  it('maps an API 404 to the product-not-found error', () => {
    let error: unknown;
    service.getProductById('9999').subscribe({ error: (value: unknown) => (error = value) });
    http.expectOne(`${API_URL}/9999`).flush(
      { message: 'Product with id 9999 not found' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(error).toBeInstanceOf(ProductNotFoundError);
  });
});
