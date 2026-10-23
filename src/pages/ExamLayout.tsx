import { Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { getExam } from '../data'

const tabs = [
  { to: 'teoria', label: 'Teoría' },
  { to: 'tests', label: 'Tests' },
  { to: 'labs', label: 'Labs' },
  { to: 'fuentes', label: 'Fuentes' },
]

export default function ExamLayout() {
  const exam = getExam(useParams().examId)
  if (!exam || !exam.meta.enabled) return <Navigate to="/" replace />
  const { meta } = exam
  return (
    <>
      <div className="exam-header">
        <div>
          <span className="provider">
            {meta.provider} · {meta.code} · {meta.version}
          </span>
          <h1>{meta.name}</h1>
        </div>
        <nav className="tabs">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to !== 'tests'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet context={exam} />
    </>
  )
}
