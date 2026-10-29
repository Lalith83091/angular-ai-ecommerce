import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../products/product-card/product-card.component';
import { WishlistService } from './wishlist.service';
import { getAuthErrorMessage } from '../auth/auth-error';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent {
  private readonly wishlist = inject(WishlistService);
  readonly products = this.wishlist.items;
  readonly loading = this.wishlist.loading;
  readonly errorMessage = this.wishlist.errorMessage;
  readonly actionError = signal('');

  async remove(productId: string): Promise<void> {
    this.actionError.set('');
    try {
      await this.wishlist.remove(productId);
    } catch (error) {
      this.actionError.set(getAuthErrorMessage(error));
    }
  }
}
