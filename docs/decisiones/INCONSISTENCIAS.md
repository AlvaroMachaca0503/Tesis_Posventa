# Inconsistencias detectadas entre artefactos (17/10/2026)

Encontradas al contrastar el SQL propuesto, los diagramas R8, la matriz R7.6 y los documentos de contexto. **No se corrigió ninguna**: cada una necesita decisión del investigador (y, en UML, del profesor). Se citan los archivos para poder verificarlas. Las marcadas **[verificada]** se comprobaron leyendo los archivos el 17/10/2026; las demás vienen de lo que ya declaran los documentos.

Rutas relativas a la raíz del proyecto. `SQL` = `tesis/latex/modelo/esquema_propuesto.sql`. `UML R8` = `diagramas/R8_propuesta/`.

## A. Modelo de datos (SQL) frente a las decisiones R7

| ID | Inconsistencia | Evidencia | Efecto | Bloquea |
|---|---|---|---|---|
| INC-A1 **[verificada]** | **No existe la decisión del cliente a nivel de ODS.** La tabla `ordenes` no tiene columna de decisión (Pendiente / Aprobada / No aprobada), pero R7 la define y el UML la usa (`OrdenServicio.decisionCliente`). | SQL, `CREATE TABLE ordenes`; `docs/contexto/FUENTES_R7/DECISIONES_R7.md` #1–#2; `UML R8/DCL-R8-0001A` | RF-63 y RF-64 (reaprobación solo por ítem nuevo) no se pueden persistir | INC-01 |
| INC-A2 **[verificada]** | **No existe la bitácora única por ODS.** Solo hay `auditoria` y `notificaciones`. La bitácora (comentarios, menciones, etiquetas, respuestas, adjuntos, antes/después legible) es una decisión R7 (#21–#22) y la distingue de la auditoría. | SQL (sin tabla de bitácora); `docs/contexto/04_VISION_COMPLETA_MODULOS.md` §2.8 y §2.17 | RF-62 sin soporte de datos | INC-01 |
| INC-A3 **[verificada]** | **No existe la entidad Reajuste.** El UML R8 define `Reajuste` y `EstadoReajuste` (PENDIENTE, APROBADO, RECHAZADO, ABSTENIDO) con antes/después y `claveEvento`; el SQL solo tiene `proyecciones` y `evidencias_plan`. | SQL; `UML R8/DCL-R8-0001B` | RF-16 no se puede persistir con propuesta y aprobación | INC-05 |
| INC-A4 **[verificada]** | **`detalles.minutos_iniciales` y `minutos_revisados` exigen múltiplos de 30**, mientras R7.1 fija 15 min / 0,25 H-H. El propio README del modelo dice «minutos múltiplos de 15». En cambio `servicios_cita.minutos` y `bloques` sí usan 15. | SQL, tabla `detalles`; `tesis/latex/modelo/README.md`; `docs/historial/R7/CAMBIOS_R7.1.md` punto 7 | Un servicio de 0,25 H-H (15 min) violaría el `CHECK` | INC-03 |
| INC-A5 **[verificada]** | **El modelo logístico está incompleto.** Hay `compras` y `lineas_compra`, pero no hay cotizaciones, versiones de cotización, alternativas, proveedores (el proveedor es un texto), evidencias de Compra/Entrega, conformidad técnica ni ajustes de compra, que son decisiones R7 (#8–#15). | SQL; `docs/contexto/03_DECISIONES_INICIALES_A_FINALES.md` | RF-72 a RF-79 sin soporte de datos | INC-07 |
| INC-A6 | **`usuarios.rol` es texto libre** y los roles del documento (Administrador, Cajera, Técnico, Jefe de taller, Logística, Posventa) no coinciden con el `enum Rol` del UML R8 (ADMINISTRADOR, CAJERA, TECNICO, JEFE_TALLER, EXPERTO), que **no incluye Logística y sí un Experto**. | SQL; `docs/contexto/05_REGLAS_NEGOCIO_ESTADOS_ROLES.md` §1; `UML R8/DCL-R8-0001A` | La autorización por rol no puede definirse sin cerrar la lista | INC-01 |

## B. UML R8 frente a SQL, HTML y documentos

| ID | Inconsistencia | Evidencia | Efecto |
|---|---|---|---|
| INC-B1 **[verificada]** | **Tres vocabularios de estado de cita.** UML R8: RESERVADA, RECONFIRMADA, LLEGADA_CONVERTIDA, REPROGRAMADA, CANCELADA. SQL y R7.2: pendiente, confirmada, completada, cancelada, no_asistio. | `UML R8/DCL-R8-0001C`; SQL `citas.estado`; `docs/historial/R7/CAMBIOS_R7.2.md` punto 6 | Hay que elegir uno antes de INC-06 (también afecta DES-R8) |
| INC-B2 | **`EstadoSeguimiento` (UML R8) no tiene equivalente en el SQL**: las tareas de seguimiento usan `tareas.estado` (pendiente, en_proceso, completada, cancelada). | `UML R8/DCL-R8-0001C`; SQL `tareas` | Falta mapear seguimiento ↔ tarea |
| INC-B3 | **Reajuste directo frente a propuesta y aprobación.** R7 (DSE-0002) y el HTML archivan y reanclan la proyección directamente; el UML R8 separa `proponerReajuste` / `aprobarReajuste` / `rechazarReajuste`. | `docs/historial/R7/DIAGNOSTICO_UML.md` DIF-004 y DIF-011; `docs/historial/R7/CAMBIOS_R7.1.md` («Sin cambiar») | Cambia el contrato de `ServicioODS.archivar` e INC-05 |
| INC-B4 | **Nombres de clase cambiados en R8**: `cerrar` pasa a `archivar`, `corregirCerrada` a `corregirArchivada`, la entidad `ServicioCita` a `LineaCita`. Las secuencias y la matriz de R7.6 aún pueden citar los nombres antiguos. | `docs/historial/R7/DIAGNOSTICO_UML.md` DIF-002/003 | La matriz de trazabilidad R7.6 no coincide con los nombres R8 |
| INC-B5 | **`Planificador.agregarContinuacion` lanza «No implementado en R8»** deliberadamente. | `docs/historial/R7/ESTADO_MIGRACION_CLAUDE.md` §5 | INC-03 debe implementarlo desde cero |

## C. Reglas de dominio con valores distintos entre fuentes

| ID | Tema | Valor A | Valor B | Dónde está cada uno |
|---|---|---|---|---|
| INC-C1 | Aceite no especificado | 5 000 km (R5, usado por el motor R8 con interruptor `politicaAceiteNoEspecificado`) | Sin intervalo: «aceite desconocido no implica intervalo» (contexto 29/09) | `docs/DECISIONES_R5_2026-10-11.md`; `nucleo-referencia/src/motor.js`; `docs/CONTEXTO_TESIS.md` |
| INC-C2 | Almuerzo | 13:00–14:00 (R5, motor R8) | 14:00–15:00 (seed del HTML R7) | `docs/historial/R7/ESTADO_MIGRACION_CLAUDE.md` §4.2 |
| INC-C3 | Máximo de servicios simultáneos por técnico | Dos (R5, motor R8, RF-44) | «Revisar si permanece» | `docs/contexto/05_REGLAS_NEGOCIO_ESTADOS_ROLES.md` §11 |
| INC-C4 | Definición de «cita convertida» | Cita con ODS **creada** (reporte R7.6) | ODS **archivada** con al menos un servicio (RF-59) | `docs/historial/R7/CAMBIOS_R7.6.md` |
| INC-C5 | Estado «Cancelado» en tareas | No seleccionable; lo marca el sistema (R7.6) | Aparece 28 veces en el uso real de caja y existe en el SQL | `docs/historial/R7/ANALISIS_CLICKUP_R77.md`; SQL `tareas.estado` |
| INC-C6 | Regla «fecha límite → Urgente» | Vigente en el uso real de ClickUp | Propuesta: reemplazarla por notificar | `docs/historial/R7/ANALISIS_CLICKUP_R77.md` §4 |
| INC-C7 **[verificada]** | **Compras y notas de venta: inmutables o editables.** R7 (decisión #12, RF-75) y R5 las declaran inmutables y corregibles solo con ajustes. R7.4 permite **editar y eliminar** comprobantes de compra (revierte sus pagos) y **eliminar** notas de venta; la tabla «Ajustes» se quitó (RF-96). | Inmutable (`DEC-12`, `DEC-29`) | Editable/eliminable (`docs/historial/R7/CAMBIOS_R7.4.md`, secciones Compras y Notas de venta) | `docs/decisiones/DECISIONES_CERRADAS.md`; `docs/historial/R7/CAMBIOS_R7.3.md` («Decisiones y límites») y `CAMBIOS_R7.4.md` |
| INC-C8 **[verificada]** | **Grupos G1–G8 y asignación de planes.** El contexto del 29/09 dice «No asignar por grupo comercial G1–G8»; R7.4 (RF-112) hace que cada grupo lleve planes y que al crear o editar un vehículo «la automatización le asigne grupo y plan». | No asignar por grupo; asignación explícita (`docs/CONTEXTO_TESIS.md`, línea 35) | Asignación automática por grupo (`docs/historial/R7/CAMBIOS_R7.4.md`; RF-112) | Ambos |
| INC-C9 **[verificada]** | **Cálculo de la tasa de km/mes.** El prototipo R7.2 (RF-92) la calcula con las **últimas 5 ODS con km**. El motor R8 la calcula con **la primera y la última lectura** de todo el historial (y exige al menos 2 meses entre ellas). Dan tasas distintas para el mismo vehículo. | Últimas 5 visitas (`docs/historial/R7/CAMBIOS_R7.2.md`, punto 8) | Primera a última lectura (`nucleo-referencia/src/motor.js`, función `contextoKm`) | Ambos |

## D. Conflictos entre la tesis (PDF del 29/09) y lo construido (R7)

Heredados de `docs/REVISION_INICIAL_2026-09-29.md`; se conservan porque siguen sin resolverse:

| ID | Tema | Detalle |
|---|---|---|
| INC-D1 | Entrenamiento de IA | 1.4.1 y 1.8.3 excluyen un modelo propio; 2.1, 4.6 y 4.11 mencionan modelo entrenable |
| INC-D2 | Ejemplo Kia Picanto | El cuadro 3.1 lo ubica en INC-03; 4.11 lo incorpora al primer hito |
| INC-D3 | Agenda técnico/bahía | 1.6 lo menciona; 2.7 lo excluye; RF-20 define la sede |
| INC-D4 | Pila tecnológica | 1.7.1: JS/TS, Node/Apps Script, PostgreSQL/Sheets; código existente: Python/SQLite (línea A) y HTML/localStorage (línea B) |
| INC-D5 | Referencias internas | 1.2.1 cita PRISMA como [7]; la bibliografía lo asigna a [11] |
| INC-D6 | Artefactos declarados | 4.12 menciona fuentes PlantUML y PNG que no estaban entre los archivos de la línea A |

## E. Datos y entorno

| ID | Hallazgo | Acción sugerida |
|---|---|---|
| INC-E1 **[verificada]** | El seed del HTML R7.6 trae RUC de proveedores (dos RUC de 11 dígitos (uno empieza por 206 y otro por 204; no se reproducen aquí)) y celulares de muestra. R7.1 ya pidió «revisar si son reales». | Confirmar con el investigador; si son reales, sustituir por valores sintéticos |
| INC-E2 **[verificada]** | `prototipo/construir.sh` llama a `python3`, que en esta máquina es un acceso directo de la tienda de Windows (Python 3.13.3 sí está instalado como `python` y `py`). Además, en Windows Python escribe los HTML con `
` y el resultado deja de ser idéntico byte a byte al original (idéntico tras normalizar saltos de línea). `xelatex` no está instalado (solo Tectonic). Node solo existe portable. | Ver `docs/plan/ENTORNO.md` |
| INC-E5 **[verificada con el escáner]** | **Datos reales en la carpeta sincronizada con Drive**, fuera de las partes nuevas: (a) `tmp/sesion5_base/datos/` contiene **tres exportaciones de Tuulapp** (clientes, vehículos y reporte de operaciones; ≈ 11 MB) con datos de clientes; (b) `tmp/tuulapp_revision/pdf_text.txt` contiene texto extraído de PDF con placas y VIN de vehículos distintos; (c) los HTML de `entregables/revision_R3` a `R7`, `entregables/prototipo_modulos` y varios scripts de `tmp/` contienen **una placa y un VIN reales** de un vehículo; (d) `docs/DECISIONES_R5_2026-10-11.md` cita la misma placa. **No se abrieron las exportaciones.** | **P0 del propio proyecto** (`docs/historial/R7/ESTADO_MIGRACION_CLAUDE.md` §4.7 «anonimizar antes de compartir»). Decidir: sacar `tmp/sesion5_base/datos` y `tmp/tuulapp_revision` de la carpeta sincronizada, y anonimizar o retirar los entregables ya enviados |
| INC-E4 **[verificada]** | El nombre de una persona real (el experto que validaría los planes y administrador general) aparece en la tesis (`tesis/latex/tesis_tecnologica_revision.tex`, líneas 739 y 915) y en `docs/DECISIONES_R5_2026-10-11.md`. Una tesis suele nombrar a sus validadores, pero la regla del proyecto prohíbe nombres reales de empleados en una carpeta que se sincroniza con la nube. | Decidir si se mantiene el nombre (con su consentimiento) o se sustituye por un rol |
| INC-E3 | `docs/contexto/SHA256SUMS.txt` y `MANIFEST.json` describen los archivos **originales**. En esta copia se sustituyó la placa real de 4 documentos por «[placa real omitida]» (ver `docs/contexto/PROCEDENCIA.md`), así que esos hashes ya no coinciden. | No usar esos hashes para validar la copia |
