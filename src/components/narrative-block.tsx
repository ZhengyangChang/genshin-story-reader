import { useLayoutEffect, useRef } from 'react'
import type { Supplement } from '../../scripts/content'
import { SupplementCard } from './supplement-card'

export function NarrativeBlock({
  id,
  title,
  briefHtml,
  detailHtml,
  expanded,
  onToggle,
  notes,
  openNotes,
  onToggleNote,
}: {
  id: string
  title: string
  briefHtml: string
  detailHtml?: string
  expanded: boolean
  onToggle: () => void
  notes: Supplement[]
  openNotes: Set<string>
  onToggleNote: (id: string) => void
}) {
  const copy = useRef<HTMLDivElement>(null)
  const height = useRef<number | null>(null)
  const animation = useRef<Animation | null>(null)
  const focusAfterToggle = useRef(false)
  const open = expanded && !!detailHtml
  useLayoutEffect(() => {
    const element = copy.current
    if (!element) return
    animation.current?.cancel()
    if (focusAfterToggle.current) {
      element
        .querySelector<HTMLElement>('[data-passage-text]')
        ?.focus({ preventScroll: true })
      focusAfterToggle.current = false
    }
    const next = element.getBoundingClientRect().height
    if (
      height.current !== null &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      animation.current = element.animate(
        [{ height: `${height.current}px` }, { height: `${next}px` }],
        { duration: 340, easing: 'cubic-bezier(.22,.68,0,1)' },
      )
    }
    height.current = next
    const observer = new ResizeObserver(() => {
      if (animation.current?.playState !== 'running')
        height.current = element.getBoundingClientRect().height
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      animation.current?.cancel()
    }
  }, [open])

  const toggle = () => {
    if (!detailHtml) return
    const top = copy.current?.getBoundingClientRect().top ?? 0
    onToggle()
    // Collapsing from the end of a long passage keeps its beginning in view.
    if (open && top < 110)
      requestAnimationFrame(() => {
        const element = document.getElementById(id)
        if (element)
          window.scrollBy({
            top: element.getBoundingClientRect().top - 110,
            behavior: 'instant',
          })
      })
  }
  return (
    <section
      className={`story-scene narrative-block${open ? ' is-expanded' : ''}`}
      id={id}
      data-scene-anchor
    >
      <div ref={copy} className="narrative-copy">
        <div
          key={open ? 'detail' : 'brief'}
          data-passage-text
          className={`prose narrative-text${detailHtml ? ' is-interactive' : ''}`}
          role={!open && detailHtml ? 'button' : undefined}
          tabIndex={detailHtml ? (open ? -1 : 0) : undefined}
          aria-expanded={!open && detailHtml ? false : undefined}
          aria-controls={!open && detailHtml ? `passage-${id}` : undefined}
          aria-description={
            !open && detailHtml ? '点击阅读详述，Enter 或空格展开' : undefined
          }
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a,button,input,summary'))
              return
            if (window.getSelection()?.toString()) return
            toggle()
          }}
          onKeyDown={(event) => {
            if (event.currentTarget !== event.target) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              focusAfterToggle.current = true
              toggle()
            }
          }}
          id={`passage-${id}`}
          dangerouslySetInnerHTML={{ __html: open ? detailHtml! : briefHtml }}
        />
      </div>
      {open && (
        <div className="passage-footer">
          <span aria-hidden="true" className="passage-rule" />
          <button
            type="button"
            className="passage-collapse"
            aria-label={`收起${title}的详述`}
            aria-expanded="true"
            aria-controls={`passage-${id}`}
            onClick={(event) => {
              focusAfterToggle.current = event.detail === 0
              toggle()
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m4 10 4-4 4 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      {open &&
        notes.map((note) => (
          <SupplementCard
            key={note.id}
            note={note}
            open={openNotes.has(note.id)}
            onToggle={() => onToggleNote(note.id)}
          />
        ))}
    </section>
  )
}
