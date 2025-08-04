"use client";
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface OnlineStatus {
    userOnline: boolean;
    serverOnline: boolean;
}

export function useOnlineStatus() : OnlineStatus {
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);

  const { data } = trpc.online.check.useQuery(undefined, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    const handleOnline = () => setIsUserOnline(true);
    const handleOffline = () => setIsUserOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  console.log("User online status:", isUserOnline);
  console.log("Server online status:", data?.online);
  return { userOnline: isUserOnline, serverOnline: data?.online || false };
}