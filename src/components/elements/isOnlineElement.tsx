"use client";

import { Wifi, WifiOff, Server, ServerCrash, Timer, Badge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/use-Online";

export function StatusIndicator() {
  const { userOnline, serverOnline, serverLatency } = useOnlineStatus();

  return (
    <div className="flex items-center gap-2">
      {/* User Status */}
        {userOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}

        {serverOnline ? (
          <Server className="h-4 w-4 text-green-500" />
        ) : (
          <ServerCrash className="h-4 w-4 text-red-500" />
        )}

      {/* Latency */}
      <div className="flex items-center gap-1">
        <Timer className="h-4 w-4 text-blue-500" />
        <span className="text-blue-600 font-medium">
          {serverOnline && serverLatency !== null ? `${serverLatency}` : "—"}
        </span>
      </div>
    </div>
  );
}
