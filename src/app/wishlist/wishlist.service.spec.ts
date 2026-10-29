import { TestBed } from '@angular/core/testing';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  let wishlist: WishlistService;

  beforeEach(() => {
    wishlist = TestBed.inject(WishlistService);
  });

  it('requires a signed-in user before saving products', async () => {
    await expect(
      wishlist.add({
        id: '1',
        name: 'Demo product',
        price: 10,
        image: 'https://images.example/product.webp',
        images: ['https://images.example/product.webp'],
        description: 'A product for testing.',
        category: 'test',
        rating: 4.5,
        stock: 3,
        brand: null,
      }),
    ).rejects.toThrow('Log in to save products');
  });
});
