// S7 "Write a message" (D-04): secondary to email, and ABSENT unless VITE_FORMSPREE_ID is set.
// Works as a plain POST with JS off; with JS it validates inline and posts without leaving the
// page. The post never waits on an animation.
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { links } from '../content/content'

const FORM_ID: string | undefined = import.meta.env.VITE_FORMSPREE_ID || undefined

type Field = 'name' | 'email' | 'message'
type Errors = Partial<Record<Field, string>>
type Status = 'idle' | 'sending' | 'sent' | 'failed'

function validate(data: FormData): Errors {
  const e: Errors = {}
  const name = String(data.get('name') ?? '').trim()
  const email = String(data.get('email') ?? '').trim()
  const message = String(data.get('message') ?? '').trim()
  if (!name) e.name = 'Please enter your name.'
  if (!email) e.email = 'Please enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'That email address looks incomplete.'
  if (!message) e.message = 'Please write a message.'
  return e
}

export function MessageForm({ summary, formId = FORM_ID }: { summary: string; formId?: string }) {
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const formRef = useRef<HTMLFormElement>(null)
  // Native validation until hydrated (JS off still checks required fields); then inline errors.
  useEffect(() => {
    if (formRef.current) formRef.current.noValidate = true
  }, [])
  if (!formId) return null
  const action = `https://formspree.io/f/${encodeURIComponent(formId)}`

  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const form = ev.currentTarget
    const data = new FormData(form)
    const e = validate(data)
    setErrors(e)
    const first = (Object.keys(e) as Field[])[0]
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setStatus('sending')
    try {
      const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  const field = (name: Field, label: string, input: 'input' | 'textarea', type = 'text', auto?: string) => {
    const err = errors[name]
    const props = {
      id: `msg-${name}`,
      name,
      required: true,
      autoComplete: auto,
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `msg-${name}-err` : undefined,
    }
    return (
      <div className="msg-field">
        <label htmlFor={`msg-${name}`} className="t-small">
          {label}
        </label>
        {input === 'input' ? <input type={type} {...props} /> : <textarea rows={5} {...props} />}
        {err && (
          <p id={`msg-${name}-err`} className="msg-error t-small">
            {err}
          </p>
        )}
      </div>
    )
  }

  return (
    <details className="msg">
      <summary className="t-nav">{summary}</summary>
      <form ref={formRef} action={action} method="POST" onSubmit={submit}>
        {field('name', 'Name', 'input', 'text', 'name')}
        {field('email', 'Email', 'input', 'email', 'email')}
        {field('message', 'Message', 'textarea')}
        <div className="msg-actions">
          <button type="submit" className="msg-send t-nav" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
          <p className="t-small msg-status" role="status">
            {status === 'sent' && 'Sent. Thank you.'}
            {status === 'failed' && `That didn’t send. Please email ${links.email.address} instead.`}
          </p>
        </div>
      </form>
    </details>
  )
}
