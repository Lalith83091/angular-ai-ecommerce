import { TestBed } from '@angular/core/testing';
import { OrderService, ShippingDetails } from './order.service';

const shippingDetails: ShippingDetails = {
  customerName: 'Sample Customer',
  email: 'customer@example.com',
  addressLine1: '10 Main Street',
  addressLine2: '',
  city: 'Sample City',
  stateRegion: '',
  postalCode: '12345',
  country: 'US',
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    service = TestBed.inject(OrderService);
  });

  it('requires an authenticated user before placing an order', async () => {
    await expect(service.placeOrder(shippingDetails, [])).rejects.toThrow(
      'Log in before placing an order',
    );
  });
});
