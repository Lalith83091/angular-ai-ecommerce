export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return 'Could not reach Supabase. Check that the Project URL in src/environments/environment.ts exactly matches your Supabase dashboard, and confirm you are online.';
  }
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|err_name_not_resolved|fetch failed/i.test(error.message)) {
      return 'Could not reach Supabase. Check that the Project URL in src/environments/environment.ts exactly matches your Supabase dashboard, and confirm you are online.';
    }
    const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
    const status = 'status' in error && typeof error.status === 'number' ? error.status : null;
    const details = [code, status === null ? '' : `HTTP ${status}`].filter(Boolean).join(', ');
    const message = details ? `${error.message} (${details})` : error.message;

    if (code === 'over_email_send_rate_limit') {
      return `${message}. Wait before retrying and check your Supabase Auth email rate limits.`;
    }
    if (code === 'email_address_invalid') {
      return `${message}. Angular accepted the email format, but Supabase rejected the address. Check the address for whitespace or a typo and verify your Supabase Auth email settings.`;
    }
    return message;
  }
  return 'Something went wrong. Please try again.';
}
