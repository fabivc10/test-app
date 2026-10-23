import type { ExamMeta, Question } from '../types'

/** Pregunta lista para mostrarse: opciones barajadas y respuesta remapeada. */
export interface SessionQuestion extends Question {
  /** Índice original de cada opción mostrada */
  order: number[]
}

export type SessionMode = 'exam' | 'practice'

export interface SessionConfig {
  mode: SessionMode
  count: number
  /** null = sin límite de tiempo */
  durationSec: number | null
  /** undefined = todos los dominios (simulacro) */
  domains?: string[]
  label: string
}

export interface Session {
  examId: string
  config: SessionConfig
  mode: SessionMode
  startedAt: number
  /** null = sin límite de tiempo */
  durationSec: number | null
  questions: SessionQuestion[]
  /** Respuestas por id de pregunta, en índices mostrados */
  answers: Record<string, number[]>
  flagged: string[]
  /** En práctica: preguntas ya comprobadas */
  checked: string[]
  current: number
  finishedAt?: number
}

export interface DomainResult {
  domain: string
  correct: number
  total: number
}

export interface AttemptSummary {
  examId: string
  label: string
  mode: SessionMode
  date: number
  correct: number
  total: number
  percent: number
  passed: boolean
  scaled?: number
  timeUsedSec: number
  byDomain: DomainResult[]
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function prepare(q: Question): SessionQuestion {
  // "Todas las anteriores" y similares se dejan al final para no romper el sentido
  const pinned = q.options.map((o, i) => (/anteriores|of the above/i.test(o) ? i : -1)).filter((i) => i >= 0)
  const movable = q.options.map((_, i) => i).filter((i) => !pinned.includes(i))
  const order = [...shuffle(movable), ...pinned]
  return {
    ...q,
    order,
    options: order.map((i) => q.options[i]),
    answer: q.answer.map((a) => order.indexOf(a)).sort((x, y) => x - y),
  }
}

/** Reparte `count` entre dominios según su peso oficial (método del mayor resto). */
export function allocateByWeight(meta: ExamMeta, count: number, domainIds?: string[]): Record<string, number> {
  const domains = meta.domains.filter((d) => !domainIds || domainIds.includes(d.id))
  const totalWeight = domains.reduce((s, d) => s + d.weight, 0)
  const raw = domains.map((d) => ({ id: d.id, exact: (d.weight / totalWeight) * count }))
  const result: Record<string, number> = {}
  let assigned = 0
  for (const r of raw) {
    result[r.id] = Math.floor(r.exact)
    assigned += result[r.id]
  }
  raw
    .sort((a, b) => (b.exact % 1) - (a.exact % 1))
    .slice(0, count - assigned)
    .forEach((r) => result[r.id]++)
  return result
}

/** Selección aleatoria estratificada por dominio desde el pool. */
export function drawQuestions(meta: ExamMeta, pool: Question[], count: number, domainIds?: string[]): SessionQuestion[] {
  const allocation = allocateByWeight(meta, count, domainIds)
  const picked: Question[] = []
  const leftovers: Question[] = []
  for (const [domain, n] of Object.entries(allocation)) {
    const byDomain = shuffle(pool.filter((q) => q.domain === domain))
    picked.push(...byDomain.slice(0, n))
    leftovers.push(...byDomain.slice(n))
  }
  // Si un dominio no tiene suficientes preguntas, completar con otras
  if (picked.length < count) picked.push(...shuffle(leftovers).slice(0, count - picked.length))
  return shuffle(picked).map(prepare)
}

export function createSession(meta: ExamMeta, pool: Question[], config: SessionConfig): Session {
  return {
    examId: meta.id,
    config,
    mode: config.mode,
    startedAt: Date.now(),
    durationSec: config.durationSec,
    questions: drawQuestions(meta, pool, config.count, config.domains),
    answers: {},
    flagged: [],
    checked: [],
    current: 0,
  }
}

export function isCorrect(q: SessionQuestion, given: number[] | undefined): boolean {
  if (!given || given.length !== q.answer.length) return false
  const sorted = [...given].sort((a, b) => a - b)
  return sorted.every((v, i) => v === q.answer[i])
}

export function summarize(meta: ExamMeta, s: Session): AttemptSummary {
  const byDomain: Record<string, DomainResult> = {}
  let correct = 0
  for (const q of s.questions) {
    const d = (byDomain[q.domain] ??= { domain: q.domain, correct: 0, total: 0 })
    d.total++
    if (isCorrect(q, s.answers[q.id])) {
      d.correct++
      correct++
    }
  }
  const total = s.questions.length
  const percent = total ? Math.round((correct / total) * 1000) / 10 : 0
  const scaled = meta.exam.scaled
    ? Math.round(meta.exam.scaled.min + ((meta.exam.scaled.max - meta.exam.scaled.min) * correct) / Math.max(total, 1))
    : undefined
  const passed = scaled !== undefined && meta.exam.scaled ? scaled >= meta.exam.scaled.pass : percent >= meta.exam.passPercent
  return {
    examId: s.examId,
    label: s.config.label,
    mode: s.mode,
    date: s.finishedAt ?? Date.now(),
    correct,
    total,
    percent,
    passed,
    scaled,
    timeUsedSec: Math.round(((s.finishedAt ?? Date.now()) - s.startedAt) / 1000),
    byDomain: meta.domains.map((d) => byDomain[d.id]).filter(Boolean),
  }
}

export function formatTime(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export const sessionKey = (examId: string) => `certstudy:session:${examId}`
export const historyKey = (examId: string) => `certstudy:history:${examId}`
export const studiedKey = (examId: string) => `certstudy:studied:${examId}`
