import { useOutletContext } from 'react-router-dom'
import type { ExamContent } from '../types'

export const useExam = () => useOutletContext<ExamContent>()
