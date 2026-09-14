import { useEffect, useRef, useState } from 'react';
import { getToken } from '../utils/authUtils';

export function useAuthToken(
  isLoggedIn: boolean,
  onTokenUpdate?: (accessToken: string, expiresIn: number) => void
) {
  const [token, setToken] = useState<string | null>(null);
  const onTokenUpdateRef = useRef(onTokenUpdate);

  // Keep callback reference updated without re-triggering the token fetch effect
  useEffect(() => {
    onTokenUpdateRef.current = onTokenUpdate;
  }, [onTokenUpdate]);

  useEffect(() => {
    if (!isLoggedIn) {
      setToken(null);
      return;
    }
    let refreshTimeout: ReturnType<typeof setTimeout>;

    const fetchToken = () => {
      getToken((accessToken, expiresIn) => {
        if (!accessToken) {
          return;
        }
        setToken(accessToken);
        // Call the optional handler whenever the token is fetched/updated
        onTokenUpdateRef.current?.(accessToken, expiresIn);
        // Schedule refresh 60 seconds before expiration (min 10s delay)
        const refreshDelay = expiresIn
          ? Math.max((expiresIn - 60) * 1000, 10000)
          : 3500 * 1000;

        refreshTimeout = setTimeout(fetchToken, refreshDelay);
      });
    };

    fetchToken();

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [isLoggedIn]);

  return token;
}
