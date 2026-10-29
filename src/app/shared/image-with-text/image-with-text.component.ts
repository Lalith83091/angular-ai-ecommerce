import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageFallbackDirective } from '../image-fallback.directive';

@Component({
  selector: 'app-image-with-text',
  standalone: true,
  imports: [RouterLink, ImageFallbackDirective],
  templateUrl: './image-with-text.component.html',
  styleUrl: './image-with-text.component.css',
})
export class ImageWithTextComponent {}
