# Cómo trabajar con Claude Code o Codex en esta carpeta

Guía práctica, 17/10/2026. Pensada para que puedas abrir **cualquier herramienta** en esta carpeta y retomar el trabajo sin perder contexto. Lo marcado *(no probado)* describe lo que se espera de cada herramienta según su documentación o lo que se configuró aquí, **no** algo que se haya comprobado ejecutándolo.

## 1. Qué lee cada herramienta
| Herramienta | Instrucciones | Agentes | Skills |
|---|---|---|---|
| **Claude Code** | `CLAUDE.md` (que importa `AGENTS.md`) | `.claude/agents/*.md` | `.claude/skills/*/SKILL.md` |
| **Codex** | `AGENTS.md` | `.codex/agents/*.toml` | `.agents/skills/*/SKILL.md` |
| ~~ChatGPT (web)~~ (ya no se usa, DEC-53) | Sin lectura automática: pídele que lea `AGENTS.md` y `REGISTRO_CAMBIOS.md` desde Google Drive | — | — |

*(no probado: ninguna de las tres cargas se ha comprobado en esta carpeta; la ubicación de skills y agentes de Codex viene de lo citado en `docs/REVISION_INICIAL_2026-09-29.md`.)*

**Fuente única:** los agentes se editan en `agentes/definiciones/` y las skills en `.agents/skills/`. Después se ejecuta `node herramientas/sincronizar_agentes_skills.mjs` (con Node en el PATH) para regenerar lo de Claude y Codex. **No edites a mano** `.claude/agents`, `.claude/skills` ni `.codex/agents`.

## 2. Al empezar cualquier sesión
Pega esto como primer mensaje:

> Ejecuta la skill `revisar-cambios-carpeta` y dime en una frase qué cambió desde la última vez. Luego lee `AGENTS.md` y `REGISTRO_CAMBIOS.md` y dime cuál es el siguiente paso pendiente.

Y al terminar:

> Ejecuta `registrar-cambios`: añade la entrada al registro, guarda la base de cambios y comprueba con `sanear-datos-reales` que no haya datos reales en lo que creaste.

## 3. Mensajes listos, por etapa
**Etapa 0 — Decidir (tú, con ayuda)**
> Léete `docs/decisiones/DECISIONES_ABIERTAS.md` y `ADR-001-pila-tecnologica.md`. Hazme las preguntas que necesites para cerrar OPEN-01, OPEN-02 y OPEN-03, una a una, y cuando yo responda anota la decisión en `DECISIONES_CERRADAS.md` y cambia el estado del ADR. No empieces a programar.

**Etapa 0 — Entorno**
> Sigue `docs/plan/ENTORNO.md` §4 conmigo paso a paso. Dime qué comando ejecutar y qué debo comprobar; no instales nada en C:.

**Etapa 1 — Afinar una especificación**
> Usa el agente `tesis-analista-sdd` (Codex: `tesis_analista_sdd`) sobre `specs/INC-01-base-operativa.md`. Cierra los criterios que falten (filtros y pestañas de ODS, contraseña inicial, decimales) y lista qué sigue bloqueando por decisiones abiertas.

**Etapa 2 — Corregir el modelo antes de programar**
> Usa `tesis-disenador-dominio` para proponer cómo corregir INC-A1, A2 y A6 de `INCONSISTENCIAS.md` en el SQL y en el UML R8, respetando las reglas del profesor. Propón; no decidas.

**Etapa 3 — Implementar (solo con el ADR-001 ACEPTADO)**
> Usa `tesis-implementador` para INC-01. Empieza por escribir las pruebas de CA-01-01 a CA-01-09 y muéstramelas antes de escribir el código. Ejecuta las pruebas y pégame la salida real.

**Etapa 4 — Revisar**
> Usa `tesis-revisor` sobre lo implementado de INC-01. Quiero la tabla criterio → cobertura → evidencia y los casos negativos que faltan. No edites nada.

**Etapa 5 — Documentar**
> Usa `tesis-documentador`: registra la evidencia en `docs/evidencias/`, regenera la trazabilidad y actualiza el registro.

**Pista P — Prototipo R7.7**
> Lee `specs/R7.7-prototipo.md`. Dime qué falta preparar para construir R7.7 en esta máquina (Python 3.13 y Node portable) y qué decisiones abiertas me tocan antes.

## 4. Reglas que cualquier herramienta debe cumplir
1. **Revisar cambios antes de ejecutar** y registrar al terminar.
2. **No tocar `../RMotriz_tesis_contexto/`.**
3. **Sin código de aplicación** mientras el `ADR-001` no esté ACEPTADO.
4. **Solo datos sintéticos.** Si ves datos reales, avisa; no los copies.
5. **No resolver en silencio** una decisión abierta ni una inconsistencia.
6. **Pruebas primero** y resultados reales; «no ejecutada» si no se ejecutó.
7. Las pruebas automáticas **no** equivalen a aceptación humana.

## 5. Herramientas de la carpeta
| Comando (desde la raíz) | Qué hace |
|---|---|
| `powershell -ExecutionPolicy Bypass -File herramientas\revisar_cambios.ps1 [-Guardar]` | Qué cambió desde la última foto; `-Guardar` fija la nueva base |
| `powershell -ExecutionPolicy Bypass -File herramientas\buscar_datos_reales.ps1 [-Ruta carpeta]` | Busca placas, RUC, DNI, celulares, VIN, correos y tokens (enmascarados) |
| `node herramientas/generar_requisitos.mjs` | Regenera clasificación de requisitos y tablas por incremento |
| `node herramientas/sincronizar_agentes_skills.mjs [--solo-comprobar]` | Regenera agentes y skills de Claude y Codex |
| `node herramientas/comprobar_enlaces.mjs` | Comprueba que las rutas citadas en los documentos existan |

Node: `$env:Path = "F:\Tesis\reverse-lab\node;" + $env:Path` (portable, solo para la sesión).
