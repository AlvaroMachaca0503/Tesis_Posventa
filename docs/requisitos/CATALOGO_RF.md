# Catálogo de requisitos RF-01 a RF-117 con incremento propuesto

Generado el 2026-10-19 por `herramientas/generar_requisitos.mjs` desde `../fuentes-latex/trazabilidad_R76.csv` (matriz R7.6). **No editar a mano:** vuelve a ejecutar el script.

## Cómo leerlo
- **Alcance (fuente):** lo que dicen los documentos del contexto (`docs/contexto/13_CATALOGO_RF_01_84.md` y la matriz). Para RF-85 a RF-117 las fuentes **no** los clasifican (se añadieron en R7.1–R7.6).
- **Incremento propuesto:** asignación **del asistente**, derivada de `docs/contexto/06_ALCANCE_TOTAL_VS_TESIS.md`. **No es una decisión del investigador.** Confianza *alta* = el documento nombra la función en ese bloque; *media* = deducido por afinidad; *baja* = ambiguo (queda PENDIENTE).
- **Estado en el prototipo:** lo que dice la matriz sobre R7.6. "Demostración local" **no** es "implementado": el prototipo no tiene servidor ni autenticación real.

## Resumen por incremento propuesto

| Incremento | Descripción | RF | Con prueba automatizada en el prototipo | Prueba PR pendiente |
|---|---|---:|---:|---:|
| INC-01 | Base operativa (usuarios, sedes, clientes, vehículos, ODS, bitácora, auditoría, maestros) | 26 | 6 | 7 |
| INC-02 | Importación XLSX/CSV (idempotente, atómica, conciliación) | 7 | 0 | 7 |
| INC-03 | Servicios, tareas y agenda de técnicos | 16 | 2 | 2 |
| INC-04 | Plan preventivo, aplicabilidad y línea temporal | 17 | 8 | 6 |
| INC-05 | Reajuste del futuro con evidencia de ODS | 1 | 0 | 1 |
| INC-06 | Posventa: seguimiento, contacto, citas, llegada y retorno | 17 | 6 | 4 |
| INC-07 | Productos y logística (extensión opcional) | 12 | 1 | 0 |
| EVOLUCION | Evolución empresarial (visión futura, no comprometida) | 16 | 5 | 0 |
| TRANSVERSAL | Transversales de interfaz | 2 | 2 | 0 |
| PENDIENTE | Sin asignar: requiere decisión del investigador | 3 | 3 | 0 |

## INC-01 — Base operativa (usuarios, sedes, clientes, vehículos, ODS, bitácora, auditoría, maestros)

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-01 | Autenticar usuarios. Denegar acceso a operaciones sin sesión válida. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-02 | Registrar clientes. La baja es recuperable; conserva vehículos, ODS e historial. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-03 | Registrar vehículos. Separar placa, VIN, serie, código de motor, aceite y viscosidad; conservar faltantes sin inventarlos. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-04 | Consultar por placa. Consultar primero la base local; una API futura no es requisito para operar. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-05 | Crear órdenes de servicio. Crear una ODS nueva con cliente, vehículo, fecha de ingreso y responsable. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-06 | Editar detalle plano de ODS. Cada servicio tiene un técnico responsable. H-H no multiplica el precio final; el apoyo queda como nota. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-07 | Gestionar estados e historial. Recepción → En proceso → Entrega → Archivada (R7.1); filtrar historial por vehículo en Archivada. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-08 | Emitir vista y PDF de ODS. La vista cliente excluye costos y márgenes; la vista interna exige permiso. | Núcleo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-21 | Auditar operaciones sensibles. Registrar actor, hora del servidor, motivo y valores antes/después; operar inicialmente una sede. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-23 | Administrar roles y permisos. Distinguir cajera, técnico, jefe y administrador; proteger costos, correcciones y reservas. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-28 | Corregir manualmente ODS cerradas. Permitir edición y eliminación explícita autorizada sin desarchivar; auditar y no alterar automáticamente la fecha de salida. | Núcleo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-29 | Reabrir y recerrar ODS. Elegir conservar salida anterior para corrección o registrar nueva salida al recierre; conservar historial y evitar eventos repetidos. | Núcleo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-31 | Exportar información a Excel. Exportar clientes, vehículos, órdenes, detalle y planes con IDs estables para futuras correcciones. | Núcleo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-49 | Mantener catálogo plano. Catálogo plano y compras por ODS; sin stock, almacén ni kardex en el alcance actual. | Núcleo | media | Demostración local verificada (HTML) |
| RF-62 | Bitácora única por ODS compartida y etiquetada. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-63 | Decisión del cliente a nivel de ODS. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-64 | Reaprobación automática solo por ítems nuevos. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-65 | Retiro de ítems con histórico de valores. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-70 | Autorizar corrección administrativa de ODS archivada. | Núcleo | media | Demostración local verificada (HTML) |
| RF-71 | Ocultar precios y costos en vista técnica. | Núcleo | media | Demostración local verificada (HTML) |
| RF-88 | Editar el detalle de la ODS en línea. Tipo, ítem con buscador por código o nombre, cantidad/H-H, costo (solo logística y administrador), precio, descuento, total, rentabilidad y responsable. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e72.mjs (37/37) PASÓ; demostración local |
| RF-89 | Crear ODS Express o Avanzada. La avanzada registra el estado del vehículo (objetos, combustible, fluidos, daños); fecha y hora de ingreso editables; puede cargar una cotización. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e72.mjs (37/37) PASÓ; demostración local |
| RF-103 | Validar tipo de documento. DNI (8 dígitos), RUC (11), carné de extranjería, pasaporte u otro en clientes y proveedores. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-107 | Clasificar por categorías. Categoría y sistema del vehículo para productos y servicios; la cotización sugiere servicios de la misma categoría. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-110 | Registrar usuarios con roles. Apellidos, nombres, sede, celular, email, roles con casillas y estado activo. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-111 | Mantener marcas y modelos. Marcas de vehículo con modelos; marcas de producto (los servicios no llevan marca). | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |

## INC-02 — Importación XLSX/CSV (idempotente, atómica, conciliación)

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-09 | Reconocer perfiles XLSX. Priorizar Tuulapp; el segundo ERP requiere muestras. Usar encabezados y alias versionados, sin adivinar columnas ambiguas. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-10 | Importar de forma atómica e idempotente. Una ODS identificada se reemplaza completa y atómicamente; cualquier error cancela el lote. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-11 | Normalizar servicios con evidencia. Conservar descripción original; una equivalencia ambigua requiere confirmación antes de afectar el plan. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-25 | Elegir modo de carga. Solo crear omite IDs existentes; actualizar modifica coincidencias y crea IDs nuevos, sin cambiar identidades. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-26 | Mostrar resumen de carga. Mostrar cantidades por entidad e ítems por ODS y errores; no mostrar previsualización de diferencias. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-27 | Corregir cerradas mediante importación. No cambiar fecha de salida ni borrar ítems omitidos; rechazar reducción de detalle o correspondencia ambigua. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-30 | Importar documentos y pagos históricos. Conservar tipo y referencia originales; no convertir una factura histórica en nota ni inventar pagos. | Opcional | media | Prueba PR pendiente (según la matriz R7.6) |

## INC-03 — Servicios, tareas y agenda de técnicos

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-35 | Ofrecer lista, tablero y calendario. Lista, tablero (3 columnas) y calendario muestran las mismas tareas con estado (Pendiente, En proceso, Completada), responsable y vencimiento. | Núcleo | media | Demostración local verificada (HTML) |
| RF-42 | Configurar jornada y excepciones. Definir horario, descansos y excepciones por fecha; ventana visual de 06:00 a 23:00 no equivale a jornada laboral. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-43 | Distribuir un servicio en varios bloques. El técnico puede registrar trabajo exprés; la cajera debe validarlo y crear la ODS para que cuente. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-44 | Impedir tercera superposición. Máximo dos servicios simultáneos por técnico, incluso dentro de la misma ODS. | Núcleo (regla por confirmar) | media | Demostración local verificada (HTML) |
| RF-45 | Registrar ampliaciones de trabajo. El cambio horario respeta descanso, audita antes/después y conserva el precio final. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-46 | Corregir ejecución histórica. Solo jefe corrige tiempos reales de fechas anteriores con auditoría; no confundir con reprogramación de reservas. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-47 | Reportar horas y disponibilidad. Separar horas presupuestadas, revisadas, reales y ocupación sin doble conteo; tiempo libre no prueba inactividad. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-48 | Heredar responsable por servicio. Asignar responsable de ODS a servicios sin asignación explícita; respetar técnicos editados manualmente. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-60 | Facilitar uso en tablet. Usar botones y notas breves compatibles con dictado del teclado; no incluir reconocimiento de voz propio. | Núcleo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-61 | Una tarea raíz por ODS y dos contenedores: Servicios y Productos. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-66 | Distribución de H-H en incrementos de 0.25. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-67 | Dividir, postergar, extender o reasignar segmentos de agenda. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-68 | Cerrar jornada por sede y fecha. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-69 | Calcular huecos reales por técnico. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-101 | Organizar el espacio de trabajo. Favoritos, fechas con hora, repetición tipo ClickUp, subtareas ocultables; el botón de menú pliega solo áreas y listas. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e76.mjs (30/30) PASÓ; demostración local |
| RF-108 | Cambiar estado y tipo de tarea. Estados Pendiente, En proceso y Completada; tipos Tarea, Proyecto, Recurrente y Evento; se guarda la fecha de cierre. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e76.mjs (30/30) PASÓ; demostración local |

## INC-04 — Plan preventivo, aplicabilidad y línea temporal

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-12 | Importar planes preventivos. Definir hojas planes, compatibilidades, opciones, reglas, evidencia y cambios; conservar fuentes y versiones. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-13 | Evaluar aplicabilidad. Separar reglas del plan de compatibilidad por vehículo y perfil particular/severo. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-14 | Asignar plan explícitamente. Parámetro operativo R6: aceite no especificado, mineral o semisintético 5000 km; sintético o full sintético 7500 km. Validación mecánica formal pendiente. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-15 | Consultar línea temporal independiente. Mezcla proyección por km/mes e historial real; usa 42 ODS, 110 líneas y 14 lecturas de km del vehículo de demostración. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-17 | Editar planes compartidos con versión. Una nueva versión afecta las proyecciones futuras de los vehículos asignados; no reescribe servicios realizados. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-22 | Proponer planes con soporte computacional. Generar propuestas compatibles y trazables para revisión experta; abstenerse cuando falte evidencia. | Núcleo de investigación (alcance de IA por cerrar) | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-32 | Evaluar el modelo de propuestas. Separar entrenamiento/evaluación por familias compatibles, comparar una línea base y reportar cobertura y abstenciones, sin resultados ficticios. | Núcleo solo si hay modelo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-33 | Validar propuestas con experto. Registrar evidencia, versión, observaciones y decisión del experto antes de activar reglas generadas. | Núcleo | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-34 | Descargar línea temporal en PDF. Entregar al cliente reglas, próximos hitos, fecha de emisión y distinción entre estimación y servicio realizado. | Núcleo | media | Demostración local verificada (HTML) |
| RF-85 | Proyectar vencimientos por ciclo. Solo el primer pendiente puede quedar vencido, por km o por tiempo (lo que ocurra primero); los siguientes son condicionales; sin evidencia queda «Revisión sugerida». | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e_regresion72.mjs (12/12) PASÓ; demostración local |
| RF-86 | Reconocer evidencia de mantenimiento. Inspección no equivale a sustitución; el aceite de motor no acredita aceite de caja; una ODS «No aprobada» no es evidencia. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e_regresion72.mjs (12/12) PASÓ; demostración local |
| RF-87 | Aislar lecturas de km inconsistentes. Una lectura que rompe la serie se excluye de la proyección y se avisa, sin modificar la ODS. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e_regresion72.mjs (12/12) PASÓ; demostración local |
| RF-92 | Calcular la tasa km/mes. La tasa usa las últimas 5 visitas con km; las ODS sin km se ubican por fecha (etiqueta «sin km»). | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e72.mjs (37/37) PASÓ; demostración local |
| RF-99 | Mostrar la línea temporal por ciclo de aceite. Columnas por cambio de aceite; vistas Comprimida y Detalle; reglas editables de reinicio (p. ej. reparación de motor). | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e73_sobre_r74.mjs (52/52) PASÓ; demostración local |
| RF-100 | Preparar recordatorio y cotización desde la línea temporal. Mensaje de WhatsApp agrupado por km con precio de catálogo (envío manual) y «Agregar a cotización». | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e73_sobre_r74.mjs (52/52) PASÓ; demostración local |
| RF-112 | Asignar grupos de vehículos. G1…G8 con reglas (marca, modelo, años, motor), planes y lista de precios con excepciones; asignación automática al crear o editar el vehículo. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-117 | Mostrar la línea temporal compacta. Botones pequeños arriba; resumen de km contraído al entrar (≤ 3 filas); al expandir, filas delgadas sin listar las ODS de la tasa. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e76.mjs (30/30) PASÓ; demostración local |

## INC-05 — Reajuste del futuro con evidencia de ODS

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-16 | Reajustar solamente el futuro. Exigir servicio confirmado y referencia a ODS/detalle; conservar la proyección histórica y la versión de regla. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |

## INC-06 — Posventa: seguimiento, contacto, citas, llegada y retorno

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-18 | Generar seguimiento automático. Crear seguimiento a cinco días laborables y avisos preventivos según regla; no duplicar al recerrar. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-19 | Facilitar contacto por WhatsApp. Abrir mensaje precargado y registrar el clic como intento; envío y respuesta requieren resultado declarado. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-20 | Gestionar citas. Permitir confirmar, atender, cancelar y reprogramar; conservar vínculo con tarea de origen. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-24 | Reasignar seguimiento de cajeras. Ante retiro, transferir pendientes a sucesora activa configurada en la sede; ausencia sin reemplazo requiere atención. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-36 | Gestionar intentos y subtareas. Tipos Tarea, Proyecto, Cita y Orden de servicio; subtareas visibles, tareas relacionadas y recurrencia al completar. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-37 | Configurar metas de cajeras. Editar metas mensuales de contactos, citas y retornos; el cálculo monetario de bonos queda fuera. | Opcional | media | Prueba PR pendiente (según la matriz R7.6) |
| RF-38 | Reportar conversión de posventa. Implementado en el reporte de posventa: citas agendadas, llegaron y convertidas en ODS por mes y por usuario. | Núcleo | alta | Prueba PR pendiente (según la matriz R7.6) |
| RF-39 | Asignar servicios y técnicos en citas. La cita computa en metas solo si cumple anticipación configurable; la confirmación genera tarea. | Núcleo | media | Demostración local verificada (HTML) |
| RF-40 | Convertir llegada en ODS. Crear una sola ODS en recepción con datos y asignaciones de la cita; enlazar reservas existentes sin duplicarlas. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-41 | Reprogramar reservas con notificación. Solo cajera o jefe mueve reservas; generar tarea de aviso y nueva confirmación del cliente. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-59 | Acreditar retorno de posventa. Contar cita atendida vinculada a ODS cerrada con servicio real, incluso revisión gratuita; no basta crear una ODS. | Núcleo | alta | Demostración local verificada (HTML) |
| RF-90 | Gestionar citas con cotización propia. Estados Pendiente, Confirmada, Completada, Cancelada, No asistió; al completar se ofrece crear la ODS con la cotización y los adelantos. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e73_sobre_r74.mjs (52/52) PASÓ; demostración local |
| RF-104 | Generar tareas automáticas de posventa. Consultar km si faltan ≤ 500 km o ≤ 7 días; confirmar cita 1 h antes; llamada y encuesta a 5 días hábiles de la salida (hasta el 7.º); aviso a la cajera. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-105 | Registrar consultas de kilometraje. Medio Llamada, WhatsApp u Otro (con texto), sin observación; recalcula la proyección y completa la tarea; la «última consulta» es la lectura más reciente por fecha y hora de cualquier  | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
| RF-106 | Gestionar la encuesta de satisfacción. Siete preguntas; varias respuestas por ODS; diálogo «¡Finalizar!» al archivar y «Opciones» en la ODS archivada; WhatsApp o SMS solo copian el texto y registran el envío. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
| RF-115 | Registrar km informado en cita y cotización. El km informado alimenta la «última consulta de km» con su fecha y hora. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
| RF-116 | Reportar posventa por mes. Tareas completadas por cajera, citas agendadas, citas que llegaron, citas convertidas en ODS (indicador principal) y tasa de conversión; detalle por usuario; CSV; datos sintéticos con cantidade | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e76.mjs (30/30) PASÓ; demostración local |

## INC-07 — Productos y logística (extensión opcional)

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-50 | Registrar compras para ODS. Capturar proveedor, comprobante y ODS; no crear almacenes ni movimientos de inventario. | Extensión | alta | Demostración local verificada (HTML) |
| RF-51 | Trasladar líneas de compra a ODS. Relacionar cada producto comprado con su costo y detalle ODS una sola vez; permitir fijar precio de venta. | Extensión | alta | Demostración local verificada (HTML) |
| RF-52 | Calcular recargo y margen. Aceptar precio manual o porcentaje; diferenciar recargo sobre costo de margen sobre venta y recalcular ambos. | Extensión | alta | Demostración local verificada (HTML) |
| RF-72 | Cotizar solo productos ODS activos sin cotización. | Evolución | alta | Demostración local verificada (HTML) |
| RF-73 | Registrar alternativas de cotización por producto. | Evolución | alta | Demostración local verificada (HTML) |
| RF-74 | Versionar cotización entregada. | Evolución | alta | Demostración local verificada (HTML) |
| RF-75 | Registrar comprobantes de compra inmutables. | Evolución | alta | Demostración local verificada (HTML) |
| RF-76 | Vincular línea comprada a producto ODS o crear uno. | Evolución | alta | Demostración local verificada (HTML) |
| RF-77 | Registrar ajustes de compra. | Evolución | alta | Demostración local verificada (HTML) |
| RF-78 | Evidencia de Compra y Entrega individual o masiva. | Evolución | alta | Demostración local verificada (HTML) |
| RF-79 | Conformidad técnica individual o masiva. | Evolución | alta | Demostración local verificada (HTML) |
| RF-91 | Crear tareas de logística. Asignar productos crea «Cotizar productos»; la aprobación de caja crea «Comprar productos aprobados» con fotos de evidencia con hora de captura. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e72.mjs (37/37) PASÓ; demostración local |

## EVOLUCION — Evolución empresarial (visión futura, no comprometida)

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-53 | Emitir nota de venta interna. La nota de venta es interna e inmutable; su anulación revierte pago y caja. | Evolución | alta | Demostración local verificada (HTML) |
| RF-54 | Registrar pagos y saldos. Aceptar efectivo, Yape, Plin y transferencia; separar estado de cobro, emisión documental y estado ODS. | Evolución | alta | Demostración local verificada (HTML) |
| RF-55 | Abrir y cerrar caja simple. Cada caja se asigna a usuario y sede; la demostración opera con una sede. | Evolución | alta | Demostración local verificada (HTML) |
| RF-56 | Registrar ingresos y egresos. Vincular pago o compra; impedir registro duplicado y corregir mediante reversión auditable. | Evolución | alta | Demostración local verificada (HTML) |
| RF-57 | Consultar cuentas por cobrar. Calcular saldo por documento y pagos válidos, incluyendo pagos parciales. | Evolución | alta | Demostración local verificada (HTML) |
| RF-58 | Reportar producción por técnico. Atribuir venta neta y comisión al técnico del servicio; excluir productos e impuestos y distribuir descuentos generales. | Evolución | alta | Demostración local verificada (HTML) |
| RF-80 | Registrar adelantos antes de nota de venta. | Evolución | alta | Demostración local verificada (HTML) |
| RF-81 | Emitir nota interna en cualquier etapa. | Evolución | alta | Demostración local verificada (HTML) |
| RF-82 | Operar caja por sede y caja administrativa sin sede. | Evolución | alta | Demostración local verificada (HTML) |
| RF-83 | Restringir saldos bancarios por rol. | Evolución | alta | Demostración local verificada (HTML) |
| RF-84 | Transferir entre cuentas con comprobante de recepción. | Evolución | alta | Demostración local verificada (HTML) |
| RF-95 | Emitir nota de venta con serie. Serie y correlativo por caja, contado o crédito; copia la cotización; se imprime; la ODS queda «Facturado»; documento interno, no SUNAT. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-96 | Registrar comprobantes de compra. Factura, boleta o nota de compra con proveedor (nuevo desde el formulario), ítems, contado o crédito; edición y eliminación revierten pagos. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |
| RF-97 | Consultar cuentas por cobrar y por pagar. Dos módulos separados; vista por comprobante o por cliente/proveedor; pagos y estado de cuenta en CSV. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
| RF-98 | Registrar movimientos de bancos. Movimientos con ingreso/egreso, búsqueda, CSV y recibo de caja con monto en letras; visibilidad por rol. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e73_sobre_r74.mjs (52/52) PASÓ; demostración local |
| RF-109 | Mantener series y cajas. Series por tipo con número actual; cajas con sede, cuenta, usuarios y series (lista doble). | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e74_sobre_r76.mjs (73/73) PASÓ; demostración local |

## TRANSVERSAL — Transversales de interfaz

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-102 | Operar tablas uniformes. Nro., Acciones, orden por columna, filtro con dos condiciones (Y/O); columnas angostas y redimensionables guardadas por usuario. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
| RF-113 | Navegar por secciones plegables. Secciones contraídas al abrir; Métricas, Espacio de trabajo y Línea temporal sueltos; etiqueta «tesis»; versión en Configuración. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | media | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |

## PENDIENTE — Sin asignar: requiere decisión del investigador

| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |
|---|---|---|---|---|
| RF-93 | Emitir reportes operativos. Ventas generales, ventas por ítems, operaciones, rentabilidades (22 columnas) y técnicos, con filtros y CSV. **Nota:** Reportes operativos: ¿núcleo o evolución? Depende del corte comercial (decisión abierta). | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | baja | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
| RF-94 | Gestionar cotizaciones. Estados sin asignar, en cita o en ODS; una sola lista de ítems compartida con la ODS; descuento global; pasar a cita o a ODS; eliminar si no está en una ODS. **Nota:** Cotizaciones generales: R7.3 las ubica en el núcleo; falta decidir si van en INC-01 o INC-06. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | baja | Prueba automatizada e2e73_sobre_r74.mjs (52/52) PASÓ; demostración local |
| RF-114 | Consultar métricas mensuales. Principal, General, Ventas y Satisfacción con las fórmulas de Tuulapp; rango de meses; valor sobre cada barra; descarga SVG, PNG y CSV; parámetros operativos. **Nota:** Métricas mensuales (fórmulas Tuulapp): ¿núcleo o evolución? Depende del corte de evaluación. | Sin clasificar en las fuentes (añadido en R7.1–R7.6) | baja | Prueba automatizada e2e75.mjs (55/55) PASÓ; demostración local |
