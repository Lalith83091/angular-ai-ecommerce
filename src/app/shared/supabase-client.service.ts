import { Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from './supabase.types';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private client: SupabaseClient<Database> | null = null;
  readonly isConfigured = this.hasValidPublicConfiguration();

  async initialize(): Promise<SupabaseClient<Database> | null> {
    if (!this.isConfigured) return null;
    if (this.client) return this.client;

    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
    return this.client;
  }

  requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error(
        'Supabase is not configured. Replace the example Project URL and publishable key with the values from your Supabase dashboard in src/environments/environment.ts.',
      );
    }
    return this.client;
  }

  private hasValidPublicConfiguration(): boolean {
    const urlValue = environment.supabaseUrl.trim();
    const keyValue = environment.supabasePublishableKey.trim();
    if (!urlValue || !keyValue || this.isExampleValue(urlValue) || this.isExampleValue(keyValue)) {
      return false;
    }

    try {
      const url = new URL(urlValue);
      return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
    } catch {
      return false;
    }
  }

  private isExampleValue(value: string): boolean {
    return /your[-_ ]|placeholder|example/i.test(value);
  }
}
