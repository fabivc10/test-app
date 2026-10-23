---
name: add-exam
description: Agregar o habilitar un examen nuevo en la app (por ejemplo la prueba de idoneidad del MEP) creando su carpeta en src/data con meta, preguntas, teoría y labs. Usar cuando se pida soportar otra certificación o activar MEP.
---

# Agregar / habilitar un examen

1. Crea `src/data/<id>/meta.json` siguiendo `ExamMeta` en `src/types.ts` (copia `aws-saa/meta.json` como plantilla). La app lo detecta sola vía `import.meta.glob`.
2. Investiga el formato oficial (número de preguntas, duración, nota mínima, temario y pesos) en la fuente institucional. Para MEP: sitio oficial del MEP / Dirección de Gestión y Desarrollo Regional y Servicio Civil de Costa Rica; documenta las fuentes en `sources`.
3. Define `domains` con pesos que sumen 100. Si la institución no publica pesos, repártelos según el temario y anótalo en `exam.notes`.
4. Crea `questions/`, `theory/` y (si aplica) `labs.json` usando las skills `add-questions`, `add-theory`, `add-lab`. Si no hay labs, omite `labs.json` y la pestaña mostrará un aviso.
5. Mientras el contenido esté incompleto deja `"enabled": false`; al llegar al pool ×3 cambia a `true`.
6. `npm run validate` y `npm run build`.
