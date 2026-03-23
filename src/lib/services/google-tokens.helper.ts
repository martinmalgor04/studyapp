import { findGoogleTokens, type GoogleTokens } from '@/lib/repositories/user-settings.repository';

export type { GoogleTokens };

export async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  return findGoogleTokens(userId);
}
