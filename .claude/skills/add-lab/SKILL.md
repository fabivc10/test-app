---
name: add-lab
description: Crear labs recomendados (Packet Tracer para CCNA, consola/CLI de AWS para SAA) en src/data/<examen>/labs.json con tareas, verificación y solución oculta. Usar cuando se pidan labs nuevos o mejorar uno existente.
---

# Agregar un lab

Los labs se hacen **fuera de la app** (Cisco Packet Tracer, GNS3/CML, consola AWS). La app muestra enunciado y la solución solo al pulsar "Ver solución".

Campos (ver `Lab` en `src/types.ts`):
- `id`: `ccna-lab-<slug>` / `aws-lab-<slug>`; `domain`: dominio principal.
- `tool`: "Packet Tracer", "AWS Console", "AWS CLI"…; `difficulty`: básico | intermedio | avanzado.
- `cost` (AWS): indicar si cabe en Free Tier y recordar borrar recursos al final.
- `setup`: topología/direccionamiento en markdown (tabla de IPs, dispositivos y enlaces).
- `tasks`: pasos que el estudiante debe lograr, **sin** dar los comandos.
- `verification`: comandos `show`/pruebas que demuestran que funciona.
- `solution`: configuración completa por dispositivo (bloques ```), o pasos de consola/CLI, más limpieza de recursos en AWS.
- `references`: doc oficial.

Alinea cada lab con objetivos del temario (los CCNA sims suelen ser: VLAN/trunk, EtherChannel, OSPF, rutas estáticas IPv4/IPv6, ACL, NAT, port-security). Corre `npm run validate`.
