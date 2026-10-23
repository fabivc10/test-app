import { useState } from 'react'
import Markdown from '../components/Markdown'
import { useExam } from '../components/useExam'
import type { Lab } from '../types'

function LabCard({ lab, domainName }: { lab: Lab; domainName: string }) {
  const [showSolution, setShowSolution] = useState(false)
  return (
    <details className="card lab">
      <summary>
        <div>
          <span className="provider">
            Dominio {lab.domain} · {domainName}
          </span>
          <h3>{lab.title}</h3>
          <div className="row wrap tags">
            <span className="badge">{lab.tool}</span>
            <span className="badge">{lab.difficulty}</span>
            <span className="badge">~{lab.estimatedMinutes} min</span>
            {lab.cost && <span className="badge warn">{lab.cost}</span>}
          </div>
        </div>
      </summary>
      <p>{lab.description}</p>
      <h4>Objetivos</h4>
      <ul>
        {lab.objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      {lab.setup.length > 0 && (
        <>
          <h4>Escenario</h4>
          <Markdown>{lab.setup}</Markdown>
        </>
      )}
      <h4>Tareas</h4>
      <ol>
        {lab.tasks.map((t) => (
          <li key={t}>
            <Markdown>{t}</Markdown>
          </li>
        ))}
      </ol>
      <h4>Verificación</h4>
      <ul>
        {lab.verification.map((v) => (
          <li key={v}>
            <Markdown>{v}</Markdown>
          </li>
        ))}
      </ul>
      <div className="solution">
        <button className="btn" onClick={() => setShowSolution((v) => !v)}>
          {showSolution ? 'Ocultar solución' : 'Ver solución'}
        </button>
        {showSolution && <Markdown>{lab.solution}</Markdown>}
      </div>
      {lab.references.length > 0 && (
        <div className="refs">
          <h4>Referencias</h4>
          <ul>
            {lab.references.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  )
}

export default function LabsPage() {
  const { meta, labs } = useExam()
  const [domain, setDomain] = useState<string>('all')
  const shown = labs.filter((l) => domain === 'all' || l.domain === domain)
  const domainName = (id: string) => meta.domains.find((d) => d.id === id)?.name ?? id
  return (
    <div className="stack">
      <p className="muted">
        Labs recomendados para hacer fuera de la app. Intenta resolverlos primero; la solución está oculta hasta que
        pulses <em>Ver solución</em>.
      </p>
      <div className="row wrap">
        <button className={`chip ${domain === 'all' ? 'on' : ''}`} onClick={() => setDomain('all')}>
          Todos ({labs.length})
        </button>
        {meta.domains
          .filter((d) => labs.some((l) => l.domain === d.id))
          .map((d) => (
            <button key={d.id} className={`chip ${domain === d.id ? 'on' : ''}`} onClick={() => setDomain(d.id)}>
              {d.id}. {d.name} ({labs.filter((l) => l.domain === d.id).length})
            </button>
          ))}
      </div>
      {shown.map((lab) => (
        <LabCard key={lab.id} lab={lab} domainName={domainName(lab.domain)} />
      ))}
      {labs.length === 0 && <p className="muted">Aún no hay labs para este examen.</p>}
    </div>
  )
}
