export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  category: string;
  rating: number;
  stock: number;
  brand: string | null;
}

export interface ProductApiResponse {
  products: DummyJsonProduct[];
  total: number;
  skip: number;
  limit: number;
}

export interface DummyJsonProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail?: string;
  images?: string[];
}

export interface ProductCategory {
  slug: string;
  name: string;
}

export type PriceOrder = 'featured' | 'low-high' | 'high-low';

export interface ProductQuery {
  searchTerm: string;
  categorySlug: string;
  priceOrder: PriceOrder;
  skip: number;
  limit: number;
}

export interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
