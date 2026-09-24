// Lead-owned seam test: the prerendered shell keeps the contract in docs/contract.md.
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import { SECTIONS } from './state/sections'

describe('contract seams', () => {
  const html = renderToString(<App />)
  const doc = new DOMParser().parseFromString(html, 'text/html')

  it('renders every section in order with its heading id', () => {
    const ids = [...doc.querySelectorAll('main section[data-section]')].map((s) => s.id)
    expect(ids).toEqual(SECTIONS.map((s) => s.id))
    for (const { id } of SECTIONS) {
      const heading = doc.getElementById(`${id}-title`)
      expect(heading, `${id}-title`).not.toBeNull()
      expect(doc.getElementById(id)?.getAttribute('aria-labelledby')).toBe(`${id}-title`)
    }
    expect(doc.querySelector('h1')?.id).toBe('top-title')
  })

  it('has exactly one main landmark', () => {
    expect(doc.querySelectorAll('main')).toHaveLength(1)
  })
})
