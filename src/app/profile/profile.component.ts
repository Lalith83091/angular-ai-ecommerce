import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { getAuthErrorMessage } from '../auth/auth-error';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  readonly user = this.auth.user;
  readonly profile = this.profileService.profile;
  readonly loading = this.profileService.loading;
  readonly saving = this.profileService.saving;
  readonly errorMessage = this.profileService.errorMessage;
  readonly actionError = signal('');
  readonly successMessage = signal('');
  readonly signingOut = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(80)]],
  });

  constructor() {
    effect(() => {
      const profile = this.profile();
      if (profile && !this.form.dirty) this.form.patchValue({ fullName: profile.fullName });
    });
  }

  async save(): Promise<void> {
    this.actionError.set('');
    this.successMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      await this.profileService.saveFullName(this.form.getRawValue().fullName);
      this.form.markAsPristine();
      this.successMessage.set('Your profile has been updated.');
    } catch (error) {
      this.actionError.set(getAuthErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    this.actionError.set('');
    this.signingOut.set(true);
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.actionError.set(getAuthErrorMessage(error));
    } finally {
      this.signingOut.set(false);
    }
  }
}
