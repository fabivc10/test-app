import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import ConfirmButton from '../components/ConfirmButton'
import Markdown from '../components/Markdown'
import { useExam } from '../components/useExam'
import {
  createSession,
  formatTime,
  historyKey,
  isCorrect,
  sessionKey,
  summarize,
  type AttemptSummary,
  type Session,
} from '../lib/exam'
import { load, save } from '../lib/storage'
import Results from './Results'

const MAX_HISTORY = 30

export default function TestRunner() {
  const { meta, questions } = useExam()
  const [session, setSession] = useState<Session | null>(() => load(sessionKey(meta.id), null))
  const [now, setNow] = useState(Date.now())
  const [showNav, setShowNav] = useState(false)

  const update = useCallback(
    (fn: (s: Session) => Session) =>
      setSession((s) => {
        if (!s) return s
        const next = fn(s)
        save(sessionKey(meta.id), next)
        return next
      }),
    [meta.id],
  )

  const finish = useCallback(() => {
    update((s) => {
      if (s.finishedAt) return s
      const done = { ...s, finishedAt: Date.now() }
      const history = load<AttemptSummary[]>(historyKey(meta.id), [])
      save(historyKey(meta.id), [summarize(meta, done), ...history].slice(0, MAX_HISTORY))
      return done
    })
  }, [meta, update])

  const restart = () => {
    if (!session) return
    const next = createSession(meta, questions, session.config)
    save(sessionKey(meta.id), next)
    setSession(next)
    setNow(Date.now())
  }

  const remaining = session?.durationSec != null ? session.startedAt + session.durationSec * 1000 - now : null

  useEffect(() => {
    if (!session || session.finishedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [session])

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && session && !session.finishedAt) finish()
  }, [remaining, session, finish])

  if (!session) return <Navigate to=".." relative="path" replace />
  if (session.finishedAt) return <Results session={session} onRestart={restart} />

  const q = session.questions[session.current]
  const given = session.answers[q.id] ?? []
  const checked = session.checked.includes(q.id)
  const flagged = session.flagged.includes(q.id)
  const answeredCount = Object.values(session.answers).filter((a) => a.length).length
  const unanswered = session.questions.length - answeredCount
  const isPractice = session.mode === 'practice'

  const select = (i: number) => {
    if (checked) return
    update((s) => {
      let next: number[]
      if (q.type === 'single') next = [i]
      else if (given.includes(i)) next = given.filter((x) => x !== i)
      else if (given.length < q.answer.length) next = [...given, i]
      else next = given
      return { ...s, answers: { ...s.answers, [q.id]: next } }
    })
  }
  const goTo = (i: number) => {
    update((s) => ({ ...s, current: i }))
    setShowNav(false)
  }
  const toggleFlag = () =>
    update((s) => ({ ...s, flagged: flagged ? s.flagged.filter((x) => x !== q.id) : [...s.flagged, q.id] }))
  const check = () => update((s) => ({ ...s, checked: [...s.checked, q.id] }))

  const correct = isCorrect(q, given)
  const domainName = meta.domains.find((d) => d.id === q.domain)?.name

  return (
    <div className="runner">
      <div className="runner-bar card">
        <div className="row wrap">
          <strong>
            Pregunta {session.current + 1} / {session.questions.length}
          </strong>
          <span className="muted">{session.config.label}</span>
        </div>
        <div className="row wrap">
          {remaining !== null && (
            <span className={`timer ${remaining < 5 * 60 * 1000 ? 'low' : ''}`} aria-live="off">
              ⏱ {formatTime(remaining / 1000)}
            </span>
          )}
          <button className="btn small" onClick={() => setShowNav((v) => !v)}>
            {showNav ? 'Ocultar mapa' : 'Mapa de preguntas'}
          </button>
          <ConfirmButton className="btn small" question="¿Reiniciar con preguntas nuevas?" onConfirm={restart}>
            Reiniciar
          </ConfirmButton>
          <ConfirmButton
            className="btn small primary"
            question={unanswered ? `${unanswered} sin responder. ¿Terminar?` : '¿Terminar el intento?'}
            onConfirm={finish}
          >
            Terminar
          </ConfirmButton>
        </div>
      </div>
      <div className="progress">
        <div style={{ width: `${(answeredCount / session.questions.length) * 100}%` }} />
      </div>

      {showNav && (
        <div className="card qnav">
          {session.questions.map((x, i) => {
            const a = session.answers[x.id]?.length
            const f = session.flagged.includes(x.id)
            return (
              <button
                key={x.id}
                className={`qbtn ${a ? 'answered' : ''} ${f ? 'flagged' : ''} ${i === session.current ? 'current' : ''}`}
                onClick={() => goTo(i)}
                title={f ? 'Marcada para revisar' : undefined}
              >
                {i + 1}
              </button>
            )
          })}
          <p className="muted small legend">
            <span className="qbtn answered sample" /> respondida <span className="qbtn flagged sample" /> marcada
          </p>
        </div>
      )}

      <div className="card question">
        {isPractice && <span className="provider">Dominio {q.domain} · {domainName}</span>}
        <Markdown>{q.question}</Markdown>
        {q.exhibit && (
          <div className="exhibit">
            <Markdown>{q.exhibit}</Markdown>
          </div>
        )}
        {q.type === 'multiple' && <p className="choose">Elige {q.answer.length}.</p>}
        <ul className="options">
          {q.options.map((opt, i) => {
            const chosen = given.includes(i)
            const state = checked ? (q.answer.includes(i) ? 'right' : chosen ? 'wrong' : '') : ''
            return (
              <li key={i}>
                <button className={`option ${chosen ? 'chosen' : ''} ${state}`} onClick={() => select(i)} disabled={checked}>
                  <span className="letter">{String.fromCharCode(65 + i)}</span>
                  <Markdown>{opt}</Markdown>
                </button>
              </li>
            )
          })}
        </ul>

        {checked && (
          <div className={`feedback ${correct ? 'ok' : 'bad'}`}>
            <strong>{correct ? '✓ Correcto' : '✗ Incorrecto'}</strong>
            <Markdown>{q.explanation}</Markdown>
            {q.reference && (
              <a href={q.reference.url} target="_blank" rel="noreferrer">
                {q.reference.title}
              </a>
            )}
          </div>
        )}

        <div className="row between actions">
          <button className="btn" disabled={session.current === 0} onClick={() => goTo(session.current - 1)}>
            ← Anterior
          </button>
          <div className="row">
            <button className={`btn ${flagged ? 'flag-on' : ''}`} onClick={toggleFlag}>
              {flagged ? '⚑ Marcada' : '⚐ Marcar para revisar'}
            </button>
            {isPractice && !checked && (
              <button className="btn" disabled={given.length !== q.answer.length} onClick={check}>
                Comprobar
              </button>
            )}
          </div>
          {session.current < session.questions.length - 1 ? (
            <button className="btn primary" onClick={() => goTo(session.current + 1)}>
              Siguiente →
            </button>
          ) : (
            <ConfirmButton
              className="btn primary"
              question={unanswered ? `${unanswered} sin responder. ¿Terminar?` : '¿Terminar?'}
              onConfirm={finish}
            >
              Terminar
            </ConfirmButton>
          )}
        </div>
      </div>
      <p className="muted small">
        <Link to="..">← Volver a Tests</Link> (el intento queda guardado y el tiempo sigue corriendo)
      </p>
    </div>
  )
}
