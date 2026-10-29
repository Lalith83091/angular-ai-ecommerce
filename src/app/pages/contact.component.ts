import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="info-page">
      <p class="eyebrow">We'd love to hear from you</p>
      <h1>How can we help?</h1>
      <p>For questions about products or this demo storefront, email <a href="mailto:hello@angularai.example">hello&#64;angularai.example</a>.</p>
      <a routerLink="/products">Continue shopping <span aria-hidden="true">→</span></a>
    </section>
  `,
})
export class ContactComponent {}
