import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { getAuthErrorMessage } from '../auth-error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly recoveryMode = this.auth.isPasswordRecovery;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly passwordForm = this.formBuilder.nonNullable.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
  });

  async requestReset(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.sendPasswordReset(this.emailForm.getRawValue().email);
      this.successMessage.set('If an account exists for that email, a password reset link is on its way.');
    } catch (error) {
      this.errorMessage.set(getAuthErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async updatePassword(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.updatePassword(this.passwordForm.getRawValue().password);
      this.successMessage.set('Your password has been updated. You can now log in with it.');
    } catch (error) {
      this.errorMessage.set(getAuthErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
