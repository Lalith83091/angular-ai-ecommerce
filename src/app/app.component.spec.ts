import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home/home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the home page', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the requested heading, subtitle, and shopping link', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Welcome to Angular AI');
    expect(compiled.querySelector('.hero-subtitle')?.textContent?.trim()).toBe(
      'Explore Smart Shopping with Angular and AI',
    );
    expect(compiled.querySelector('.hero-content a')?.textContent).toContain('Shop Now');
  });
});
