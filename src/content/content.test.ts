/// <reference types="node" />
// content.ts may only restate docs/content.md and the plan's frozen lines, and every slot
// Akash has not supplied stays empty.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SECTIONS } from '../state/sections'
import * as C from './content'

const read = (p: string) => readFileSync(p, 'utf8')
// Typography differs from the sources (curly quotes, no line wraps); compare the words.
const norm = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
const source = norm(read('docs/content.md'))
const plan = norm(read('docs/design/06-final-plan.md'))

describe('slots', () => {
  it('every slot Akash has not supplied is empty', () => {
    expect(C.identity.gradTerm).toBeNull()
    expect(C.identity.oceanStory).toBeNull()
    expect(C.identity.photo).toBeNull()
    expect(C.identity.oceanPhoto).toBeNull()
    expect(C.cybot.sensingDetail).toBeNull()
    for (const p of C.projects) expect(p.media, p.key).toBeNull()
  })
})

describe('facts come from docs/content.md', () => {
  it('identity, contact and documents', () => {
    expect(source).toContain(`**Name:** ${C.identity.name}`.replace(/\*\*/g, ''))
    expect(source).toContain(C.identity.school)
    expect(source).toContain(C.links.email.address)
    expect(C.links.email.href).toBe(`mailto:${C.links.email.address}`)
    expect(source).toContain(C.links.linkedin.href.replace('https://www.', ''))
    expect(source).toContain(C.links.github.href.replace('https://', ''))
  })

  it('the facts list', () => {
    const [edu, skills, exp, rec] = C.identity.facts
    expect(C.identity.facts.map((f) => f.term)).toEqual(['Education', 'Skills', 'Experience', 'Recognition'])
    expect(source).toContain(`Education: ${edu.values[0]}`)
    expect(source).toContain(`Skills: ${skills.values.join(', ')}`)
    expect(source).toContain(`Experience: ${exp.values[0]}`)
    expect(source).toContain(`Recognition: ${rec.values.map(norm).join(' · ')}`)
  })

  it('stack chips name only tools listed for that project', () => {
    const lower = source.toLowerCase()
    for (const p of C.projects)
      for (const chip of p.stack) {
        if (chip === 'RARS') continue // the plan's S4 chip; content.md names RARS in the testing line
        expect(lower, `${p.key}: ${chip}`).toContain(chip.toLowerCase())
      }
    expect(source).toContain('RARS')
  })

  it('project dates, advisor and team sizes', () => {
    expect(source).toContain('Jan–Dec 2026, in progress')
    expect(source).toContain('Dr. Henry Duwe')
    expect(source).toContain('Two-person team')
    expect(source).toContain('three-person team')
  })
})

describe('frozen lines are the plan’s, verbatim', () => {
  const frozen = [
    C.identity.role,
    C.dieCaption,
    C.about.display,
    C.about.lede,
    C.contact.heading,
    C.projects[0].status!,
    C.projects[1].role!,
    C.projects[1].dataLine!,
    C.projects[2].honesty!,
    ...C.projects.map((p) => p.index),
    ...C.projects.map((p) => p.title),
  ]
  it.each(frozen)('%s', (line) => expect(plan).toContain(norm(line)))

  it('S3 data line: the plan’s, in first person (lead ruling 2)', () => {
    const line = C.projects[0].dataLine!
    expect(line.endsWith('not my silicon')).toBe(true)
    expect(plan).toContain(norm(line.replace('not my silicon', 'not his silicon')))
  })

  it('How the light works', () => {
    const h = C.footer.howLight
    const text = h.before + h.yue.label + h.middle + h.ferraro.label + h.after
    expect(plan).toContain(norm(text))
  })
})

describe('shape', () => {
  it('projects are in plate order and point at real sections', () => {
    expect(C.projects.map((p) => p.section)).toEqual(['link-layer', 'risc-v', 'wisard', 'cybot'])
    const ids = SECTIONS.map((s) => s.id) as string[]
    for (const p of C.projects) expect(ids).toContain(p.section)
  })

  it('no invented fields', () => {
    expect(Object.keys(C.identity).sort()).toEqual(
      ['about', 'facts', 'gradTerm', 'name', 'oceanPhoto', 'oceanStory', 'photo', 'role', 'school'].sort(),
    )
    for (const p of C.projects)
      expect(Object.keys(p).sort()).toEqual(
        ['block', 'body', 'dataLine', 'honesty', 'index', 'key', 'media', 'role', 'section', 'stack', 'status', 'title'].sort(),
      )
  })

  it('documents resolve under the base URL and exist in public/', () => {
    for (const doc of [C.links.resume, C.links.reflection]) {
      expect(doc.href.startsWith(import.meta.env.BASE_URL)).toBe(true)
      expect(existsSync(`public/${doc.href.slice(import.meta.env.BASE_URL.length)}`), doc.href).toBe(true)
    }
    expect(C.links.resume.href).toMatch(/Akash_Gojuru_Resume\.pdf$/)
  })
})
