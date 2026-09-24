// The prerendered Still site: empty slots render nothing (or the unexposed frame), the form is
// absent without a form service, and the recruiter path works as plain HTML.
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { links, projects } from '../content/content'
import { MessageForm } from './MessageForm'

const html = renderToString(<App />)
const doc = new DOMParser().parseFromString(html, 'text/html')
const text = doc.body.textContent ?? ''

describe('Still site HTML', () => {
  it('never prints a slot token or placeholder copy', () => {
    expect(html).not.toMatch(/\[SLOT|coming soon|lorem|TODO/i)
  })

  it('shows exactly one unexposed frame (the empty portrait), aria-hidden', () => {
    const frames = doc.querySelectorAll('.unexposed')
    expect(frames).toHaveLength(1)
    expect(frames[0].getAttribute('aria-hidden')).toBe('true')
  })

  it('renders no grad-term, ocean story, project media or sensing detail while empty', () => {
    expect(doc.querySelector('.plate-grad')).toBeNull()
    expect(doc.querySelectorAll('.inspect, .photo')).toHaveLength(0)
    expect(text).not.toMatch(/Graduating/)
  })

  it('has no contact form without VITE_FORMSPREE_ID', () => {
    expect(doc.querySelector('form')).toBeNull()
    expect(text).not.toContain('Write a message')
  })

  it('holds "How the light works" back in phase 1 (lead ruling 1)', () => {
    expect(text).not.toContain('How the light works')
  })

  it('S1 plate indexes the four projects as in-page links', () => {
    const rows = [...doc.querySelectorAll('.plate-index a')]
    expect(rows.map((a) => a.textContent)).toEqual(projects.map((p) => p.index))
    expect(rows.map((a) => a.getAttribute('href'))).toEqual(projects.map((p) => `#${p.section}`))
  })

  it('S7 pad list links the resume first, and new-tab links say so', () => {
    const pads = [...doc.querySelectorAll('.padlist > li > a')]
    expect(pads[0].getAttribute('href')).toBe(links.resume.href)
    expect(pads.map((a) => a.getAttribute('href'))).toEqual([
      links.resume.href,
      links.email.href,
      links.linkedin.href,
      links.github.href,
      links.reflection.href,
    ])
    for (const a of pads.filter((a) => a.getAttribute('target') === '_blank'))
      expect(a.textContent).toContain('(opens in a new tab)')
  })

  it('decorative SVG links are out of the tab order and inside aria-hidden', () => {
    for (const a of doc.querySelectorAll('svg a, .lead')) {
      expect(a.getAttribute('tabindex')).toBe('-1')
      expect(a.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('heading outline: one h1, an h2 per section, h3 only under h2', () => {
    const hs = [...doc.querySelectorAll('h1, h2, h3')].map((h) => h.tagName)
    expect(hs.filter((t) => t === 'H1')).toHaveLength(1)
    expect(hs[0]).toBe('H1')
    expect(hs.filter((t) => t === 'H2')).toHaveLength(6)
    expect(hs.indexOf('H3')).toBeGreaterThan(hs.indexOf('H2'))
  })

  it('every in-page link points at an element that exists', () => {
    for (const a of doc.querySelectorAll('a[href^="#"]')) {
      const id = a.getAttribute('href')!.slice(1)
      expect(doc.getElementById(id), `#${id}`).not.toBeNull()
    }
  })
})

describe('MessageForm with a form service', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('posts to Formspree as a plain form, with visible labels', () => {
    render(<MessageForm summary="Write a message" formId="abc123" />)
    const form = document.querySelector('form')!
    expect(form.getAttribute('action')).toBe('https://formspree.io/f/abc123')
    expect(form.getAttribute('method')).toBe('POST')
    for (const label of ['Name', 'Email', 'Message']) expect(screen.getByLabelText(label)).toBeTruthy()
  })

  it('shows inline errors and does not post when fields are empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<MessageForm summary="Write a message" formId="abc123" />)
    await userEvent.click(screen.getByText('Write a message'))
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Please enter your name.')).toBeTruthy()
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts a valid message and confirms', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    render(<MessageForm summary="Write a message" formId="abc123" />)
    await userEvent.click(screen.getByText('Write a message'))
    await userEvent.type(screen.getByLabelText('Name'), 'Ada')
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(screen.getByLabelText('Message'), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(fetchSpy).toHaveBeenCalledWith('https://formspree.io/f/abc123', expect.objectContaining({ method: 'POST' }))
    expect(await screen.findByText('Sent. Thank you.')).toBeTruthy()
  })
})
