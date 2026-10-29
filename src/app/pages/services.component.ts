import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="info-page">
      <p class="eyebrow">Here to make it simple</p>
      <h1>Helpful service, from discovery to delivery.</h1>
      <p>Explore a curated catalog, compare product details, and keep your picks together in a simple shopping cart.</p>
      <a routerLink="/products">Explore products <span aria-hidden="true">→</span></a>
    </section>
  `,
})
export class ServicesComponent {}
