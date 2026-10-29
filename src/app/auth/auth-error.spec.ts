import { getAuthErrorMessage } from './auth-error';

describe('getAuthErrorMessage', () => {
  it('explains how to diagnose an unreachable Supabase project', () => {
    expect(getAuthErrorMessage(new TypeError('Failed to fetch'))).toContain(
      'exactly matches your Supabase dashboard',
    );
    expect(getAuthErrorMessage(new Error('net::ERR_NAME_NOT_RESOLVED'))).toContain(
      'Could not reach Supabase',
    );
  });

  it('preserves useful service errors', () => {
    expect(getAuthErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Invalid login credentials',
    );
  });

  it('shows Supabase API error codes and HTTP status without logging credentials', () => {
    const error = Object.assign(new Error('email rate limit exceeded'), {
      code: 'over_email_send_rate_limit',
      status: 429,
    });

    expect(getAuthErrorMessage(error)).toBe(
      'email rate limit exceeded (over_email_send_rate_limit, HTTP 429). Wait before retrying and check your Supabase Auth email rate limits.',
    );
  });

  it('distinguishes a Supabase email rejection from Angular format validation', () => {
    const error = Object.assign(new Error('Email address is invalid'), {
      code: 'email_address_invalid',
      status: 400,
    });

    expect(getAuthErrorMessage(error)).toContain(
      'Angular accepted the email format, but Supabase rejected the address',
    );
    expect(getAuthErrorMessage(error)).toContain('email_address_invalid, HTTP 400');
  });
});
