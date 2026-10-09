const KEY = 'advent-calendar';

interface Saved {
  opened: number[];
  completed: number[];
}

function key(year: number) {
  return `${KEY}-${year}`;
}

export function load(year: number): Saved {
  try {
    const raw = localStorage.getItem(key(year));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Saved>;
      return { opened: parsed.opened ?? [], completed: parsed.completed ?? [] };
    }
  } catch {
    // storage unavailable (private mode etc.) — start fresh
  }
  return { opened: [], completed: [] };
}

export function save(year: number, data: Saved): void {
  try {
    localStorage.setItem(key(year), JSON.stringify(data));
  } catch {
    // ignore
  }
}
