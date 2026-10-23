import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import { useExam } from '../components/useExam'
import { studiedKey } from '../lib/exam'
import { load, save } from '../lib/storage'

export default function TheoryPage() {
  const { meta, theory } = useExam()
  const [params, setParams] = useSearchParams()
  const [studied, setStudied] = useState<string[]>(() => load(studiedKey(meta.id), []))
  useEffect(() => save(studiedKey(meta.id), studied), [meta.id, studied])

  const flat = theory.flatMap((d) => d.topics.map((t) => ({ ...t, domainId: d.domainId })))
  const index = Math.max(0, flat.findIndex((t) => t.id === params.get('t')))
  const topic = flat[index]
  const go = (i: number) => {
    setParams({ t: flat[i].id })
    window.scrollTo({ top: 0 })
  }
  const toggleStudied = (id: string) =>
    setStudied((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  if (!topic) return <p className="muted">Aún no hay teoría cargada para este examen.</p>
  const domainName = (id: string) => meta.domains.find((d) => d.id === id)?.name ?? id

  return (
    <div className="split">
      <aside className="sidebar">
        <p className="progress-label">
          {studied.filter((id) => flat.some((t) => t.id === id)).length}/{flat.length} temas estudiados
        </p>
        {theory.map((d) => (
          <details key={d.domainId} open={d.domainId === topic.domainId}>
            <summary>
              {d.domainId}. {domainName(d.domainId)}
              <span className="muted"> · {meta.domains.find((x) => x.id === d.domainId)?.weight}%</span>
            </summary>
            <ul>
              {d.topics.map((t) => (
                <li key={t.id}>
                  <button
                    className={`linkish ${t.id === topic.id ? 'current' : ''}`}
                    onClick={() => go(flat.findIndex((f) => f.id === t.id))}
                  >
                    <span className={`dot ${studied.includes(t.id) ? 'done' : ''}`} />
                    {t.objective && <span className="obj">{t.objective}</span>}
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </aside>
      <article className="card topic">
        <span className="provider">
          Dominio {topic.domainId} · {domainName(topic.domainId)}
          {topic.objective && ` · Objetivo ${topic.objective}`}
        </span>
        <h2>{topic.title}</h2>
        <Markdown>{topic.content}</Markdown>
        {topic.keyPoints.length > 0 && (
          <div className="callout">
            <h3>Puntos clave para el examen</h3>
            <ul>
              {topic.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
        )}
        {topic.references.length > 0 && (
          <div className="refs">
            <h4>Referencias</h4>
            <ul>
              {topic.references.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="row between topic-nav">
          <button className="btn" disabled={index === 0} onClick={() => go(index - 1)}>
            ← Anterior
          </button>
          <label className="check">
            <input type="checkbox" checked={studied.includes(topic.id)} onChange={() => toggleStudied(topic.id)} />
            Marcar como estudiado
          </label>
          <button className="btn" disabled={index === flat.length - 1} onClick={() => go(index + 1)}>
            Siguiente →
          </button>
        </div>
      </article>
    </div>
  )
}
