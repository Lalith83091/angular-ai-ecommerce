import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { getAuthErrorMessage } from '../../auth/auth-error';
import { CartService } from '../../cart/cart.service';
import { OrderService } from '../order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  readonly items = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly cartLoading = this.cart.loading;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly orderId = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    customerName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    addressLine1: ['', [Validators.required, Validators.maxLength(200)]],
    addressLine2: ['', Validators.maxLength(200)],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    stateRegion: ['', Validators.maxLength(120)],
    postalCode: ['', [Validators.required, Validators.maxLength(32)]],
    country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  constructor() {
    const user = this.auth.user();
    this.form.patchValue({
      customerName: this.auth.userDisplayName(),
      email: user?.email ?? '',
    });
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    if (!this.items().length) {
      this.errorMessage.set('Your cart is empty. Add a product before checking out.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const createdOrderId = await this.orders.placeOrder(this.form.getRawValue(), this.items());
      this.cart.clearAfterCheckout();
      this.orderId.set(createdOrderId);
    } catch (error) {
      this.errorMessage.set(getAuthErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
