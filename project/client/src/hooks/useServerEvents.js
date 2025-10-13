// client/src/hooks/useServerEvents.js
import useSWR, { mutate } from "swr";  // Add 'mutate' import

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

const fetcher = async (path) => {
  const res = await fetch(`${API}${path}`, {
    credentials: "omit",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });

  if (!res.ok) {
    if (res.status === 304) return { items: [] };
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }

  return res.json();
};

export function useServerEvents({ refreshMs = 0 } = {}) {
  const { data: bazaarsData, mutate: mutateBazaars, isLoading: bazaarsLoading } = useSWR("/api/bazaars", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const { data: tripsData, mutate: mutateTrips, isLoading: tripsLoading } = useSWR("/api/trips", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const { data: conferencesData, mutate: mutateConferences, isLoading: conferencesLoading } = useSWR("/api/conferences", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const events = [
    ...(bazaarsData?.items || []).map((e) => ({ ...e, type: "BAZAAR" })),
    ...(tripsData?.items || []).map((e) => ({ ...e, type: "TRIP" })),
    ...(conferencesData?.items || []).map((e) => ({ ...e, type: "CONFERENCE" })),
  ].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const loading = bazaarsLoading || tripsLoading || conferencesLoading;

  // Refresh function to re-fetch all
  const refresh = () => {
    mutateBazaars();
    mutateTrips();
    mutateConferences();
  };

  return { events, loading, refresh };
}