#!/usr/bin/env node
// Valida los JSON de src/data: esquema, ids únicos, respuestas válidas y tamaño del pool.
// Uso: node scripts/validate-content.mjs   (sale con código 1 si hay errores)
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DATA = new URL('../src/data/', import.meta.url).pathname
const errors = []
const warnings = []
const err = (where, msg) => errors.push(`✗ ${where}: ${msg}`)
const warn = (where, msg) => warnings.push(`! ${where}: ${msg}`)

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    err(path, `JSON inválido (${e.message})`)
    return null
  }
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isStrArr = (v) => Array.isArray(v) && v.every(isStr)
// Líneas markdown: se permiten líneas vacías como separadores, pero no todo vacío
const isMdLines = (v) => Array.isArray(v) && v.every((l) => typeof l === 'string') && v.some(isStr)
const listJson = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [])

for (const examDir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const base = join(DATA, examDir.name)
  const meta = readJson(join(base, 'meta.json'))
  if (!meta) continue
  const tag = examDir.name
  for (const k of ['id', 'name', 'code', 'provider', 'description']) if (!isStr(meta[k])) err(`${tag}/meta`, `falta ${k}`)
  if (!meta.enabled) {
    console.log(`· ${tag}: deshabilitado, se omite`)
    continue
  }
  const domainIds = new Set(meta.domains.map((d) => d.id))
  const weightSum = meta.domains.reduce((s, d) => s + d.weight, 0)
  if (weightSum !== 100) err(`${tag}/meta`, `los pesos suman ${weightSum}, no 100`)

  // Preguntas
  const ids = new Set()
  const texts = new Set()
  const questions = []
  for (const file of listJson(join(base, 'questions'))) {
    const arr = readJson(join(base, 'questions', file))
    if (!Array.isArray(arr)) {
      err(`${tag}/questions/${file}`, 'debe ser un arreglo')
      continue
    }
    arr.forEach((q, i) => {
      const w = `${tag}/questions/${file}[${i}] ${q?.id ?? ''}`
      if (!isStr(q.id)) return err(w, 'falta id')
      if (ids.has(q.id)) err(w, 'id duplicado')
      ids.add(q.id)
      if (!domainIds.has(q.domain)) err(w, `dominio "${q.domain}" no existe en meta`)
      if (!['single', 'multiple'].includes(q.type)) err(w, 'type debe ser single|multiple')
      if (!['medium', 'hard'].includes(q.difficulty)) err(w, 'difficulty debe ser medium|hard')
      if (!isStr(q.question)) err(w, 'falta question')
      if (!isStrArr(q.options) || q.options.length < 4) err(w, 'options necesita ≥4 strings')
      if (new Set(q.options).size !== q.options?.length) err(w, 'opciones repetidas')
      if (!Array.isArray(q.answer) || !q.answer.length) err(w, 'answer vacío')
      else {
        if (q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) err(w, 'índice de answer fuera de rango')
        if (new Set(q.answer).size !== q.answer.length) err(w, 'answer con índices repetidos')
        if (q.type === 'single' && q.answer.length !== 1) err(w, 'single debe tener 1 respuesta')
        if (q.type === 'multiple' && q.answer.length < 2) err(w, 'multiple debe tener ≥2 respuestas')
        if (q.type === 'multiple' && q.options.length < 5) warn(w, 'multiple con <5 opciones (el examen real usa 5+)')
      }
      if (!isStr(q.explanation) || q.explanation.length < 40) err(w, 'explanation ausente o muy corta')
      if (q.reference && (!isStr(q.reference.title) || !isStr(q.reference.url))) err(w, 'reference inválida')
      const norm = q.question?.toLowerCase().replace(/\s+/g, ' ')
      if (texts.has(norm)) warn(w, 'texto de pregunta duplicado')
      texts.add(norm)
      questions.push(q)
    })
  }

  // Sesgo de posición de la respuesta correcta (en la app se barajan, pero ayuda a detectar descuidos)
  const target = meta.exam.questionCount * meta.exam.poolMultiplier
  console.log(`\n■ ${meta.name} (${meta.code})`)
  console.log(`  Preguntas: ${questions.length} / meta ${target} (${meta.exam.questionCount} × ${meta.exam.poolMultiplier})`)
  if (questions.length < target) warn(tag, `pool incompleto: faltan ${target - questions.length} preguntas`)
  for (const d of meta.domains) {
    const n = questions.filter((q) => q.domain === d.id).length
    const expected = Math.round((target * d.weight) / 100)
    const mark = n >= expected ? '✓' : '·'
    console.log(`   ${mark} D${d.id} ${d.name.padEnd(40)} ${String(n).padStart(4)} / ${expected} (${d.weight}%)`)
    if (n < expected) warn(`${tag} D${d.id}`, `faltan ${expected - n} preguntas para respetar el peso`)
  }
  const multi = questions.filter((q) => q.type === 'multiple').length
  const hard = questions.filter((q) => q.difficulty === 'hard').length
  console.log(`  Multi-respuesta: ${multi} · Difíciles: ${hard}`)

  // Teoría
  const topicIds = new Set()
  let topics = 0
  for (const file of listJson(join(base, 'theory'))) {
    const d = readJson(join(base, 'theory', file))
    if (!d) continue
    const w = `${tag}/theory/${file}`
    if (!domainIds.has(d.domainId)) err(w, `domainId "${d.domainId}" no existe`)
    if (!Array.isArray(d.topics)) {
      err(w, 'topics debe ser arreglo')
      continue
    }
    d.topics.forEach((t, i) => {
      const tw = `${w} topics[${i}] ${t.id ?? ''}`
      if (!isStr(t.id) || topicIds.has(t.id)) err(tw, 'id ausente o duplicado')
      topicIds.add(t.id)
      if (!isStr(t.title)) err(tw, 'falta title')
      if (!isMdLines(t.content)) err(tw, 'content debe ser arreglo de líneas markdown')
      if (!Array.isArray(t.keyPoints)) err(tw, 'keyPoints debe ser arreglo')
      if (!Array.isArray(t.references)) err(tw, 'references debe ser arreglo')
      topics++
    })
  }
  const theoryDomains = new Set(listJson(join(base, 'theory')).map((f) => readJson(join(base, 'theory', f))?.domainId))
  for (const d of meta.domains) if (!theoryDomains.has(d.id)) warn(tag, `sin teoría para el dominio ${d.id}`)
  console.log(`  Temas de teoría: ${topics}`)

  // Labs
  const labsPath = join(base, 'labs.json')
  if (existsSync(labsPath)) {
    const labs = readJson(labsPath) ?? []
    const labIds = new Set()
    labs.forEach((l, i) => {
      const w = `${tag}/labs.json[${i}] ${l.id ?? ''}`
      if (!isStr(l.id) || labIds.has(l.id)) err(w, 'id ausente o duplicado')
      labIds.add(l.id)
      if (!domainIds.has(l.domain)) err(w, `dominio "${l.domain}" no existe`)
      for (const k of ['title', 'tool', 'difficulty', 'description']) if (!isStr(l[k])) err(w, `falta ${k}`)
      for (const k of ['objectives', 'tasks', 'verification']) if (!isStrArr(l[k]) || !l[k].length) err(w, `${k} vacío`)
      if (!isMdLines(l.solution)) err(w, 'solution vacío')
      if (!Array.isArray(l.setup)) err(w, 'setup debe ser arreglo')
      if (!Number.isInteger(l.estimatedMinutes)) err(w, 'estimatedMinutes debe ser entero')
    })
    console.log(`  Labs: ${labs.length}`)
  } else warn(tag, 'sin labs.json')
}

console.log('')
warnings.forEach((w) => console.log(w))
errors.forEach((e) => console.error(e))
console.log(`\n${errors.length} errores, ${warnings.length} advertencias`)
process.exit(errors.length ? 1 : 0)
