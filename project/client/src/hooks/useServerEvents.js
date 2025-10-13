// client/src/hooks/useServerEvents.js
import useSWR from "swr";

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

const fetcher = async (path) => {
  const res = await fetch(`${API}${path}`, {
    credentials: "omit",
    cache: "no-store", // Force network, avoid 304 bodyless hits
    headers: { "Cache-Control": "no-cache" }, // Ensure no caching
  });

  // If anything other than 2xx, throw so SWR can surface error
  if (!res.ok) {
    // Handle 304 as empty response
    if (res.status === 304) return { items: [] };
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }

  // Normal JSON response
  return res.json();
};

export function useServerEvents({ refreshMs = 0 } = {}) {
  const { data: bazaars } = useSWR("/api/bazaars", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const { data: trips } = useSWR("/api/trips", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const { data: conferences } = useSWR("/api/conferences", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const events = [
    ...(bazaars.items || []).map((e) => ({ ...e, type: "BAZAAR" })),
    ...(trips.items || []).map((e) => ({ ...e, type: "TRIP" })),
    ...(conferences.items || []).map((e) => ({ ...e, type: "CONFERENCE" })),
  ].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // Loading is true if any of the requests are still in-flight
  const loading =
    bazaars.isLoading || trips.isLoading || conferences.isLoading;

  return { events, loading };
}