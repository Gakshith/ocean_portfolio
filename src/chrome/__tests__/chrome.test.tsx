import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { links } from '../../content/content'
import { mockReducedMotion } from '../../state/__tests__/media'
import { motionStore } from '../../state/motion'
import { pauseBus } from '../../state/pause'
import { SECTIONS } from '../../state/sections'
import { closeOverlay, setRKey, uiStore } from '../../state/ui'
import { Chrome } from '../index'

let media: ReturnType<typeof mockReducedMotion>
beforeAll(() => {
  media = mockReducedMotion(false)
})

function Page() {
  return (
    <>
      <Chrome />
      <main id="main" tabIndex={-1}>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} data-section={s.id} aria-labelledby={`${s.id}-title`}>
            {s.id === 'top' ? (
              <h1 id="top-title" tabIndex={-1}>
                Akash Gojuru
              </h1>
            ) : (
              <h2 id={`${s.id}-title`} tabIndex={-1}>
                {s.nav}
              </h2>
            )}
          </section>
        ))}
        <label>
          Name <input type="text" />
        </label>
        <div data-no-shortcuts="" tabIndex={0} aria-label="Tide Pool pad" />
      </main>
    </>
  )
}

const scrollTo = vi.fn()
beforeEach(() => {
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  scrollTo.mockClear()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
})

afterEach(async () => {
  if (uiStore.get().overlay) {
    act(() => closeOverlay(false))
    await waitFor(() => expect(uiStore.get().overlay).toBeNull())
  }
  motionStore.get().setStill(false)
  media.set(false)
  cleanup()
})

const dialog = () => screen.queryByRole('dialog', { name: 'Akash Gojuru' })

async function openFromPill(user: ReturnType<typeof userEvent.setup>) {
  const contact = document.querySelector<HTMLAnchorElement>('.c-pill__contact')!
  await user.click(contact)
  await waitFor(() => expect(dialog()).not.toBeNull())
  return contact
}

describe('fast path', () => {
  it('prerenders the Resume link as a real <a> (works with JS off)', () => {
    const html = renderToString(<Chrome />)
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const resume = doc.querySelector<HTMLAnchorElement>('.c-pill__resume')!
    // BASE_URL is '/' under vitest; the build prerenders '/ocean_portfolio/…' (checked in dist).
    expect(resume.getAttribute('href')).toBe(links.resume.href)
    expect(resume.getAttribute('href')).toBe(`${import.meta.env.BASE_URL}Akash_Gojuru_Resume.pdf`)
    expect(resume.target).toBe('_blank')
    // Contact degrades to the S7 pad list.
    expect(doc.querySelector('.c-pill__contact')?.getAttribute('href')).toBe('#contact')
  })

  it('puts Resume at tab stop 3: skip link, wordmark, Resume, Contact, sections nav', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.tab()
    expect(document.activeElement).toHaveProperty('textContent', 'Skip to main content')
    await user.tab()
    expect(document.activeElement?.className).toBe('c-wordmark')
    await user.tab()
    expect(document.activeElement?.className).toBe('c-pill__resume')
    expect(document.activeElement?.getAttribute('href')).toMatch(/Akash_Gojuru_Resume\.pdf$/)
    await user.tab()
    expect(document.activeElement?.className).toBe('c-pill__contact')
    await user.tab()
    expect(document.activeElement?.closest('nav')?.getAttribute('aria-label')).toBe('Sections')
  })
})

describe('Surface Interrupt', () => {
  it('opens as a modal: inert outside, focus on its h2, paused, history entry pushed', async () => {
    const user = userEvent.setup()
    const { container } = render(<Page />)
    const lengthBefore = history.length
    await openFromPill(user)
    const d = dialog()!
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(within(d).getByRole('heading', { level: 2 }))
    expect(container.hasAttribute('inert')).toBe(true)
    expect(d.closest('[inert]')).toBeNull()
    expect(pauseBus.isPaused()).toBe(true)
    expect(history.state).toMatchObject({ oceanInterrupt: true })
    expect(history.length).toBe(lengthBefore + 1)
    // Contents per plan: the only sea fill is Open resume, then contact routes and 4 project rows.
    expect(within(d).getByRole('link', { name: /Open resume \(PDF\)/ }).getAttribute('href')).toMatch(/Akash_Gojuru_Resume\.pdf$/)
    expect(within(d).getByRole('link', { name: /gojuru18@iastate\.edu/ })).toBeTruthy()
    expect(within(d).getByRole('heading', { level: 3, name: 'Projects' })).toBeTruthy()
    expect(within(d).getAllByRole('listitem')).toHaveLength(4)
  })

  it('traps focus inside the dialog', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await openFromPill(user)
    const d = dialog()!
    await user.tab()
    expect(document.activeElement?.textContent).toMatch(/^Open resume/)
    const close = within(d).getByRole('button', { name: 'Close' })
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(close) // wrapped backwards
    await user.tab()
    expect(document.activeElement?.textContent).toMatch(/^Open resume/) // wrapped forwards
  })

  it.each([
    ['Esc', async (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
    ['✕', async (user: ReturnType<typeof userEvent.setup>) => user.click(within(dialog()!).getByRole('button', { name: 'Close' }))],
    ['Back to where you were', async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(within(dialog()!).getByRole('button', { name: /Back to where you were/ }))],
    ['browser Back', async () => act(() => history.back())],
  ])('%s closes it and restores the exact scroll and the opener focus', async (_, close) => {
    const user = userEvent.setup()
    const { container } = render(<Page />)
    ;(window as { scrollY: number }).scrollY = 2345
    const opener = await openFromPill(user)
    await close(user)
    await waitFor(() => expect(container.hasAttribute('inert')).toBe(false))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2345, behavior: 'instant' })
    expect(document.activeElement).toBe(opener)
    expect(pauseBus.isPaused()).toBe(false)
    expect(history.state?.oceanInterrupt).toBeFalsy()
    await waitFor(() => expect(dialog()).toBeNull())
  })

  it('project rows close it and jump to the section heading instead of returning', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await openFromPill(user)
    await user.click(within(dialog()!).getByRole('link', { name: /^RISC-V 5-stage pipeline/ }))
    await waitFor(() => expect(document.activeElement?.id).toBe('risc-v-title'))
    expect(location.hash).toBe('#risc-v')
  })

  it('opens on R, but not while typing, not on the Tide Pool pad, and not when switched off', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.click(screen.getByRole('textbox', { name: 'Name' }))
    await user.keyboard('r')
    expect(dialog()).toBeNull()
    screen.getByLabelText('Tide Pool pad').focus()
    await user.keyboard('r')
    expect(dialog()).toBeNull()

    act(() => document.getElementById('main')!.focus())
    await user.keyboard('?')
    const keys = screen.getByRole('dialog', { name: 'Keys' })
    await user.click(within(keys).getByRole('switch'))
    expect(uiStore.get().rKey).toBe(false)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Keys' })).toBeNull()
    await user.keyboard('r')
    expect(dialog()).toBeNull()

    act(() => setRKey(true))
    await user.keyboard('r')
    await waitFor(() => expect(dialog()).not.toBeNull())
  })

  it('closes instantly under reduced motion (switched live), in 200ms otherwise', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    await openFromPill(user)
    await user.keyboard('{Escape}')
    await sleep(40)
    expect(dialog()?.closest('[data-phase]')?.getAttribute('data-phase')).toBe('closing') // still exiting
    await waitFor(() => expect(dialog()).toBeNull())

    act(() => media.set(true))
    expect(document.documentElement.dataset.calm).toBe('true')
    await openFromPill(user)
    await user.keyboard('{Escape}')
    await sleep(40)
    expect(dialog()).toBeNull() // no exit animation
  })
})

describe('Still, jumps and the phone sheet', () => {
  it('the Still toggle is honoured live and reflected on <html>', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const still = document.querySelector<HTMLButtonElement>('.c-still--desk')!
    expect(still.getAttribute('aria-pressed')).toBe('false')
    await user.click(still)
    expect(still.getAttribute('aria-pressed')).toBe('true')
    expect(motionStore.get()).toMatchObject({ stillChosen: true, calm: true })
    expect(document.documentElement.dataset.calm).toBe('true')
  })

  it('a die-map link jumps instantly: hash written, heading focused', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const nav = document.querySelector<HTMLElement>('.c-diemap')!
    await user.click(within(nav).getByRole('link', { name: /WiSARD/ }))
    expect(location.hash).toBe('#wisard')
    expect(document.activeElement?.id).toBe('wisard-title')
    expect(within(nav).getByRole('link', { name: /WiSARD/ }).getAttribute('aria-current')).toBe('location')
  })

  it('the wordmark goes to #top and focuses the h1', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.click(document.querySelector<HTMLAnchorElement>('.c-wordmark')!)
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
    expect(document.activeElement?.id).toBe('top-title')
  })

  it('the phone chip opens the sheet; a link closes it and jumps', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const chip = document.querySelector<HTMLButtonElement>('.c-bbar__chip')!
    expect(chip.getAttribute('aria-expanded')).toBe('false')
    await user.click(chip)
    expect(chip.getAttribute('aria-expanded')).toBe('true')
    const sheet = document.getElementById('chrome-sheet')!
    expect(sheet.hidden).toBe(false)
    await user.click(within(sheet).getByRole('link', { name: /CyBot/ }))
    expect(sheet.hidden).toBe(true)
    expect(document.activeElement?.id).toBe('cybot-title')
    expect(chip.getAttribute('aria-label')).toBe('Sections, 6 of 7, CyBot')
  })

  it('Esc closes the sheet and returns focus to the chip', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const chip = document.querySelector<HTMLButtonElement>('.c-bbar__chip')!
    await user.click(chip)
    await user.keyboard('{Escape}')
    expect(document.getElementById('chrome-sheet')!.hidden).toBe(true)
    expect(document.activeElement).toBe(chip)
  })
})

describe('review round 1', () => {
  it('owns scroll restoration after hydrate, so Back cannot land on the #hash anchor', () => {
    render(<Page />)
    expect(history.scrollRestoration).toBe('manual')
  })

  it('R over the Keys popover returns focus to what opened Keys, not <body>', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const still = document.querySelector<HTMLButtonElement>('.c-still--desk')!
    act(() => still.focus())
    await user.keyboard('?')
    expect(document.activeElement?.id).toBe('chrome-keys-title')
    await user.keyboard('r')
    await waitFor(() => expect(dialog()).not.toBeNull())
    expect(screen.queryByRole('dialog', { name: 'Keys' })).toBeNull()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(still))
  })

  it('R over the phone sheet returns focus to the chip', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const chip = document.querySelector<HTMLButtonElement>('.c-bbar__chip')!
    await user.click(chip)
    within(document.getElementById('chrome-sheet')!).getAllByRole('link')[0].focus()
    await user.keyboard('r')
    await waitFor(() => expect(dialog()).not.toBeNull())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(chip))
  })
})
