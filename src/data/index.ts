import type { ExamContent, ExamMeta, Lab, Question, TheoryDomain } from '../types'

const metas = import.meta.glob<ExamMeta>('./*/meta.json', { eager: true, import: 'default' })
const questionFiles = import.meta.glob<Question[]>('./*/questions/*.json', { eager: true, import: 'default' })
const theories = import.meta.glob<TheoryDomain>('./*/theory/*.json', { eager: true, import: 'default' })
const labFiles = import.meta.glob<Lab[]>('./*/labs.json', { eager: true, import: 'default' })

const folderOf = (path: string) => path.split('/')[1]

function collect<T>(files: Record<string, T | T[]>, folder: string): T[] {
  return Object.entries(files)
    .filter(([path]) => folderOf(path) === folder)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, items]) => items)
}

export const exams: ExamContent[] = Object.entries(metas)
  .map(([path, meta]) => {
    const folder = folderOf(path)
    return {
      meta,
      questions: collect(questionFiles, folder),
      theory: collect(theories, folder),
      labs: collect(labFiles, folder),
    }
  })
  .sort((a, b) => Number(b.meta.enabled) - Number(a.meta.enabled) || a.meta.name.localeCompare(b.meta.name))

export function getExam(id: string | undefined): ExamContent | undefined {
  return exams.find((e) => e.meta.id === id)
}
