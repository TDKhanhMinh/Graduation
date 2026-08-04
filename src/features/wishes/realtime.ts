"use client";

import { type PublicWish } from "@/features/wishes/dal";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

export type RealtimeWallEvent = {
  id: number;
  event_id: string;
  wish_id: string;
  action: "upsert" | "remove";
  payload: PublicWish | null;
  created_at: string;
};

export type RealtimeWallState = {
  status: "connecting" | "connected" | "reconnecting" | "disconnected";
  lastSyncAt: Date | null;
};

export function useRealtimeWallEvents(
  eventId: string,
  onEvent: (event: RealtimeWallEvent) => void,
  onReconnect: () => void,
) {
  const [state, setState] = useState<RealtimeWallState>({
    status: "connecting",
    lastSyncAt: null,
  });

  // We wrap onEvent and onReconnect in useCallback in consumer,
  // but just to be safe we can use a stable ref or effect dependencies.

  const prevStatusRef = useRef(state.status);

  useEffect(() => {
    prevStatusRef.current = state.status;
  }, [state.status]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to realtime_wall_events for this eventId
    const channel = supabase
      .channel(`public:realtime_wall_events:event_id=eq.${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "realtime_wall_events",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newEvent = payload.new as RealtimeWallEvent;
          onEvent(newEvent);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // If we were reconnecting, trigger a refetch to ensure no missed events
          if (
            prevStatusRef.current === "reconnecting" ||
            prevStatusRef.current === "disconnected"
          ) {
            onReconnect();
          }
          setState({ status: "connected", lastSyncAt: new Date() });
        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          setState((prev) => ({ ...prev, status: "disconnected" }));
        } else if (status === "TIMED_OUT") {
          setState((prev) => ({ ...prev, status: "reconnecting" }));
        }
      });

    // Listen for system connection state changes (if network drops)
    const handleOnline = () =>
      setState((prev) => ({ ...prev, status: "reconnecting" }));
    const handleOffline = () =>
      setState((prev) => ({ ...prev, status: "disconnected" }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [eventId, onEvent, onReconnect]);

  return state;
}
