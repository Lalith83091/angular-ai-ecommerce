import { TestBed } from '@angular/core/testing';
import { Product } from '../products/product.model';
import { CartService, mergeCartItems } from './cart.service';

const product: Product = {
  id: '1',
  name: 'Demo Headphones',
  price: 129.99,
  image: 'https://images.example/headphones.webp',
  images: ['https://images.example/headphones.webp'],
  description: 'Wireless headphones for testing the cart.',
  category: 'mobile-accessories',
  rating: 4.8,
  stock: 5,
  brand: 'Demo Brand',
};

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    cart = TestBed.inject(CartService);
  });

  it('adds products, combines quantities, and calculates the subtotal', async () => {
    await cart.addToCart(product, 2);
    await cart.addToCart(product, 1);

    expect(cart.itemCount()).toBe(3);
    expect(cart.items()[0].quantity).toBe(3);
    expect(cart.subtotal()).toBeCloseTo(product.price * 3);
  });

  it('rejects out-of-stock products and can remove cart items', async () => {
    const unavailable = { ...product, id: '2', stock: 0 };
    await expect(cart.addToCart(unavailable)).rejects.toThrow('out of stock');
    expect(cart.itemCount()).toBe(0);

    await cart.addToCart(product);
    await cart.removeFromCart(product.id);
    expect(cart.items()).toEqual([]);
  });

  it('keeps requested quantities within available stock', async () => {
    await cart.addToCart(product, 20);
    expect(cart.items()[0].quantity).toBe(product.stock);
    await cart.setQuantity(product.id, 3);
    expect(cart.items()[0].quantity).toBe(3);
  });

  it('rejects non-numeric quantities', async () => {
    await expect(cart.addToCart(product, Number.NaN)).rejects.toThrow('valid product quantity');
  });

  it('merges a guest cart into saved items without exceeding stock', () => {
    const saved = [{ product, quantity: 3 }];
    const guest = [
      { product, quantity: 4 },
      { product: { ...product, id: '2' }, quantity: 2 },
    ];

    expect(mergeCartItems(saved, guest)).toEqual([
      { product, quantity: product.stock },
      { product: { ...product, id: '2' }, quantity: 2 },
    ]);
  });
});
