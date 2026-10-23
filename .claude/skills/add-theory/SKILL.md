---
name: add-theory
description: Escribir o ampliar la teoría por temario (src/data/<examen>/theory/*.json) alineada a los objetivos oficiales del examen. Usar cuando se pida agregar temas, profundizar un dominio o actualizar a un nuevo temario.
---

# Agregar teoría

1. Cada archivo `theory/<n>-<slug>.json` es un objeto `TheoryDomain` (`{ "domainId": "1", "topics": [...] }`). Ver `src/types.ts`.
2. Un tema por objetivo (o grupo pequeño de objetivos) del temario oficial; pon el código en `objective` (ej. `"3.4"` en CCNA, `"1.2"` = Task Statement en AWS).
3. `content` es un arreglo de líneas markdown (se unen con `\n`). Usa tablas para comparativas, bloques ``` para configuración IOS / CLI, y listas. Una línea vacía `""` separa párrafos.
4. `keyPoints`: 3–7 bullets de lo que el examen suele preguntar (trampas, valores por defecto, "cuándo usar X vs Y").
5. `references`: enlaces a documentación oficial (Cisco, AWS docs, RFC) y, como apoyo, repos de GitHub de apuntes reconocidos.
6. Mantén el orden del temario oficial. Ids: `<examen>-t<dominio>-<slug>`.
7. Corre `npm run validate`.
