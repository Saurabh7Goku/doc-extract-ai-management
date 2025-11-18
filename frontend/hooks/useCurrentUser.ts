"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface CurrentUser {
  id: number;
  email: string;
  role: string;
  is_active?: boolean;
}

interface UseCurrentUserState {
  user: CurrentUser | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const initialState: Pick<UseCurrentUserState, "user" | "error"> = {
  user: null,
  error: null,
};

export function useCurrentUser(): UseCurrentUserState {
  const [user, setUser] = useState<CurrentUser | null>(initialState.user);
  const [error, setError] = useState<Error | null>(initialState.error);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<CurrentUser>("/v1/users/me");
      setUser(response.data);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        await fetchUser();
      } finally {
        if (!isMounted) return;
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [fetchUser]);

  return { user, loading, error, refresh: fetchUser };
}
