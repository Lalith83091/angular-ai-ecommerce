import { computed, inject, Injectable, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseClientService } from '../shared/supabase-client.service';

export interface SignUpResult {
  requiresEmailConfirmation: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly currentUser = signal<User | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isReady = signal(false);
  readonly isPasswordRecovery = signal(false);
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    const fullName = user?.user_metadata['full_name'];
    return typeof fullName === 'string' && fullName.trim()
      ? fullName.trim()
      : (user?.email?.split('@')[0] ?? '');
  });
  readonly isConfigured = this.supabase.isConfigured;

  async initialize(): Promise<void> {
    if (!this.isConfigured) {
      this.isReady.set(true);
      return;
    }

    const client = await this.supabase.initialize();
    if (!client) {
      this.isReady.set(true);
      return;
    }

    client.auth.onAuthStateChange((event, session) => {
      this.setSessionUser(session);
      if (event === 'PASSWORD_RECOVERY') this.isPasswordRecovery.set(true);
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') this.isPasswordRecovery.set(false);
    });

    const { data, error } = await client.auth.getSession();
    this.isReady.set(true);
    if (error) throw error;
    this.setSessionUser(data.session);
  }

  async signUp(fullName: string, email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await this.supabase.requireClient().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw error;
    this.setSessionUser(data.session);
    return { requiresEmailConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.setSessionUser(data.session);
  }

  async sendPasswordReset(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/forgot-password`;
    const { error } = await this.supabase.requireClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { data, error } = await this.supabase.requireClient().auth.updateUser({ password });
    if (error) throw error;
    this.currentUser.set(data.user);
    this.isPasswordRecovery.set(false);
  }

  async updateFullName(fullName: string): Promise<void> {
    const { data, error } = await this.supabase
      .requireClient()
      .auth.updateUser({ data: { full_name: fullName.trim() } });
    if (error) throw error;
    this.currentUser.set(data.user);
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.requireClient().auth.signOut();
    if (error) throw error;
    this.currentUser.set(null);
  }

  private setSessionUser(session: Session | null): void {
    this.currentUser.set(session?.user ?? null);
  }
}
