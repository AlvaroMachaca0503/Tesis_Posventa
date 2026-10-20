# Análisis: gestión de tareas y automatizaciones del HTML frente a ClickUp (plan para R7.7)

**Estado:** PLAN PARA DECIDIR. **No se cambió el HTML ni ningún archivo del prototipo.** Fecha: 17/10/2026.
**Qué se leyó:** `prototipo/capas/r74/e_auto.js` (motor actual, completo), `r73/d_tasks.js` (espacio de trabajo, recurrencia, fechas), la capa base de tareas del HTML R7.6 (modelo, filtros, vistas, panel, acciones masivas, comentarios) y una búsqueda de las **157 acciones** que el sistema registra. Se comparó con `docs/referencias/clickup/` y con el uso real de ClickUp (cifras agregadas del 17/10/2026, sin nombres).
**Lo que NO se hizo:** no se ejecutó el prototipo ni sus pruebas; no se leyó cada capa línea a línea (solo lo citado). Lo marcado *(deducido)* es criterio del asistente.

## 1. Resumen en diez líneas
1. Hoy el HTML **no tiene un motor de automatizaciones**: tiene **tres reglas fijas** (consultar km, confirmar cita, posventa) con parámetros editables, **un solo responsable y una sola lista de destino** para todas.
2. La **gestión de tareas ya es sólida** y bastante parecida a ClickUp: listas y carpetas, vistas Lista/Tablero/Calendario/Agenda, filtros anidados Y/O, agrupación, vistas guardadas y favoritas, subtareas, recurrencia, acciones masivas, comentarios con respuestas, reacciones y adjuntos.
3. **El punto de enganche ya existe:** casi todo pasa por `save('Acción', detalle)`. Hay **157 acciones distintas** (ODS, citas, cotizaciones, compras, caja, jornada, usuarios…). Es la base para que **cualquier módulo dispare una regla**.
4. **El límite real:** `save` solo recibe texto libre, no datos estructurados (qué ODS, qué monto, antes/después). Para disparadores fiables hay que emitir **eventos con datos** en unos 20 puntos clave.
5. **Propuesta:** un motor **«Cuando / Y si / Entonces»** que el usuario configura, donde **las acciones se limitan a la gestión de tareas** (crear, actualizar, comentar, avisar). **Nunca** cambian ODS, citas, agenda ni dinero.
6. Las 3 reglas actuales pasan a ser **plantillas de sistema** del nuevo motor, con la misma salida (prueba de regresión).
7. De ClickUp se toma **lo que se usa de verdad**: reglas simples, plantillas de tarea con variables, historial de ejecuciones, recurrentes, bandeja de avisos, asignación múltiple y seguidores.
8. **No se copia** lo que no aporta aquí: Gantt, campos personalizados, control de tiempo, dependencias, sprints, webhooks, IA, formularios, docs/pizarras, chat, integraciones, límites de plan.
9. El **uso real** de ClickUp lo respalda: casi toda la «automatización» son **tareas recurrentes** (83); la única regla viva («fecha límite → Urgente») dejó **el 42 % de las tareas en urgente**; **el 28 % tiene 2 o más responsables** y **el 50 %, 2 o más seguidores**.
10. Hay **7 decisiones** tuyas antes de construir (sección 9). Después, el plan son 4 fases pequeñas y probables una a una, terminando en **mockups con capturas**.

## 2. Qué tiene hoy el HTML en gestión de tareas
| Función | Estado en R7.6 | Dónde |
|---|---|---|
| Carpetas y listas, renombrar, favoritos (sección y pestañas) | ✔ | `workspaceTree`, `r73ListMenu` |
| Vistas: Lista, Tablero, Calendario, Agenda de técnicos | ✔ (tablero de 3 columnas) | `taskContentR6` |
| Filtros anidados Y/O (estado, persona, prioridad, etiquetas, fecha límite, tipo, sede, lista, nombre; operadores es / no es / contiene / no contiene) | ✔ | `r6FilterPanel`, `r6MatchOne` |
| Agrupar (estado, lista, prioridad, persona, tipo) | ✔ | `r6GroupKey` |
| Vistas guardadas y favoritas; columnas ocultables y redimensionables | ✔ | `r6SaveView`, `r73FavView` |
| Subtareas (siguen el estado de la principal), ocultas por defecto | ✔ | `d_tasks.js` |
| Estados: Pendiente, En proceso, Completada (+ «Cancelada» solo del sistema) | ✔ (R7.6) | `r6States` |
| Prioridad: Baja, Normal, Alta, Urgente | ✔ | `r6Priorities` |
| Tipos: Tarea, Proyecto, Recurrente, Evento (+ Servicio, Producto de sistema) | ✔ | `r6TaskTypes` |
| Fechas con hora, atajos (Hoy, Mañana, fin de semana…), calendario | ✔ | `r73DPRender` |
| **Recurrencia** diaria/semanal/mensual/anual; crear nueva o reprogramar la misma | ✔ | `r73Recur` |
| Acciones masivas: reasignar, cambiar estado, eliminar | ✔ | `r6BulkBar` |
| Comentarios con respuestas, reacciones, adjuntos y dictado; bitácora por ODS | ✔ | `r6Comments` |
| Tarea relacionada, duplicar, baja recuperable | ✔ | `r6NewRelatedTask`, `r6DuplicateTask` |
| Panel de tarea con pestañas Detalles y Actividad | ✔ | `r6TaskPanel` |
| **Un solo responsable** por tarea (`owner`) | limitación | modelo de tarea |
| Seguidores / observadores | ✘ | — |
| Checklists dentro de la tarea | ✘ (los ítems de una ODS son la «lista de control» del evento) | — |
| Dependencias, campos personalizados, tiempo registrado, Gantt, plantillas de tarea | ✘ (no aparecen en una búsqueda por texto en el HTML; no se revisó cada capa) | — |
| Bandeja de avisos general | parcial: la campana 🔔 solo avisa de tareas **creadas por automatización** | `r74Bell` |

Modelo de una tarea: `id, title, type, owner, state, priority, list, start, end/due, startTime, endTime, createdBy, createdAt, parent, description, tags (texto), deleted` más campos de enlace (`orderId`, `appointmentId`, `sourceTask`, `recurrence`, `autoKey`, `r74auto`).

## 3. Qué tiene hoy el HTML en automatizaciones (R7.4)
| Aspecto | Hoy |
|---|---|
| Reglas | **3 fijas**: (a) consultar km (≤ 500 km **o** ≤ 7 días para el cambio de aceite), (b) confirmar cita (60 min antes), (c) posventa (5 días hábiles tras la salida, hasta el 7.º) |
| Qué se puede configurar | activar/desactivar cada una, sus números, **un** responsable y **una** lista de destino compartidos |
| Disparadores | solo **tiempo / estado calculado** (se revisan periódicamente). **Ninguno** reacciona a un evento puntual (p. ej. «se emitió una nota de venta») |
| Acción | siempre **crear una tarea** (título, descripción y etiqueta fijos en el código) |
| Evita duplicados | `autoKey` por regla y entidad (`km-<vehículo>-<km>`, `confirm-<cita>`, `post-<ODS>`) ✔ |
| Historial | tabla «Tareas creadas por automatización» (máx. 300) ✔ |
| Aviso | campana 🔔 y mensaje «Se han creado N tareas nuevas» ✔ |
| Prueba / demo | botón «Ejecutar ahora», hora simulada ✔ |
| Cuándo corre | **mientras el sistema está abierto** (temporizador; mínimo 20 s entre pasadas) y al pulsar «Ejecutar ahora». Sin servidor no corre en segundo plano |
| Panel de la tarea automática | caja con datos de la regla y botones (registrar km, abrir cita, encuesta) ✔ |

**Conclusión:** el patrón (clave de idempotencia, historial, aviso, hora simulada) es bueno y **se reutiliza**. Lo que falta es que las reglas sean **datos configurables**, no código.

## 4. Hallazgos técnicos que condicionan el diseño
1. **`save(action, detail)` es el cuello de botella útil.** Lo llaman ≈ 157 acciones distintas y escribe en `db.audit`. Permite un **gancho único**: después de cada `save`, evaluar reglas.
2. **Pero `detail` es texto.** Para «cuando una ODS se archive, crear una tarea con la placa y el cliente» hace falta saber **qué ODS**. Hay que añadir `emitir(tipo, datos)` en los puntos importantes. El proyecto ya trabaja por capas (`const base = fn; fn = function(){…}`), así que se puede envolver cada función **sin reescribirla** (capa nueva `r77`).
3. **Riesgo de bucles:** una regla que crea una tarea dispara el evento «tarea creada», que dispara otra regla. Hace falta una marca de origen y un límite de profundidad.
4. **Almacenamiento:** todo vive en `localStorage` (una clave, `rmotriz-modulos-r7-1-v1`), con tope de unos pocos MB por navegador. El historial de ejecuciones debe tener límite (hoy 300).
5. **Sin servidor:** las reglas por tiempo solo se evalúan con el sistema abierto. En la implementación real (pista S) necesitarán un planificador de servidor.
6. El módulo «Automatizaciones» ya existe en el menú (R7.4) y puede crecer sin cambiar la navegación.

## 5. Comparación con ClickUp: qué hacer y qué no
Veredicto: **SÍ** (implementar), **SIMPLIFICAR** (versión reducida), **DESPUÉS** (útil pero no ahora), **NO** (no aporta aquí). Esfuerzo relativo: S pequeño, M medio, L grande *(deducido)*.

### 5.1 Automatizaciones
| ClickUp | Veredicto | Cómo quedaría aquí | Esf. |
|---|---|---|---|
| Regla = disparador + condiciones + acciones, con resumen «Cuando… entonces…» | **SÍ** | Constructor visual simple; resumen en lenguaje natural | L |
| ≈ 30 disparadores | **SIMPLIFICAR** | ≈ 20 eventos de **tus módulos** (sección 6) + 4 de tiempo | L |
| 14 condiciones | **SIMPLIFICAR** | ≈ 8 (sección 7) | M |
| ≈ 30 acciones | **SIMPLIFICAR** | ≈ 7, **solo de tareas y avisos** (sección 7) | M |
| Varias acciones por regla | **SÍ** | Hasta 3 | S |
| Crear tarea con **plantilla y variables** | **SÍ** | `{placa}`, `{cliente}`, `{ods}`, `{cita}`, `{monto}`… | M |
| Ubicación de la regla (espacio/carpeta/lista) | **SIMPLIFICAR** | Cada regla elige **lista y responsable de destino**; el alcance es por **sede** y por **módulo** | S |
| Crear, editar, duplicar, activar/desactivar, eliminar | **SÍ** | Igual | S |
| Validar compatibilidad disparador–condición–acción y **modo de prueba** | **SÍ** | «Probar» muestra qué haría, sin escribir | M |
| Historial de ejecuciones con filtros | **SÍ** | Ya existe una tabla; añadir regla, estado y filtro | S |
| Atribución «ClickBot (regla vía lugar)» | **SÍ** | «Automatización: nombre de la regla» en la bitácora | S |
| Pestaña **Recurrentes** | **SÍ** | Lista de tareas periódicas y su próxima fecha (la recurrencia ya existe) | S |
| Explorar plantillas de reglas | **SÍ** | ≈ 10 plantillas listas (sección 8) | M |
| Pestañas Uso y límite de acciones | **NO** | Sin límite (el límite del plan gratuito fue el problema) | — |
| Webhooks, IA/agentes, integraciones (Slack, GitHub, Gmail…) | **NO** | Sin servidor ni contratos; fuera de alcance | — |
| Acciones que modifican datos de otros módulos | **NO** | Decisión de diseño: las reglas **no tocan ODS, citas, agenda ni dinero** | — |

### 5.2 Gestión de tareas
| ClickUp | Veredicto | Cómo quedaría aquí | Esf. |
|---|---|---|---|
| **Varios asignados** | **SÍ** | Responsable principal + acompañantes (en el uso real, **28 %** de las tareas tiene 2 o más) | M |
| **Seguidores** | **SÍ** | Reciben avisos; (en el uso real **50 %** tiene 2 o más) | M |
| **Bandeja de entrada** (asignada, mención, vence hoy, regla creó tarea) | **SÍ** | Ampliar la campana actual a una bandeja | M |
| **Plantillas de tarea** | **SÍ** | Base de la acción «crear tarea» y de las recurrentes | M |
| Recurrentes | **SÍ** (ya existe) | Añadir pestaña y plantillas | S |
| Acciones masivas | **SIMPLIFICAR** | Añadir prioridad, fecha y etiqueta a las 3 actuales | S |
| Crear tarea **desde un comentario** | **SÍ** | Botón en el comentario | S |
| Vista «Mi trabajo» (hoy, vencidas, asignadas) | **SÍ** | Vista guardada predefinida | S |
| Checklists en la tarea | **DESPUÉS** | En el uso real solo **9 de 416** | S |
| Dependencias, Gantt, línea de tiempo | **NO** | Sin uso real y fuera del dominio | — |
| Campos personalizados | **NO** | El único usado (Sede) está en **8 de 416**; la sede ya es un dato del sistema | — |
| Control de tiempo y estimaciones | **NO** | Las H-H están en la ODS y la agenda | — |
| Sprints, goals, dashboards, docs, pizarras, chat, correo | **NO** | No son de este módulo | — |
| Carga de trabajo | **DESPUÉS** | La agenda de técnicos ya cubre lo operativo; un resumen por persona se puede añadir | M |
| Prioridad Urgente automática por fecha límite | **CAMBIAR** | Reemplazar por «Vence hoy → **notificar**» (OPEN-28) | S |

## 6. Catálogo propuesto de eventos (qué suceso en qué módulo puede disparar una regla)
**Primera versión = ✔.** «Gancho» es la acción que hoy registra el HTML y se puede aprovechar. Los marcados *(nuevo)* requieren código de tiempo o cálculo.

| Módulo | Evento disparador | Gancho existente | 1.ª v. | Datos que debe llevar |
|---|---|---|:---:|---|
| **ODS** | ODS creada | `Nueva ODS` | ✔ | ODS, cliente, vehículo, sede, tipo |
| | Cambio de estado (de → a) | `r7SetOrderState` | ✔ | ODS, estado anterior y nuevo |
| | **ODS archivada** (con fecha de salida) | `r7SetOrderState` → Archivada | ✔ | ODS, cliente, vehículo, monto |
| | Decisión del cliente (Aprobada / No aprobada) | `Decisión del cliente` | ✔ | ODS, decisión |
| | Ítem agregado o retirado | `Ítems agregados`, `Ítem retirado` | ✔ | ODS, ítem, tipo |
| | Reapertura / corrección solicitada | `Reapertura`, `Corrección solicitada` | | ODS, motivo |
| | ODS sin responsable *(nuevo)* | cálculo | | ODS |
| **Citas** | Cita creada | `Cita creada` | ✔ | cita, cliente, vehículo, sede |
| | Estado de cita (confirmada / completada / cancelada / no asistió) | `Estado de cita` | ✔ | cita, estado |
| | Cita reprogramada | `Reserva reprogramada` | ✔ | cita, antes/después |
| | Falta N minutos para la cita *(tiempo)* | motor de R7.4 | ✔ | cita |
| **Cotizaciones** | Cotización creada / entregada / enviada a aprobación | `Cotización …` | ✔ | cotización, cliente |
| **Productos y logística** | Lista de productos enviada a logística | `Lista de productos enviada a logística` | ✔ | ODS, productos |
| | Compra registrada | `Compra registrada` | | compra, proveedor, monto |
| | Entrega registrada / conformidad del técnico | `Evidencia registrada`, `Conformidad registrada` | ✔ | ODS, producto |
| **Vehículos y línea temporal** | **Faltan N km o N días** para el cambio de aceite *(tiempo)* | motor de R7.4 | ✔ | vehículo, km, fecha |
| | Consulta de km registrada | `Consulta de kilometraje` | ✔ | vehículo, km |
| | Vehículo nuevo / editado | `Vehículo guardado` | | vehículo |
| **Posventa** | N días hábiles tras archivar la ODS *(tiempo)* | motor de R7.4 | ✔ | ODS |
| | Encuesta registrada | `Encuesta de satisfacción` | ✔ | ODS, recomendación 1–10 |
| | Intento de contacto | `Intento de contacto` | | tarea, resultado |
| **Caja y finanzas** | Apertura / cierre de caja | `Apertura de caja`, `Cierre de caja` | ✔ | caja, sede, diferencia |
| | Pago o abono registrado | `Pago registrado`, `Abono registrado` | | ODS, monto |
| | Nota de venta emitida / eliminada / anulada | `Nota de venta emitida`, `… eliminada`, `Nota anulada y caja revertida` | ✔ | nota, ODS, monto |
| | Transferencia registrada | `Transferencia registrada` | | cuentas, monto |
| **Agenda de técnicos** | Jornada cerrada / reabierta | `Jornada cerrada`, `Jornada reabierta` | ✔ | sede, fecha |
| | Bloque movido o dividido | `Evento movido en agenda`, `Actividad dividida` | | técnico, ODS |
| **Tareas** | Tarea creada / asignada / completada | `Tarea creada`, `Estado de tarea` | ✔ | tarea |
| | **Llega la fecha límite / vence hoy** *(tiempo)* | nuevo | ✔ | tarea |
| | Comentario agregado | `Comentario de tarea` | | tarea, autor |
| | Todas las subtareas completadas *(nuevo)* | cálculo | | tarea |
| **Usuarios** | Usuario desactivado | `Usuario desactivado` | ✔ | usuario |
| **Tiempo general** | «Cada…» (diario, semanal, mensual) *(nuevo)* | recurrencia existente | ✔ | — |

**Sin gancho verificado:** la **carga masiva** (importación) no apareció entre las acciones registradas; habría que comprobarlo antes de ofrecer «lote importado / con errores».

## 7. Condiciones y acciones propuestas
**Condiciones («Y si…»)** — hasta 3 por regla: sede · estado · prioridad · persona asignada · etiqueta · «el nombre contiene» · tipo de tarea · **un dato de la entidad que disparó** (monto mayor que, km menor que, decisión es…). Una regla sin condiciones se ejecuta siempre.

**Acciones («Entonces…»)** — hasta 3 por regla, **solo de tareas y avisos**:
1. **Crear tarea** (con plantilla y variables) en una **lista**, con **responsable**, **prioridad**, **fecha límite relativa** (hoy, +1 día hábil, +N días hábiles) y **etiquetas**.
2. Crear **subtareas** desde la plantilla.
3. **Actualizar la tarea** que disparó el evento o la creada: estado, prioridad, asignado, fecha límite, etiqueta.
4. **Comentar** en la bitácora de la ODS o de la tarea («Automatización: …»).
5. **Notificar** a una persona, a un rol o a una sede (bandeja).
6. **Reasignar** las tareas abiertas de una persona a su sucesora (para «usuario desactivado»).
7. Mover la tarea a otra lista.

**Regla de oro:** una regla **no modifica ODS, citas, agenda, inventario ni dinero**. Es coherente con R7.4 («nunca agenda citas»).

**Variables de plantilla:** `{placa}`, `{cliente}`, `{ods}`, `{cita}`, `{cotizacion}`, `{monto}`, `{diferencia}`, `{fecha}`, `{sede}`, `{responsable}`. Un dato inexistente se deja en blanco y **se avisa**, no se inventa.

## 8. Plantillas de reglas listas para activar
1. **Consultar km** (la actual de R7.4).
2. **Confirmar cita** (la actual).
3. **Posventa a los 5 días hábiles** (la actual).
4. **ODS archivada sin responsable → tarea de asignación.**
5. **Vence hoy → notificar** (en lugar de subir a Urgente) — *OPEN-28*.
6. **Usuario desactivado → reasignar sus tareas abiertas a su sucesora.**
7. **Cotización entregada sin decisión en N días → tarea de seguimiento para la cajera.**
8. **Cierre de caja con diferencia → tarea para el administrador** (revisar).
9. **Nota de venta emitida → tarea de auditoría ODS ↔ nota** (formato del reporte de corrección) — *OPEN-29: tolerancia*.
10. **Encuesta con recomendación ≤ 6 → tarea de contacto al cliente.**
11. **Producto sin conformidad del técnico en N horas → aviso a logística.**
12. **Cita «no asistió» → tarea de reprogramación.**

## 9. Decisiones que necesito de ti antes de construir
| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Las acciones se limitan a **tareas, comentarios y avisos** (sin tocar ODS, citas, agenda ni dinero)? | **Sí** |
| D2 | ¿Qué **módulos** entran en la 1.ª versión? | Los marcados ✔ en la sección 6: ODS, Citas, Cotizaciones, Logística, Vehículos/línea temporal, Posventa, Caja, Jornada, Tareas y Usuarios |
| D3 | ¿**Varios asignados y seguidores** en tareas? | **Sí**: responsable principal + acompañantes + seguidores |
| D4 | La regla «fecha límite → Urgente»: ¿se reemplaza por **notificar**? | **Sí** |
| D5 | ¿Vuelve **«Cancelada»** como estado que el usuario elige? | **No** (solo del sistema; ya es lo de R7.6) |
| D6 | ¿Quién crea reglas: **solo el administrador** o también la cajera y el jefe de taller? | Administrador y jefe de taller; la cajera solo activa/desactiva |
| D7 | ¿Las reglas que crean tareas pueden **volver a disparar otras reglas**? | **No** por defecto (evita bucles); opción avanzada con límite 1 |

## 10. Plan por fases (cada una se prueba antes de pasar a la siguiente)
| Fase | Qué se construye | Se verifica con | Entrega visible |
|---|---|---|---|
| **F0** | Cerrar D1–D7; congelar el catálogo de la 1.ª versión | Tu confirmación | Esta lista firmada |
| **F1 — Motor mínimo** | Reglas como datos; evaluador; 3 reglas actuales migradas como plantillas; historial con regla; modo «Probar»; protección contra bucles | **Regresión de R7.4** (mismas tareas que hoy) + pruebas nuevas | Pantalla de reglas y constructor |
| **F2 — Eventos de módulos** | Emisión de eventos con datos en los ≈ 20 puntos ✔ y variables de plantilla | Una prueba por evento: «ocurre X → se crea la tarea Y» | Reglas funcionando con ODS, citas, caja, logística… |
| **F3 — Mejoras de tareas** | Varios asignados y seguidores; bandeja de avisos; plantillas de tarea; pestaña Recurrentes; «Mi trabajo»; comentario→tarea; masivas ampliadas | Pruebas de regresión del espacio de trabajo (R7.6) + nuevas | Espacio de trabajo y bandeja ampliados |
| **F4 — Mockups y capturas** | Datos sintéticos para mostrar cada pantalla; capturas del HTML para la tesis y el profesor | Revisión visual **tuya** | Carpeta de capturas con su descripción |

**Mockups previstos (pantallas):** lista de reglas · constructor «Cuando / Y si / Entonces» · selector de evento por módulo · plantillas de tarea · historial de ejecuciones · pestaña Recurrentes · bandeja de avisos · tarea con asignados y seguidores · «Mi trabajo». Las capturas se pueden sacar con Python + Playwright (instalados) sobre el HTML generado; *no verificado todavía que el Chromium instalado coincida con la versión del paquete.*

**Cómo se construye:** capa nueva **prototipo/capas/r77/** y **aplicar_r77.py** (a crear), como R7.2–R7.6; pruebas nuevas `e2e77.mjs` **y regresión completa**; `CAMBIOS_R7.7.md`. Se actualiza `specs/R7.7-motor-automatizaciones.md` cuando confirmes las decisiones.

## 11. Esquema de la pantalla central (para validar la idea antes del mockup)
```
Automatizaciones                      [+ Nueva regla]  [Plantillas]  [▶ Probar]
-----------------------------------------------------------------------------
 ● ACTIVA   ODS archivada → tarea de posventa a los 5 días hábiles
            Cuando [ODS archivada]  Y si [sede = Unión]
            Entonces [Crear tarea «Posventa · {cliente} ({ods})»  → lista Posventa
                      responsable: Cajera de la sede · vence: +5 días hábiles]
            Última ejecución: hoy 09:12 · 14 tareas creadas        [Editar][Copiar][⏻]
 ○ INACTIVA Cierre de caja con diferencia → tarea al administrador   ...
-----------------------------------------------------------------------------
 Historial: Fecha · Regla · Evento · Tarea creada · Estado · [Abrir tarea]
```

## 12. Riesgos y lo que no se verificó
- **No se ejecutó el prototipo**: las afirmaciones sobre su comportamiento vienen de leer el código y los documentos.
- Las cifras de **uso real de ClickUp** son agregados de una exportación del 17/10/2026; recurrentes, dependencias y tiempo salieron en 0 por límite de la API (no son ceros reales).
- Estimaciones de esfuerzo *(deducidas)*; no hay calendario (OPEN-11).
- El **límite de `localStorage`** puede afectar al historial y a muchas tareas generadas.
- Reglas por tiempo solo corren **con el sistema abierto**; en un sistema real requieren servidor (INC-06).
- El motor **no es un requisito comprometido de la tesis**: es demostración (pista P).
- Hay que confirmar que todos los ✔ de la sección 6 se pueden enganchar sin romper las pruebas existentes (se verifica en F2).
