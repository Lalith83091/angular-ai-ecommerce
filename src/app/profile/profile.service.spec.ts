import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    service = TestBed.inject(ProfileService);
  });

  it('rejects profile changes when signed out', async () => {
    await expect(service.saveFullName('Sample User')).rejects.toThrow(
      'Log in to update your profile',
    );
  });

});
