---
name: add-questions
description: Agregar o revisar preguntas de test (CCNA, AWS SAA u otro examen) en src/data/<examen>/questions con dificultad de examen real, respetando el peso por dominio y el pool ×3. Usar cuando se pida más preguntas, completar el pool, subir dificultad o corregir preguntas.
---

# Agregar preguntas de test

1. Lee `src/data/<examen>/meta.json` (dominios y pesos) y corre `npm run validate` para ver cuántas faltan por dominio.
2. Revisa las preguntas existentes del dominio para **no repetir** escenarios ni conceptos idénticos. Continúa la numeración de ids (`ccna-d3-076`, `aws-d2-052`).
3. Basa cada pregunta en un objetivo concreto del temario oficial y verifica el dato contra documentación oficial (Cisco config guides, AWS docs/FAQs, RFCs). Si dudas de un dato, búscalo; no inventes límites, valores por defecto ni comandos.
4. Escribe en el archivo del dominio (`questions/<n>-<slug>.json`). Si supera ~60 preguntas, crea `<n>-<slug>-b.json`.

## Formato

```json
{
  "id": "ccna-d3-001",
  "domain": "3",
  "type": "single",
  "difficulty": "hard",
  "question": "Texto de la pregunta (markdown).",
  "exhibit": "```\nR1# show ip route\n...\n```",
  "options": ["...", "...", "...", "..."],
  "answer": [2],
  "explanation": "Por qué la correcta es correcta y por qué fallan las otras.",
  "reference": { "title": "Doc oficial", "url": "https://..." }
}
```

- `single`: 4 opciones, 1 respuesta. `multiple`: 5 opciones (o 6 para "elige 3"), 2–3 respuestas.
- Mezcla aprox. 15–20 % `multiple` y ≥40 % `hard`.
- CCNA: incluir salidas `show`, cálculos de subnetting/wildcards, AD/métricas, elección de comando correcto.
- AWS: escenario de 2–4 oraciones con la restricción decisiva en mayúsculas como en el examen (MOST cost-effective, LEAST operational overhead…). Las 4 opciones deben ser arquitecturas que "funcionarían" a medias.
- Sin dumps: no copies preguntas de bancos de práctica ni de repos de "exam questions".

5. Corre `npm run validate` hasta 0 errores.
