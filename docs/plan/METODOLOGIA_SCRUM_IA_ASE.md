# Metodología unificada: Scrum + IA-ASE

Decidida por el investigador el 19/10/2026 (DEC-53). Figura: `fuentes-latex/imagenes/capitulo_04_diseno/diagramas/DAM-0002_metodologia_scrum_ia_ase.png` (también en `2_documento-tesis-overleaf/imagenes/capitulo_04_diseno/diagramas/`).

Un solo ciclo iterativo e incremental. **Herramienta de IA: Claude Code. ChatGPT no se usa para desarrollar.**

| Concepto | Qué es aquí |
|---|---|
| Product Backlog | Necesidades y criterios de aceptación del taller (`docs/requisitos/`, `specs/`) |
| Sprint Planning | Objetivo del Sprint e historias; se elige la spec del incremento |
| Sprint (Daily) | Período corto con seguimiento diario |
| Especificar (SDD) | La spec `specs/*.md` con criterios Dado/Cuando/Entonces es la fuente |
| Construir (agentes IA) | `tesis-implementador` escribe pruebas primero y luego el cambio |
| Validar (harness) | Pruebas automáticas (Playwright hoy; las del sistema real mañana) y revisión humana (`tesis-revisor`) |
| Review + Retro | Demostración al taller y mejora; se registra en `REGISTRO_CAMBIOS.md` |
| Incremento | MVP, v1, v2 y versión final; se acumulan |
| Humano valida / IA apoya | Toda decisión y aceptación es del investigador |

Agentes (`agentes/definiciones/`): analista SDD, analista de importación, diseñador de dominio, implementador, revisor y documentador. Skills en `.agents/skills/`. Configurar un agente no equivale a haberlo ejecutado.
