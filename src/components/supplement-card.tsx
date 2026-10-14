import type { Supplement } from '../../scripts/content'

const labels = {
  'easter-egg': '彩蛋',
  foreshadowing: '伏笔',
  closure: '收束',
  context: '背景',
}
export function SupplementCard({
  note,
  open,
  onToggle,
}: {
  note: Supplement
  open: boolean
  onToggle: () => void
}) {
  return (
    <details className="supplement" id={`note-${note.id}`} open={open}>
      <summary
        onClick={(event) => {
          event.preventDefault()
          onToggle()
        }}
      >
        <span className="note-kind">{labels[note.kind]}</span>
        <span>
          {note.spoiler === 'future' && !open
            ? '涉及后续信息 · 点击查看'
            : note.title}
        </span>
        <span className="note-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </summary>
      {open && (
        <div className="supplement-body">
          <p className="note-boundary">
            {note.spoiler === 'future'
              ? '你已主动展开可能涉及后续的信息。'
              : '仅使用本幕及此前的信息。'}
            {note.evidence === 'interpretation'
              ? '下文为解读／推断，不是台词直接点名。'
              : ''}
          </p>
          <div dangerouslySetInnerHTML={{ __html: note.html }} />
        </div>
      )}
    </details>
  )
}
