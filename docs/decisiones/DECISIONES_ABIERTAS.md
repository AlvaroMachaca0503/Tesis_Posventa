# Decisiones abiertas

Consolidadas el 17/10/2026 desde: `docs/contexto/09_PREGUNTAS_PARA_RECORTE.md`, `docs/contexto/08_IMPLEMENTACION_EVIDENCIA_Y_LIMITES.md` §8, `docs/historial/R7/ESTADO_MIGRACION_CLAUDE.md` §4, `docs/historial/R7/PLAN_IMPLEMENTACION_PRIORIZADO.md`, `docs/historial/R7/CLAUDE_RMotriz_tesis_contexto.md` (pendientes R7.7), los archivos `CAMBIOS_R7.x.md` y `docs/decisiones/INCONSISTENCIAS.md`.

**Regla:** nadie (ni un agente) resuelve estas decisiones en silencio. Cuando se decida una, se mueve a `DECISIONES_CERRADAS.md` con fecha y quién la tomó. «Recomendación de las fuentes» es lo que ya proponían los documentos del proyecto; «propuesta del asistente» es una sugerencia nueva y se marca como tal.

Leyenda de bloqueo: **B0** = bloquea empezar a escribir código; **B-INC-x** = bloquea ese incremento; **—** = no bloquea.

## 1. Bloqueantes para implementar

| ID | Pregunta | Opciones | Recomendación de las fuentes | Decide | Bloquea |
|---|---|---|---|---|---|
| OPEN-01 | **Pila tecnológica final** | Python/SQLite · JS-TS con SQLite/PostgreSQL · otra | «Monolito modular con base relacional»; «conservar contratos de dominio e importación y elegir la pila que el equipo pueda probar y desplegar» (`07_ARQUITECTURA`, `09`). Propuesta del asistente en `ADR-001` | Investigador (con el profesor si lo exige) | **B0** |
| OPEN-02 | ¿Una sede piloto o dos? | Una (diseño compatible con varias) · dos | Una sede piloto, diseño compatible con varias (`09` §2) | Investigador | B-INC-01 |
| OPEN-03 | **Dónde vive el código** (la carpeta se sincroniza con Drive; `node_modules`, builds y bases de datos locales no deberían sincronizarse) | Repositorio git en disco local + Drive para docs · todo en Drive | Sin recomendación en las fuentes. Propuesta del asistente en `docs/plan/ENTORNO.md` | Investigador | **B0** |
| OPEN-04 | Alcance de IA | Reglas explicables con abstención · modelo entrenado | Reglas/selector explicable con abstención; entrenamiento solo si hay dataset suficiente (`09` §2) | Investigador / profesor | B-INC-04 (RF-22, 32, 33) |
| ~~OPEN-05~~ | ~~¿INC-07 (productos/logística) entra a la tesis?~~ | **CERRADA el 19/10/2026: SÍ** (inventario completo en la primera versión) → `DEC-40` en `DECISIONES_CERRADAS.md`. El profesor debe conocerla. | — | Investigador | — |
| ~~OPEN-06~~ | ~~¿Notas, adelantos, caja y bancos quedan fuera de implementación?~~ | **CERRADA el 19/10/2026:** notas, adelantos y **bancos entran** (Bancos simple, sin conciliación); la **apertura y cierre de caja** quedan en beta (apagada) → `DEC-37` y `DEC-38`. | — | Investigador | — |
| OPEN-07 | **Datos reales para pruebas**: qué XLSX de Tuulapp/ToolLab, anonimizados, estarán disponibles | — | Pedir archivos anonimizados (`09`, pregunta 6) | Investigador / empresa | B-INC-02 |
| OPEN-08 | **Quién valida mecánicamente** los planes, equivalencias e intervalos | Experto/jefe identificado | Validación por jefe/experto mecánico identificado (`09` §2) | Investigador | B-INC-04, B-INC-05 |
| OPEN-09 | **Quién firma la aceptación** y con qué roles se prueba | Cajera, técnico, jefe, administrador | Pruebas con cajera, técnico, jefe y administrador (`09` §2) | Investigador | Cierre de cada INC |
| OPEN-10 | Muestra de vehículos/ODS y **línea base** de tiempo y trazabilidad | — | Definir muestra, instrumento y periodo antes de concluir mejoras (`06` §8) | Investigador / profesor | Evaluación |
| OPEN-11 | **Fecha de congelación de requisitos** | — | Después del taller de selección del equipo (`09` §2) | Investigador | — |
| OPEN-39 | **Series de comprobantes en beta.** Consulta del 19/10/2026: como las cajas son beta, ¿las series también, para conservar su lógica? | Sí: gestión de series oculta (beta), numeración por sede automática (N001 Unión, N002 Prohogar) · No: se queda el módulo en Maestros | Recomendación del asistente: **sí**, porque la nota de venta solo necesita el correlativo por sede; se pierde crear series nuevas (B001, F001) hasta activar la beta | Investigador | — |

## 2. De dominio (cada una afecta a un incremento)

| ID | Pregunta | Fuentes y valores | Propuesta | Bloquea |
|---|---|---|---|---|
| OPEN-20 | **Aceite no especificado** | 5 000 km (R5, usado por el motor R8) frente a «sin intervalo» (contexto 29/09) — ver INC-C1 | Mantener el interruptor `politicaAceiteNoEspecificado` y que decida el profesor/experto (`ESTADO_MIGRACION` §4.1) | B-INC-04 |
| OPEN-21 | **Reajuste directo o con propuesta y aprobación** | R7 directo; R8 propone, aprueba o rechaza — INC-B3 | R8 (propuesta + aprobación humana): respeta «validación humana antes de modificar la programación» (`ESTADO_MIGRACION` §2). **Confirmar con el capítulo III** | B-INC-05 |
| OPEN-22 | **Vocabulario de estados de cita** | UML R8 · SQL/R7.2 — INC-B1 | Elegir uno y actualizar UML, SQL, HTML y matriz | B-INC-06 |
| OPEN-23 | **Lista de roles** | Documento (6 roles) frente a UML R8 (5, con Experto y sin Logística) — INC-A6 | Unir ambas listas y decidir cuáles son roles de aplicación | B-INC-01 |
| OPEN-24 | Almuerzo (13–14 o 14–15) y horario semanal | INC-C2; valor inicial R5: lunes a sábado 08:00–18:00 | Configurable; fijar el valor inicial | B-INC-03 |
| OPEN-25 | ¿Se mantiene «máximo dos servicios simultáneos por técnico»? | INC-C3, RF-44 | Decidir mantener o retirar | B-INC-03 |
| OPEN-26 | **Definición de «cita convertida»** (indicador de posventa) | INC-C4 | Una sola definición para reporte y RF-59 | B-INC-06 |
| OPEN-27 | ¿Vuelve «Cancelado» como estado seleccionable de tarea? | INC-C5 (28 usos reales en caja) | Pregunta de R7.7 al investigador | R7.7 |
| OPEN-28 | ¿La regla «fecha límite → Urgente» se reemplaza por **notificar**? | INC-C6: en el uso real de ClickUp, 123 de las 176 tareas de Operaciones están en «urgente» y la prioridad pierde sentido (`ANALISIS_CLICKUP_R77` §1) | Notificar (`ANALISIS_CLICKUP_R77` §3) | R7.7 |
| OPEN-29 | ¿La **auditoría ODS ↔ nota de venta** entra al núcleo y con qué tolerancia? | Tolerancia propuesta: S/ 0,00 | Decidir | R7.7 |
| ~~OPEN-30~~ | ~~¿**Series de comprobantes y cajas** entran a la tesis?~~ | RF-109, RF-82 | **CERRADA el 19/10/2026:** las **series entran y se asignan a una sede** (`DEC-39`); las **cajas** quedan en **beta** y apagadas (`DEC-37`). | — |
| OPEN-31 | ¿La ODS conserva sus 4 procesos con el diseño de Tuulapp? ¿El simulador de fecha afecta a todo el sistema? | Pedido R7.7 | Decidir | R7.7 |
| OPEN-38 | **Grupos G1–G8 y asignación de planes** (INC-C8) y **cálculo de la tasa km/mes** (INC-C9) | Dos valores distintos cada uno | Elegir uno; el motor y el prototipo deben coincidir | B-INC-04 |
| OPEN-33 | **Mapeo `R`→PERIODICA y `A`→AUTONOMA** de los planes importados de R7 | «Interpretación sin confirmar» | Confirmar con quien hizo los planes | B-INC-04 |
| OPEN-34 | **Validación técnica de los 3 planes (33 reglas)** | Hoy «sin validación técnica» | Ver OPEN-08 | B-INC-04 |
| OPEN-35 | Valores de demostración: H-H S/ 30, capacidad 160 h/mes, punto de equilibrio S/ 4 500; precios de grupos G2/G3 | Referenciales (R7.4 y R7.5) | Confirmar con el taller | Métricas |
| OPEN-36 | ¿Dónde van «Espacio de trabajo» y «Línea temporal» en el menú? ¿Qué módulos llevan la etiqueta «tesis»? | R7.5 | Decidir | R7.7 |
| OPEN-37 | Corrección de inconsistencias del modelo de datos | INC-A1 a A6 | Cada INC los corrige en su propia especificación | B-INC-x |

## 3. Académicas

| ID | Pregunta | Fuente |
|---|---|---|
| OPEN-40 | Discrepancias PDF ↔ R7 (IA, Picanto, agenda, pila, referencias, artefactos) | INC-D1 a D6 |
| OPEN-41 | ¿Se mantiene el nombre del experto en la tesis y en documentos sincronizados? | INC-E4 |
| OPEN-42 | ¿Los RF-85 a RF-117 (añadidos en R7.1–R7.6) se clasifican como núcleo, extensión o evolución? | `docs/requisitos/CATALOGO_RF.md`: las fuentes no los clasifican |
| OPEN-43 | Metas de investigación (más de 90 % de reajustes documentados; al menos 20 % menos de tiempo de generación de planes) | Son metas, no mediciones (`AGENTS.md`) |
