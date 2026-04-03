export type AuthProvider = 'google' | 'apple';

export type AuthProviderPlatform = 'ios' | 'android' | 'other';

const AUTH_PROVIDER_AVAILABILITY: Record<AuthProvider, Record<AuthProviderPlatform, boolean>> = {
  google: {
    ios: true,
    android: true,
    other: true,
  },
  apple: {
    ios: true,
    android: false,
    other: false,
  },
};

export function detectAuthProviderPlatform(userAgent?: string): AuthProviderPlatform {
  if (typeof window === 'undefined' && !userAgent) return 'other';

  const ua = userAgent ?? window.navigator.userAgent ?? '';
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function isAuthProviderAvailable(
  provider: AuthProvider,
  platform: AuthProviderPlatform = detectAuthProviderPlatform()
): boolean {
  return AUTH_PROVIDER_AVAILABILITY[provider][platform];
}

export function getAuthProviderAvailability(
  platform: AuthProviderPlatform = detectAuthProviderPlatform()
): Record<AuthProvider, boolean> {
  return {
    google: isAuthProviderAvailable('google', platform),
    apple: isAuthProviderAvailable('apple', platform),
  };
}
