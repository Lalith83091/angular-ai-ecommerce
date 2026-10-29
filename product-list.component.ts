import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface Product {
  name: string;
  price: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  products: Product[] = [
    { name: 'Coffee Mug', price: 12.99 },
    { name: 'Notebook', price: 8.5 },
    { name: 'Desk Plant', price: 16.25 },
  ];

  cartCount = 0;

  addToCart(): void {
    this.cartCount += 1;
  }
}
