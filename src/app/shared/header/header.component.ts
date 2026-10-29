import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../cart/cart.service';
import { AuthService } from '../../auth/auth.service';
import { getAuthErrorMessage } from '../../auth/auth-error';
import { WishlistService } from '../../wishlist/wishlist.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly menuOpen = signal(false);
  readonly cartCount = inject(CartService).itemCount;
  readonly wishlistCount = inject(WishlistService).items;
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly userDisplayName = this.auth.userDisplayName;
  readonly signingOut = signal(false);
  readonly signOutError = signal('');

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  async signOut(): Promise<void> {
    this.signOutError.set('');
    this.signingOut.set(true);
    try {
      await this.auth.signOut();
      this.closeMenu();
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.signOutError.set(getAuthErrorMessage(error));
    } finally {
      this.signingOut.set(false);
    }
  }
}
