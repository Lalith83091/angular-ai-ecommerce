import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProductListComponent } from './products/product-list/product-list.component';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';
import { AboutComponent } from './pages/about.component';
import { ServicesComponent } from './pages/services.component';
import { ContactComponent } from './pages/contact.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { authGuard } from './auth/auth.guard';
import { WishlistComponent } from './wishlist/wishlist.component';
import { CheckoutComponent } from './orders/checkout/checkout.component';
import { OrdersComponent } from './orders/orders.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Angular AI | Smart Shopping' },
  { path: 'products', component: ProductListComponent, title: 'Products | Angular AI' },
  { path: 'products/:id', component: ProductDetailComponent, title: 'Product | Angular AI' },
  { path: 'about', component: AboutComponent, title: 'About | Angular AI' },
  { path: 'services', component: ServicesComponent, title: 'Services | Angular AI' },
  { path: 'contact', component: ContactComponent, title: 'Contact | Angular AI' },
  { path: 'cart', component: CartComponent, title: 'Your Cart | Angular AI' },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
    title: 'Checkout | Angular AI',
  },
  {
    path: 'wishlist',
    component: WishlistComponent,
    canActivate: [authGuard],
    title: 'Wishlist | Angular AI',
  },
  { path: 'login', component: LoginComponent, title: 'Login | Angular AI' },
  { path: 'signup', component: SignupComponent, title: 'Sign Up | Angular AI' },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Reset Password | Angular AI' },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    title: 'Profile | Angular AI',
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard],
    title: 'My Orders | Angular AI',
  },
  { path: '**', redirectTo: '' },
];
