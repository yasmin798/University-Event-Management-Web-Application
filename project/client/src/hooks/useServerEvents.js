// client/src/hooks/useServerEvents.js
import useSWR from "swr";

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

const fetcher = async (path) => {
  const res = await fetch(`${API}${path}`, {
    credentials: "omit",
    cache: "no-store", // <- force network, avoid 304 bodyless hits
    headers: { "Cache-Control": "no-cache" }, // <- belt & suspenders
  });

  // If anything other than 2xx, throw so SWR can surface error
  if (!res.ok) {
    // If a proxy or extension still gives 304, treat it as empty response
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
    // never block UI — start with an empty list
    fallbackData: { items: [] },
  });

  const { data: trips } = useSWR("/api/trips", fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    fallbackData: { items: [] },
  });

  const events = (bazaars.items || [])
    .concat(trips.items || [])
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // loading only while first requests are in-flight (SWR sets isLoading internally,
  // but this keeps your current shape)
  const loading = false;

  return { events, loading };
}
