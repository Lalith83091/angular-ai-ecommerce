import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  it('accepts a correctly formatted Gmail address with mixed casing', async () => {
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SignupComponent);
    const email = fixture.componentInstance.form.controls.email;
    email.setValue('Demo@gmail.com');

    expect(email.valid).toBe(true);
  });
});
