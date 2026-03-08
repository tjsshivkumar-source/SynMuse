const KEY = 'synmuse_panels'

const DEFAULT_PANELS = [
  { slug: 'linen', name: 'SS26 Linen Range Panel', personaSlugs: ['sophie', 'priya', 'emma', 'diane'], createdAt: 1709830000000 },
  { slug: 'denim', name: 'AW26 Menswear Denim Panel', personaSlugs: ['jordan', 'raj', 'tom', 'marcus'], createdAt: 1709830000001 },
  { slug: 'streetwear', name: 'Gen Z Streetwear Test', personaSlugs: ['marcus', 'aisha', 'sophie'], createdAt: 1709830000002 },
]

export function getPanels() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_PANELS))
      return DEFAULT_PANELS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_PANELS
  }
}

export function getPanel(slug) {
  return getPanels().find((p) => p.slug === slug) || null
}

export function savePanel(panel) {
  const panels = getPanels()
  const idx = panels.findIndex((p) => p.slug === panel.slug)
  if (idx >= 0) {
    panels[idx] = { ...panels[idx], ...panel }
  } else {
    panels.push(panel)
  }
  localStorage.setItem(KEY, JSON.stringify(panels))
  window.dispatchEvent(new Event('panels-updated'))
  return panel
}

export function deletePanel(slug) {
  const panels = getPanels().filter((p) => p.slug !== slug)
  localStorage.setItem(KEY, JSON.stringify(panels))
  localStorage.removeItem(`chat_panel_${slug}`)
  window.dispatchEvent(new Event('panels-updated'))
}

export function removePersonaFromPanels(personaSlug) {
  const panels = getPanels().map((p) => ({
    ...p,
    personaSlugs: p.personaSlugs.filter((s) => s !== personaSlug),
  }))
  localStorage.setItem(KEY, JSON.stringify(panels))
  window.dispatchEvent(new Event('panels-updated'))
}

export function slugify(name) {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!s || s === 'new') return `panel-${Date.now()}`
  return s
}
