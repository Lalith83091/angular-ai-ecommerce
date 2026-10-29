import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = TestBed.inject(AuthService);
  });

  it('initializes into a ready, signed-out state', async () => {
    await service.initialize();
    expect(service.isReady()).toBe(true);
    expect(service.user()).toBeNull();
  });

  it('explains that example Supabase values must be replaced before auth requests', async () => {
    await expect(service.signIn('person@example.com', 'Password123')).rejects.toThrow(
      'Replace the example Project URL and publishable key',
    );
    await expect(
      service.signUp('Sample Person', 'person@example.com', 'SecurePassword123'),
    ).rejects.toThrow('Replace the example Project URL and publishable key');
  });
});
