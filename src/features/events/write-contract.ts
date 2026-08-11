import type { Database } from "@/types/database";

export type EventScheduleWrite = {
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  location_name: string | null;
  location_address: string | null;
  host_name: string | null;
  host_title: string | null;
  clear: boolean;
  provided: boolean;
};

type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

/**
 * Applies schedule fields only when the write contract received them.
 * Missing form fields are different from an explicit clear request.
 */
export function applyEventScheduleWrite(
  eventUpdate: EventUpdate,
  schedule: EventScheduleWrite,
): EventUpdate {
  if (schedule.clear) {
    return {
      ...eventUpdate,
      event_date: null,
      starts_at: null,
      ends_at: null,
      timezone: "UTC",
      location_name: null,
      location_address: null,
      host_name: null,
      host_title: null,
    };
  }

  if (!schedule.provided) {
    return eventUpdate;
  }

  return {
    ...eventUpdate,
    starts_at: schedule.starts_at,
    ends_at: schedule.ends_at,
    timezone: schedule.timezone,
    location_name: schedule.location_name,
    location_address: schedule.location_address,
    host_name: schedule.host_name,
    host_title: schedule.host_title,
  };
}
