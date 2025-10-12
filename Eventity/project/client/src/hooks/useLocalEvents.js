const KEY = "events_office_store_v1";

export function useLocalEvents() {
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  };
  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  const list = () => load();
  const get = (id) => load().find((e) => e.id === id);
  const upsert = (event) => {
    const all = load();
    const idx = all.findIndex((e) => e.id === event.id);
    if (idx === -1) all.push(event);
    else all[idx] = event;
    save(all);
  };

  return { list, get, upsert };
}