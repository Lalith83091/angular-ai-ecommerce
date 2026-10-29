import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="info-page">
      <p class="eyebrow">A little about us</p>
      <h1>Better everyday discoveries start here.</h1>
      <p>Angular AI is a sample shopping experience built around useful products, clear details, and a calmer way to explore.</p>
      <a routerLink="/products">Browse the collection <span aria-hidden="true">→</span></a>
    </section>
  `,
})
export class AboutComponent {}
