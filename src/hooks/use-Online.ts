"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface OnlineStatus {
  userOnline: boolean;
  serverOnline: boolean;
  lastServerCheck: Date | null;
  serverLatency: number | null;
}

const REFETCH_DELAY = 5000;
const MAX_BACKOFF_DELAY = 30000;
const BASE_BACKOFF_DELAY = 2000;

export function useOnlineStatus(): OnlineStatus {
  const [isUserOnline, setIsUserOnline] = useState(true);
  const [serverStatus, setServerStatus] = useState({
    isOnline: true,
    lastCheck: null as Date | null,
    latency: null as number | null,
  });

  const timeoutRef = useRef<number | undefined>(undefined);
  const isCheckingRef = useRef<boolean>(false);
  const failureCountRef = useRef<number>(0);

  const checkUserOnline = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("https://ipv4.icanhazip.com/", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setIsUserOnline(true);
      return true;
    } catch (err) {
      setIsUserOnline(false);
      return false;
    }
  }, []);

  const checkServerOnline = useCallback(async (): Promise<void> => {
    if (isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    const startTime = Date.now();

    try {
      const res = await fetch("/api/trpc/online.healthCheck?batch=1", {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const latency = Date.now() - startTime;

      setServerStatus({
        isOnline: true,
        lastCheck: new Date(),
        latency,
      });
      
      // Reset failure count on success
      failureCountRef.current = 0;
    } catch (err) {
      console.error("Server unreachable:", err);
      
      // Increment failure count
      failureCountRef.current += 1;
      
      setServerStatus({
        isOnline: false,
        lastCheck: new Date(),
        latency: null,
      });
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  const performHealthCheck = useCallback(async (): Promise<void> => {
    const userOnline = await checkUserOnline();
    if (!userOnline) return;
    
    await checkServerOnline();
  }, [checkUserOnline, checkServerOnline]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    isCheckingRef.current = false;
  }, []);

  // Periodic health checks
  useEffect(() => {
    const runHealthCheck = () => {
      if (isUserOnline) {
        performHealthCheck();
      }
    };

    // Initial check
    runHealthCheck();

    // Set up interval
    const interval = setInterval(runHealthCheck, REFETCH_DELAY);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [isUserOnline, performHealthCheck, cleanup]);

  // Exponential backoff for failed server checks
  useEffect(() => {
    if (!serverStatus.isOnline && isUserOnline) {
      const backoffDelay = Math.min(
        MAX_BACKOFF_DELAY,
        BASE_BACKOFF_DELAY * Math.pow(2, failureCountRef.current)
      );

      timeoutRef.current = window.setTimeout(() => {
        performHealthCheck();
      }, backoffDelay);

      return cleanup;
    }
  }, [serverStatus.isOnline, isUserOnline, performHealthCheck, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    userOnline: isUserOnline,
    serverOnline: serverStatus.isOnline,
    lastServerCheck: serverStatus.lastCheck,
    serverLatency: serverStatus.latency,
  };
}