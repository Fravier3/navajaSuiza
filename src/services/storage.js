const key = 'navaja-suiza.preferences.v1';
const defaults = { favorites: [], recent: [], theme: 'light', view: 'grid' };
export function readPreferences(storage) {
  try {
    storage ||= globalThis.localStorage;
    const data = JSON.parse(storage.getItem(key) || '{}');
    return {
      favorites: Array.isArray(data.favorites) ? data.favorites.filter(id => typeof id === 'string') : [],
      recent: Array.isArray(data.recent) ? data.recent.filter(id => typeof id === 'string').slice(0, 6) : [],
      theme: data.theme === 'dark' ? 'dark' : 'light',
      view: data.view === 'list' ? 'list' : 'grid',
    };
  } catch { return structuredClone(defaults); }
}
export function savePreferences(value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
