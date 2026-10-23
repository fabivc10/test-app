import { Link } from 'react-router-dom'
import { exams } from '../data'

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Prepárate para tu certificación</h1>
        <p className="muted">
          Teoría por temario oficial, exámenes simulados con preguntas aleatorias y temporizador, y labs guiados para
          practicar en Packet Tracer o AWS.
        </p>
      </section>
      <div className="grid cards">
        {exams.map(({ meta, questions, labs, theory }) => {
          const body = (
            <>
              <div className="card-head">
                <span className="provider">{meta.provider}</span>
                <span className="code">{meta.code}</span>
              </div>
              <h2>{meta.name}</h2>
              <p className="muted">{meta.description}</p>
              {meta.enabled ? (
                <ul className="stats">
                  <li>
                    <strong>{questions.length}</strong> preguntas
                  </li>
                  <li>
                    <strong>{theory.reduce((n, d) => n + d.topics.length, 0)}</strong> temas
                  </li>
                  <li>
                    <strong>{labs.length}</strong> labs
                  </li>
                </ul>
              ) : (
                <span className="badge">Próximamente</span>
              )}
            </>
          )
          return meta.enabled ? (
            <Link key={meta.id} to={`/${meta.id}`} className="card exam-card">
              {body}
            </Link>
          ) : (
            <div key={meta.id} className="card exam-card disabled" aria-disabled>
              {body}
            </div>
          )
        })}
      </div>
    </>
  )
}
