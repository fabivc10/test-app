export interface Reference {
  title: string
  url: string
}

export interface Source extends Reference {
  type: 'official' | 'github' | 'practice' | 'docs'
  note?: string
}

export interface Domain {
  id: string
  name: string
  /** Peso oficial del dominio en el examen, en % */
  weight: number
}

export interface ExamMeta {
  id: string
  name: string
  code: string
  provider: string
  version: string
  enabled: boolean
  description: string
  exam: {
    /** Preguntas por intento (similar al examen real) */
    questionCount: number
    durationMinutes: number
    /** % mínimo para aprobar en la app */
    passPercent: number
    /** Escala del puntaje oficial, si existe (ej. AWS 100-1000, aprueba 720) */
    scaled?: { min: number; max: number; pass: number }
    /** El pool debe tener questionCount * poolMultiplier preguntas */
    poolMultiplier: number
    notes: string[]
  }
  domains: Domain[]
  sources: Source[]
}

export type QuestionType = 'single' | 'multiple'

export interface Question {
  id: string
  domain: string
  type: QuestionType
  difficulty: 'medium' | 'hard'
  question: string
  /** Salida de comandos, topología o tabla (markdown) mostrada sobre las opciones */
  exhibit?: string
  options: string[]
  /** Índices (base 0) de las opciones correctas */
  answer: number[]
  explanation: string
  reference?: Reference
}

export interface TheoryTopic {
  id: string
  /** Objetivo del temario oficial, ej. "1.6" */
  objective?: string
  title: string
  /** Líneas markdown */
  content: string[]
  keyPoints: string[]
  references: Reference[]
}

export interface TheoryDomain {
  domainId: string
  topics: TheoryTopic[]
}

export interface Lab {
  id: string
  domain: string
  title: string
  tool: string
  difficulty: 'básico' | 'intermedio' | 'avanzado'
  estimatedMinutes: number
  cost?: string
  description: string
  objectives: string[]
  /** Markdown: topología, direccionamiento, requisitos previos */
  setup: string[]
  tasks: string[]
  /** Markdown, solo visible al pulsar "Ver solución" */
  solution: string[]
  verification: string[]
  references: Reference[]
}

export interface ExamContent {
  meta: ExamMeta
  questions: Question[]
  theory: TheoryDomain[]
  labs: Lab[]
}
