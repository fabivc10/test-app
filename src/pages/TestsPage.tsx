import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmButton from '../components/ConfirmButton'
import { useExam } from '../components/useExam'
import { createSession, formatTime, historyKey, sessionKey, type AttemptSummary, type Session, type SessionConfig } from '../lib/exam'
import { load, remove, save } from '../lib/storage'

const COUNTS = [10, 20, 30, 50]

export default function TestsPage() {
  const { meta, questions } = useExam()
  const navigate = useNavigate()
  const [pending, setPending] = useState<Session | null>(() => {
    const s = load<Session | null>(sessionKey(meta.id), null)
    return s && !s.finishedAt ? s : null
  })
  const [history, setHistory] = useState<AttemptSummary[]>(() => load(historyKey(meta.id), []))
  const [domains, setDomains] = useState<string[]>(meta.domains.map((d) => d.id))
  const [count, setCount] = useState(20)
  const [timed, setTimed] = useState(true)
  const [feedback, setFeedback] = useState(true)

  const { questionCount, durationMinutes, poolMultiplier } = meta.exam
  const target = questionCount * poolMultiplier
  const secPerQuestion = (durationMinutes * 60) / questionCount
  const available = questions.filter((q) => domains.includes(q.domain)).length

  const start = (config: SessionConfig) => {
    save(sessionKey(meta.id), createSession(meta, questions, config))
    navigate('run')
  }

  const startSimulation = () =>
    start({
      mode: 'exam',
      count: Math.min(questionCount, questions.length),
      durationSec: durationMinutes * 60,
      label: 'Simulacro completo',
    })

  const startPractice = () => {
    const n = Math.min(count, available)
    const allDomains = domains.length === meta.domains.length
    start({
      mode: feedback ? 'practice' : 'exam',
      count: n,
      durationSec: timed ? Math.round(n * secPerQuestion) : null,
      domains: allDomains ? undefined : domains,
      label: allDomains ? 'Práctica (todos los dominios)' : `Práctica (dominio ${domains.join(', ')})`,
    })
  }

  const toggleDomain = (id: string) =>
    setDomains((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id].sort()))

  return (
    <div className="stack">
      {pending && (
        <div className="card notice row between">
          <div>
            <strong>Tienes un intento en curso</strong>
            <p className="muted">
              {pending.config.label} · {Object.keys(pending.answers).length}/{pending.questions.length} respondidas
            </p>
          </div>
          <div className="row">
            <ConfirmButton
              question="¿Descartar el intento?"
              onConfirm={() => {
                remove(sessionKey(meta.id))
                setPending(null)
              }}
            >
              Descartar
            </ConfirmButton>
            <Link to="run" className="btn primary">
              Continuar
            </Link>
          </div>
        </div>
      )}

      <div className="grid two">
        <div className="card">
          <h2>Simulacro de examen</h2>
          <p className="muted">
            Formato similar al examen real: preguntas aleatorias del pool repartidas según el peso oficial de cada
            dominio, sin retroalimentación hasta el final y con temporizador.
          </p>
          <ul className="facts">
            <li>
              <strong>{Math.min(questionCount, questions.length)}</strong> preguntas
            </li>
            <li>
              <strong>{durationMinutes}</strong> minutos
            </li>
            <li>
              Aprueba con{' '}
              <strong>
                {meta.exam.scaled ? `${meta.exam.scaled.pass}/${meta.exam.scaled.max}` : `${meta.exam.passPercent}%`}
              </strong>
            </li>
          </ul>
          <p className="muted small">
            Pool: {questions.length} preguntas (meta ×{poolMultiplier} = {target})
            {questions.length < target && ' — pool aún incompleto'}
          </p>
          <button className="btn primary" onClick={startSimulation} disabled={!questions.length}>
            Iniciar simulacro
          </button>
        </div>

        <div className="card">
          <h2>Práctica por dominio</h2>
          <fieldset className="domains">
            {meta.domains.map((d) => (
              <label key={d.id} className="check">
                <input type="checkbox" checked={domains.includes(d.id)} onChange={() => toggleDomain(d.id)} />
                {d.id}. {d.name}
                <span className="muted"> ({questions.filter((q) => q.domain === d.id).length})</span>
              </label>
            ))}
          </fieldset>
          <div className="row wrap">
            <span>Preguntas:</span>
            {COUNTS.map((c) => (
              <button key={c} className={`chip ${count === c ? 'on' : ''}`} onClick={() => setCount(c)}>
                {c}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={feedback} onChange={(e) => setFeedback(e.target.checked)} />
            Retroalimentación inmediata
          </label>
          <label className="check">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Temporizador ({formatTime(Math.min(count, available) * secPerQuestion)}, mismo ritmo que el examen)
          </label>
          <button className="btn primary" onClick={startPractice} disabled={!available}>
            Iniciar práctica ({Math.min(count, available)})
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2>Historial</h2>
          {history.length > 0 && (
            <ConfirmButton
              className="btn small"
              question="¿Borrar historial?"
              onConfirm={() => {
                remove(historyKey(meta.id))
                setHistory([])
              }}
            >
              Borrar
            </ConfirmButton>
          )}
        </div>
        {history.length === 0 ? (
          <p className="muted">Aún no has completado intentos.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Resultado</th>
                  <th>Tiempo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.date}>
                    <td>{new Date(h.date).toLocaleString()}</td>
                    <td>{h.label}</td>
                    <td>
                      {h.correct}/{h.total} ({h.percent}%){h.scaled !== undefined && ` · ${h.scaled}`}
                    </td>
                    <td>{formatTime(h.timeUsedSec)}</td>
                    <td>
                      <span className={`badge ${h.passed ? 'ok' : 'bad'}`}>{h.passed ? 'Aprobado' : 'No aprobado'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
