import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageWithTextComponent } from '../shared/image-with-text/image-with-text.component';
import { FeaturedProductsComponent } from '../products/featured-products/featured-products.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ImageWithTextComponent, FeaturedProductsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
