import { Directive, ElementRef, HostListener, inject } from '@angular/core';

const FALLBACK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"%3E%3Crect width="640" height="480" fill="%23eef0f7"/%3E%3Cpath d="M170 330l95-105 70 75 55-55 90 85H170z" fill="%23c6cbe0"/%3E%3Ccircle cx="420" cy="155" r="32" fill="%23c6cbe0"/%3E%3C/svg%3E';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  private readonly element = inject(ElementRef<HTMLImageElement>);
  private hasUsedFallback = false;

  @HostListener('error')
  useFallback(): void {
    if (this.hasUsedFallback) return;
    this.hasUsedFallback = true;
    this.element.nativeElement.src = FALLBACK_IMAGE;
  }
}
