# AGENTS.md — CertStudy

App web (React + Vite + TypeScript) para estudiar certificaciones. Todo el contenido vive en JSON dentro de `src/data/`; no hay backend. El progreso del usuario (intentos, historial, temas estudiados) se guarda en `localStorage`.

## Exámenes

| Carpeta | Examen | Estado | Formato simulacro | Pool objetivo (×3) |
|---|---|---|---|---|
| `src/data/ccna` | Cisco CCNA 200-301 v1.1 | activo | 100 preguntas / 120 min | 300 |
| `src/data/aws-saa` | AWS Solutions Architect – Associate SAA-C03 | activo | 65 preguntas / 130 min | 195 |
| `src/data/mep` | Prueba de idoneidad MEP | `enabled: false` (pendiente) | — | — |

Prioridad actual: CCNA y AWS SAA. MEP se habilitará después (ver skill `add-exam`).

## Estructura

```
src/
  data/<examen>/
    meta.json              # examen, dominios oficiales con peso %, fuentes
    questions/<n>-<slug>.json  # arreglo de preguntas, un archivo por dominio (se pueden partir: 3-ip-connectivity-b.json)
    theory/<n>-<slug>.json     # un TheoryDomain por dominio
    labs.json              # labs recomendados (solución oculta en la UI)
  data/index.ts            # carga todo con import.meta.glob (no hay que registrar archivos nuevos)
  lib/exam.ts              # motor: selección estratificada por peso, barajado de opciones, puntaje
  pages/                   # Home, ExamLayout (tabs), TheoryPage, TestsPage, TestRunner, Results, LabsPage, SourcesPage
  types.ts                 # esquema de todos los JSON — fuente de verdad
scripts/validate-content.mjs  # valida esquema, ids, respuestas y tamaño del pool por dominio
.claude/skills/            # flujos para agentes (agregar preguntas, teoría, labs, exámenes)
```

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run validate` — valida el contenido (correr SIEMPRE tras editar JSON)
- `npm run build` — validate + typecheck + build de producción (`dist/`)

## Reglas de contenido

1. **Contenido original.** Las preguntas se redactan a partir del temario oficial y la documentación oficial (Cisco, AWS, RFCs). Repos de GitHub y plataformas de práctica se usan como guía de cobertura y nivel, **nunca** se copian preguntas de dumps ni de bancos comerciales (viola el NDA de los exámenes y el copyright).
2. **Dificultad realista.** CCNA: salidas de `show`, subnetting, troubleshooting, comandos exactos. AWS: escenario con requisitos y una restricción decisiva ("MOST cost-effective", "LEAST operational overhead"); los distractores deben ser plausibles (servicios reales mal aplicados), no absurdos.
3. **Idioma.** Español, con términos técnicos, comandos y nombres de servicios en inglés tal como aparecen en el examen.
4. **Pool ×3.** Cada examen debe tener `questionCount × poolMultiplier` preguntas, repartidas según el peso de cada dominio (el validador muestra el objetivo por dominio).
5. **Respuestas.** `answer` usa índices base 0. La app baraja las opciones, así que no uses "A y B" en el texto; las opciones con "todas las anteriores" quedan fijas al final. `multiple` = "Elige N" con N = `answer.length`.
6. **Explicación obligatoria** que diga por qué la correcta lo es y por qué fallan los distractores principales. Añade `reference` a la doc oficial cuando sea posible.
7. **Ids estables**: `<examen>-d<dominio>-<nnn>` (ej. `ccna-d3-042`, `aws-d1-017`). Nunca reutilices un id borrado.
8. Markdown permitido en `question`, `exhibit`, `options`, `explanation` y en las líneas de teoría/labs. Para salidas de consola usa bloques ``` en `exhibit`.

## Convenciones de código

- Componentes funcionales + hooks, TypeScript estricto, CSS plano en `src/styles.css` con variables (tema claro/oscuro automático).
- Sin dependencias nuevas salvo necesidad real. Router con `HashRouter` (funciona en cualquier hosting estático).
- Acceso a `localStorage` solo vía `src/lib/storage.ts` (tolera errores).

## Despliegue

Vercel conectado al repo de GitHub; el branch `dev` es el que se publica. Build: `npm run build`, salida `dist/`.
