import { prisma } from '../db/prisma';

type SupabaseUser = {
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
};

export function bearerToken(header: unknown) {
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function upsertUserFromSupabaseToken(accessToken: string, google?: {
  providerToken?: string;
  providerRefreshToken?: string;
  providerExpiresAt?: number;
}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured');

  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!authRes.ok) throw new Error('Invalid Supabase session');

  const supabaseUser = await authRes.json() as SupabaseUser;
  if (!supabaseUser.email) throw new Error('Supabase user email missing');

  return prisma.user.upsert({
    where: { email: supabaseUser.email },
    update: {
      name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name,
      googleAccessToken: google?.providerToken ?? undefined,
      googleRefreshToken: google?.providerRefreshToken ?? undefined,
      googleTokenExpiry: google?.providerExpiresAt ? new Date(google.providerExpiresAt * 1000) : undefined,
    },
    create: {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name,
      googleAccessToken: google?.providerToken ?? null,
      googleRefreshToken: google?.providerRefreshToken ?? null,
      googleTokenExpiry: google?.providerExpiresAt ? new Date(google.providerExpiresAt * 1000) : null,
    },
  });
}

export async function userFromRequest(req: { headers: Record<string, unknown> }) {
  const token = bearerToken(req.headers.authorization);
  if (!token) return null;
  return upsertUserFromSupabaseToken(token);
}
