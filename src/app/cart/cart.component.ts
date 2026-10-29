import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from './cart.service';
import { ImageFallbackDirective } from '../shared/image-fallback.directive';
import { getAuthErrorMessage } from '../auth/auth-error';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ImageFallbackDirective],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  private readonly cart = inject(CartService);
  readonly items = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly loading = this.cart.loading;
  readonly errorMessage = this.cart.errorMessage;
  readonly actionError = signal('');

  async changeQuantity(productId: string, quantity: number): Promise<void> {
    this.actionError.set('');
    try {
      await this.cart.setQuantity(productId, quantity);
    } catch (error) {
      this.actionError.set(getAuthErrorMessage(error));
    }
  }

  async remove(productId: string): Promise<void> {
    this.actionError.set('');
    try {
      await this.cart.removeFromCart(productId);
    } catch (error) {
      this.actionError.set(getAuthErrorMessage(error));
    }
  }
}
