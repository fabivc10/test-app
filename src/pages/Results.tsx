import { useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from '../components/Markdown'
import { useExam } from '../components/useExam'
import { formatTime, isCorrect, summarize, type Session } from '../lib/exam'

type Filter = 'all' | 'wrong' | 'flagged'

export default function Results({ session, onRestart }: { session: Session; onRestart: () => void }) {
  const { meta } = useExam()
  const [filter, setFilter] = useState<Filter>('wrong')
  const r = summarize(meta, session)
  const domainName = (id: string) => meta.domains.find((d) => d.id === id)?.name ?? id

  const list = session.questions
    .map((q, i) => ({ q, i, ok: isCorrect(q, session.answers[q.id]) }))
    .filter(({ q, ok }) => filter === 'all' || (filter === 'wrong' ? !ok : session.flagged.includes(q.id)))

  return (
    <div className="stack">
      <div className={`card result ${r.passed ? 'ok' : 'bad'}`}>
        <span className="provider">{session.config.label}</span>
        <h2>{r.passed ? 'Aprobado ✓' : 'No aprobado'}</h2>
        <div className="score-row">
          <div>
            <span className="big">{r.percent}%</span>
            <span className="muted">
              {r.correct}/{r.total} correctas
            </span>
          </div>
          {r.scaled !== undefined && meta.exam.scaled && (
            <div>
              <span className="big">{r.scaled}</span>
              <span className="muted">
                escala {meta.exam.scaled.min}–{meta.exam.scaled.max} (aprueba {meta.exam.scaled.pass})
              </span>
            </div>
          )}
          <div>
            <span className="big">{formatTime(r.timeUsedSec)}</span>
            <span className="muted">tiempo usado</span>
          </div>
        </div>
        <h3>Por dominio</h3>
        {r.byDomain.map((d) => {
          const pct = Math.round((d.correct / d.total) * 100)
          return (
            <div key={d.domain} className="domain-bar">
              <div className="row between">
                <span>
                  {d.domain}. {domainName(d.domain)}
                </span>
                <span>
                  {d.correct}/{d.total} · {pct}%
                </span>
              </div>
              <div className="bar">
                <div className={pct >= meta.exam.passPercent ? 'ok' : 'bad'} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
        <p className="muted small">
          Puntaje aproximado: los exámenes reales usan escalas no lineales y preguntas no puntuables.
        </p>
        <div className="row">
          <button className="btn primary" onClick={onRestart}>
            Nuevo intento (preguntas nuevas)
          </button>
          <Link to=".." className="btn">
            Volver a Tests
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="row between wrap">
          <h2>Revisión</h2>
          <div className="row">
            {(['wrong', 'flagged', 'all'] as Filter[]).map((f) => (
              <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                {{ wrong: 'Incorrectas', flagged: 'Marcadas', all: 'Todas' }[f]}
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 && <p className="muted">Nada que mostrar con este filtro.</p>}
        {list.map(({ q, i, ok }) => {
          const given = session.answers[q.id] ?? []
          return (
            <details key={q.id} className={`review ${ok ? 'ok' : 'bad'}`}>
              <summary>
                <span className="mark">{ok ? '✓' : '✗'}</span> {i + 1}.{' '}
                {q.question.split('\n')[0].slice(0, 140)}
                {q.question.length > 140 ? '…' : ''}
              </summary>
              <Markdown>{q.question}</Markdown>
              {q.exhibit && (
                <div className="exhibit">
                  <Markdown>{q.exhibit}</Markdown>
                </div>
              )}
              <ul className="options">
                {q.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={`option static ${q.answer.includes(oi) ? 'right' : given.includes(oi) ? 'wrong' : ''}`}
                  >
                    <span className="letter">{String.fromCharCode(65 + oi)}</span>
                    <Markdown>{opt}</Markdown>
                    {given.includes(oi) && <span className="tag">tu respuesta</span>}
                  </li>
                ))}
              </ul>
              <div className="feedback">
                <Markdown>{q.explanation}</Markdown>
                {q.reference && (
                  <a href={q.reference.url} target="_blank" rel="noreferrer">
                    {q.reference.title}
                  </a>
                )}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
