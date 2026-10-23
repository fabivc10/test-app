import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ExamLayout from './pages/ExamLayout'
import TheoryPage from './pages/TheoryPage'
import TestsPage from './pages/TestsPage'
import TestRunner from './pages/TestRunner'
import LabsPage from './pages/LabsPage'
import SourcesPage from './pages/SourcesPage'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          CertStudy
        </Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:examId" element={<ExamLayout />}>
            <Route index element={<Navigate to="teoria" replace />} />
            <Route path="teoria" element={<TheoryPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="tests/run" element={<TestRunner />} />
            <Route path="labs" element={<LabsPage />} />
            <Route path="fuentes" element={<SourcesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
