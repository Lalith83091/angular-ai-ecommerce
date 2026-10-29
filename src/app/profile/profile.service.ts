import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SupabaseClientService } from '../shared/supabase-client.service';

export interface UserProfile {
  fullName: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);
  private currentUserId: string | null = null;
  private loadVersion = 0;
  private readonly currentProfile = signal<UserProfile | null>(null);
  readonly profile = this.currentProfile.asReadonly();
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      this.currentUserId = userId;
      this.currentProfile.set(null);
      this.errorMessage.set('');
      const version = ++this.loadVersion;
      if (!userId) {
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      void this.loadProfile(userId, version).catch(() => undefined);
    });
  }

  async saveFullName(fullName: string): Promise<void> {
    const userId = this.auth.user()?.id;
    const trimmedName = fullName.trim();
    if (!userId) throw new Error('Log in to update your profile.');
    if (!trimmedName || trimmedName.length > 80) {
      throw new Error('Enter a name between 1 and 80 characters.');
    }

    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const { data, error } = await this.supabase
        .requireClient()
        .from('user_profiles')
        .update({ full_name: trimmedName })
        .eq('user_id', userId)
        .select('full_name, created_at')
        .single();
      if (error) throw error;
      if (this.auth.user()?.id !== userId || this.currentUserId !== userId) {
        throw new Error('Your sign-in changed. Please try the profile update again.');
      }

      this.currentProfile.set({ fullName: data.full_name, createdAt: data.created_at });
      try {
        await this.auth.updateFullName(trimmedName);
      } catch (error) {
        throw new Error(
          `Your profile was saved, but the header name could not be refreshed: ${
            error instanceof Error ? error.message : 'Please try again.'
          }`,
        );
      }
    } finally {
      this.saving.set(false);
    }
  }

  private async loadProfile(userId: string, version: number): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .requireClient()
        .from('user_profiles')
        .select('full_name, created_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error('Your profile record is missing. Confirm that the user-profile migration has been run.');
      }
      if (this.isCurrentLoad(userId, version)) {
        this.currentProfile.set({ fullName: data.full_name, createdAt: data.created_at });
      }
    } catch (error) {
      if (this.isCurrentLoad(userId, version)) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Your profile could not be loaded.',
        );
      }
      throw error;
    } finally {
      if (this.isCurrentLoad(userId, version)) this.loading.set(false);
    }
  }

  private isCurrentLoad(userId: string, version: number): boolean {
    return this.currentUserId === userId && this.loadVersion === version;
  }
}
