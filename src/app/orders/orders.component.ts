import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from './order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent {
  private readonly orderService = inject(OrderService);
  readonly orders = this.orderService.orders;
  readonly loading = this.orderService.loading;
  readonly errorMessage = this.orderService.errorMessage;

  retry(): void {
    this.orderService.reload();
  }
}
