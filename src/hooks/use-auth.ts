import { usePrivy } from "@privy-io/react-auth";

/**
 * Client-side auth state using Privy.
 * Replaces the previous Supabase-based auth.
 */
export function useAuth() {
  const { ready, authenticated, user, logout } = usePrivy();

  return {
    session: authenticated ? user : null,
    user: user ?? null,
    loading: !ready,
    isAuthenticated: authenticated,
    signOut: logout,
  };
}

export async function signOut() {
  // This will be handled by the Privy provider
  // The actual logout function is returned by useAuth
}
