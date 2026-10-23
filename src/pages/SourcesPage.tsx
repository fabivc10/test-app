import { useExam } from '../components/useExam'

const labels = { official: 'Oficial', docs: 'Documentación', github: 'GitHub', practice: 'Práctica' } as const

export default function SourcesPage() {
  const { meta } = useExam()
  const groups = (Object.keys(labels) as (keyof typeof labels)[])
    .map((type) => ({ type, items: meta.sources.filter((s) => s.type === type) }))
    .filter((g) => g.items.length)
  return (
    <div className="stack">
      <div className="card">
        <h2>Sobre el examen</h2>
        <ul>
          {meta.exam.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h3>Dominios oficiales</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Dominio</th>
              <th>Peso</th>
            </tr>
          </thead>
          <tbody>
            {meta.domains.map((d) => (
              <tr key={d.id}>
                <td>
                  {d.id}. {d.name}
                </td>
                <td>{d.weight}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {groups.map((g) => (
        <div className="card" key={g.type}>
          <h2>{labels[g.type]}</h2>
          <ul className="sources">
            {g.items.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
                {s.note && <span className="muted"> — {s.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
