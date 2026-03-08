const KEY = 'synmuse_recents'

export function addRecentVisit(path, label, icon) {
  try {
    const recents = JSON.parse(localStorage.getItem(KEY) || '[]')
    const filtered = recents.filter((r) => r.path !== path)
    filtered.unshift({ path, label, icon, timestamp: Date.now() })
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, 4)))
    window.dispatchEvent(new Event('recents-updated'))
  } catch {}
}

export function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
