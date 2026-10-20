# Mapeo completo del prototipo R7.7: módulos, submódulos y requisitos (delimitado el 19/10/2026)

Generado por `herramientas/generar_mapeo_r77.py` (no editar a mano: edita el script y vuelve a ejecutarlo). Versión: R7.7, 19/10/2026. La delimitación completa, con reglas y excepciones, está en `docs/alcance/DELIMITACION_PRIMERA_VERSION_R77.md`.

**Qué es esto.** El catálogo vigente (`CATALOGO_RF.md`) llega a RF-117 (R7.6). Aquí se agrega lo que R7.7 construyó después (RF-118 en adelante) y se clasifica todo según la **delimitación que decidió el investigador el 19/10/2026**: lo que no es beta es la **primera versión**, lo beta se muestra al final del menú y no se implementa, y lo quitado ya no está. La numeración RF-118 en adelante sigue siendo provisional.

## 1. Cifras

| | Requisitos |
|---|---:|
| Catálogo R7.6 (RF-01 a RF-117) | 117 |
| Agregados por R7.7 (RF-118 a RF-215) | 98 |
| **Total mapeado** | **215** |

### Delimitación decidida

| Nivel | R7.6 | R7.7 nuevos | Total |
|---|---:|---:|---:|
| Primera versión (se implementa y se defiende) | 114 | 84 | **198** |
| Beta (visible, ocultable, no se implementa) | 3 | 11 | **14** |
| Quitado | 0 | 3 | **3** |
| Total | 117 | 98 | 215 |

- **Primera versión: 198 de 215 (92 %).** Es lo que se implementa en el sistema real y se defiende con pruebas.
- **Beta: 14.** Visibles al final del menú con la etiqueta «beta»; se pueden ocultar todos desde Configuración. No se implementan.
- **Quitado: 3.** Ya no están en el menú (reglas de precios, auditoría interna y movimientos de cuentas).

## 2. Módulos y submódulos del menú (R7.7 delimitado)

«Etiqueta hoy» es la que muestra el menú. «Nivel» es el de la delimitación.

| Módulo › submódulo | Etiqueta hoy | Nivel |
|---|---|---|
| Órdenes de servicio | tesis | Primera versión |
| Métricas | — | Primera versión |
| Espacio de trabajo | tesis | Primera versión |
| Línea temporal | tesis | Primera versión |
| Maestros › Clientes | tesis | Primera versión |
| Maestros › Proveedores | — | Primera versión |
| Maestros › Vehículos | tesis | Primera versión |
| Maestros › Grupos de vehículos | tesis | Primera versión |
| Maestros › Planes preventivos | tesis | Primera versión |
| Maestros › Solapamientos de servicios | tesis | Primera versión |
| Maestros › Marcas de vehículo | tesis | Primera versión |
| Maestros › Series de comprobantes (por sede) | tesis | Primera versión |
| Inventario › Productos y servicios | tesis | Primera versión |
| Inventario › Almacenes (locales) | — | Primera versión |
| Inventario › Movimientos y requerimientos | — | Primera versión |
| Inventario › Kárdex de productos | — | Primera versión |
| Inventario › Marcas de producto | tesis | Primera versión |
| Inventario › Categorías | tesis | Primera versión |
| Ingresos › Cotizaciones | tesis | Primera versión |
| Ingresos › Emitir comprobante (nota de venta) | — | Primera versión |
| Ingresos › Cuentas por cobrar | — | Primera versión |
| Egresos › Compras y comprobantes | — | Primera versión |
| Egresos › Cuentas por pagar | — | Primera versión |
| Seguimiento › Citas | tesis | Primera versión |
| Seguimiento › Bitácora | tesis | Primera versión |
| Finanzas › Bancos | — | Primera versión |
| Reportes › Posventa | tesis | Primera versión |
| Reportes › Ventas generales | — | Primera versión |
| Reportes › Ventas por ítems | — | Primera versión |
| Reportes › Operaciones | — | Primera versión |
| Reportes › Rentabilidades | — | Primera versión |
| Reportes › IGV y detracciones | — | Primera versión |
| Reportes › Técnicos | — | Primera versión |
| Reportes › Garantías | tesis | Primera versión |
| Configuración › Automatizaciones | tesis | Primera versión |
| Configuración › Usuarios | — | Primera versión |
| Configuración › Configuración (estados de tarea, inventario, impuestos y APIs) | — | Primera versión |
| Configuración › Carga masiva (incluye órdenes de servicio) | — | Primera versión |
| Lista CRM (dentro del Espacio de trabajo) | — | Primera versión |
| Beta › Cajas (apertura y cierre) | beta | Beta |
| Beta › Paquetes de servicios y productos | beta | Beta |
| Beta › Ingreso (sin comprobante) | beta | Beta |
| Beta › Egreso (sin comprobante) | beta | Beta |
| Beta › Flujo de caja | beta | Beta |
| Beta › Comparativo (estado de resultados) | beta | Beta |
| Beta › Integraciones | beta | Beta |
| Beta › Asistente Gemini | beta | Beta |
| Beta › API de integración | beta | Beta |
| Quitado › Reglas de precios | — | Quitado |
| Quitado › Auditoría interna | — | Quitado |
| Quitado › Movimientos de cuentas | — | Quitado |

Entradas: **51**. Primera versión: 39 · beta: 9 · quitadas: 3.

## 3. Catálogo R7.6 (RF-01 a RF-117) por incremento

| Incremento | RF | Primera versión | Beta |
|---|---:|---:|---:|
| INC-01 | 26 | 26 | 0 |
| INC-02 | 7 | 7 | 0 |
| INC-04 | 17 | 17 | 0 |
| INC-05 | 1 | 1 | 0 |
| INC-06 | 17 | 17 | 0 |
| INC-03 | 16 | 16 | 0 |
| INC-07 | 12 | 12 | 0 |
| EVOLUCION | 16 | 13 | 3 |
| PENDIENTE | 3 | 3 | 0 |
| TRANSVERSAL | 2 | 2 | 0 |

Criterio: todo lo de R7.6 es primera versión salvo la comisión por técnico (RF-58) y la apertura y cierre de caja (RF-55, RF-82), que pasan a beta. Los PENDIENTE de R7.6 (RF-93 reportes, RF-94 cotizaciones, RF-114 métricas) quedan en la primera versión.

## 4. Requisitos nuevos de R7.7 (RF-118 en adelante)

| Módulo | Primera versión | Beta | Quitado | Total |
|---|---:|---:|---:|---:|
| Automatizaciones | 14 | 0 | 0 | 14 |
| Espacio de trabajo | 8 | 1 | 0 | 9 |
| Órdenes de servicio | 13 | 0 | 0 | 13 |
| Ventas y caja | 8 | 2 | 0 | 10 |
| Impuestos | 5 | 0 | 0 | 5 |
| Inventario | 12 | 0 | 0 | 12 |
| CRM de posventa | 5 | 1 | 0 | 6 |
| Interfaz | 4 | 0 | 0 | 4 |
| Beta | 0 | 4 | 0 | 4 |
| Bancos | 3 | 0 | 0 | 3 |
| Reportes | 2 | 0 | 0 | 2 |
| Métricas | 2 | 0 | 0 | 2 |
| Configuración | 8 | 0 | 0 | 8 |
| Maestros | 0 | 1 | 0 | 1 |
| Finanzas | 0 | 1 | 0 | 1 |
| Integración | 0 | 1 | 0 | 1 |
| Quitado | 0 | 0 | 3 | 3 |

| RF | Módulo | Requisito | Bloque propuesto | Nivel | Nota |
|---|---|---|---|---|---|
| RF-118 | Automatizaciones | Motor «Cuando / Y si / Entonces» editable por el usuario (desencadenante, condiciones y acciones, con nombre, descripción y activación). | T5 posventa | C |  |
| RF-119 | Automatizaciones | Desencadenantes por suceso (ODS, cita, vehículo, tarea, producto, pago, nota, inventario, CRM) y por tiempo (km, cita, salida de la ODS, fecha límite, atraso, sin respuesta). | T5 posventa | C | 31 desencadenantes en R7.7 |
| RF-120 | Automatizaciones | Condiciones combinables: sede, celular, deuda, plan preventivo, sin técnico, recomendación, prioridad, etiqueta, tipo de tarea y dato de un módulo. | T5 posventa | C |  |
| RF-121 | Automatizaciones | Acciones reales: crear tarea, etiquetar la ODS, avisar, comentar en la bitácora, reasignar, cambiar prioridad, estado o lista, cerrar contacto CRM. | T5 posventa | C |  |
| RF-122 | Automatizaciones | Reglas de sistema editables, apagables y eliminables (confirmar cita, consultar km, posventa) con los mismos resultados que antes. | T5 posventa | C | Regresión de R7.4 |
| RF-123 | Automatizaciones | Variables en los textos ({cliente.nombre}, {vehiculo.placa}, {ods.codigo}, {producto}, {monto}…) por módulo. | T5 posventa | C |  |
| RF-124 | Automatizaciones | Plazos con unidad (minutos a años) y modo hábil o consecutivo según el horario de atención. | T5 posventa | C |  |
| RF-125 | Automatizaciones | Historial de ejecuciones, uso del mes y protección contra bucles (límite de acciones por pasada). | T5 posventa | C |  |
| RF-126 | Automatizaciones | Biblioteca de plantillas por categoría con filtro lateral (46 plantillas). | T5 posventa | C |  |
| RF-127 | Automatizaciones | Hora simulada global para probar reglas de tiempo sin esperar. | Transversal | C |  |
| RF-128 | Automatizaciones | Tareas periódicas con panorámica de la última repetición. | T3 ejecución | C |  |
| RF-129 | Automatizaciones | Reglas semilla: aprobar edición de ODS cerrada, tarea a la cajera tras aprobar, cliente con deuda (etiqueta y bitácora con enlace a cuentas por cobrar), servicio externo → cotizar. | T1 base | C |  |
| RF-130 | Automatizaciones | Reglas de logística editables: cotizar, cotizar lo que agrega el técnico y comprar lo aprobado (se pueden apagar). | INC-07 | C |  |
| RF-131 | Automatizaciones | Regla «Solicitud de inventario → tarea al logístico». | INC-07 | C |  |
| RF-132 | Espacio de trabajo | Panel de áreas, carpetas, subcarpetas y listas con menú ⋯ y +, cambiar nombre, mover, duplicar y eliminar. | T3 ejecución | C |  |
| RF-133 | Espacio de trabajo | Iconos y colores por carpeta y lista; ordenar de la A a la Z; expandir y contraer todo. | T3 ejecución | C |  |
| RF-134 | Espacio de trabajo | Panel redimensionable y ocultable (« solo el panel; ☰ oculta menú, título y panel). | Transversal | C |  |
| RF-135 | Espacio de trabajo | Contador de tareas pendientes por lista y carpeta; ⋯ y + al pasar el mouse; crear tarea en esa lista. | T3 ejecución | C |  |
| RF-136 | Espacio de trabajo | Cuatro estados fijos de tarea con nombres editables para todo el espacio de trabajo. | T3 ejecución | C |  |
| RF-137 | Espacio de trabajo | Agenda de técnicos solo en las listas que la activan; el técnico externo no entra en la agenda. | T3 ejecución | C |  |
| RF-138 | Espacio de trabajo | Buscador global de módulos, tareas, clientes, vehículos, ODS y automatizaciones. | Transversal | C |  |
| RF-139 | Espacio de trabajo | Encabezado compacto, menú de subtareas y espacio de trabajo al 80 % para ver más. | Transversal | C |  |
| RF-140 | Espacio de trabajo | Evidencias de contacto en las tareas: captura, audio, canal y resultado. | T5 posventa | B | Se guarda en el navegador |
| RF-141 | Órdenes de servicio | Cuatro estados de la ODS (En recepción, En proceso, En entrega, Cerrado); sin archivar; eliminar solo desde Acciones. | T1 base | C | Sustituye el «Archivada» de R7.6 |
| RF-142 | Órdenes de servicio | Barra de estados con LED de color y tarjetas con todo el encabezado, el último mensaje de la bitácora y los mensajes no leídos. | T1 base | C |  |
| RF-143 | Órdenes de servicio | Nueva ODS y Editar ODS con pestañas ODS / Detalle y la misma estructura en ambas. | T1 base | C |  |
| RF-144 | Órdenes de servicio | Tipo de atención con «Otro» de texto libre; el motivo de ingreso se elimina y el texto previo pasa al tipo de atención. | T1 base | C | Migración automática |
| RF-145 | Órdenes de servicio | Fotos de ingreso (cargar o tomar) y «Estado del vehículo» desde Acciones. | T1 base | C |  |
| RF-146 | Órdenes de servicio | Garantía enlazada a la ODS de origen. | T1 base | C |  |
| RF-147 | Órdenes de servicio | Etiquetas en la orden, visibles arriba y quitables. | T1 base | C |  |
| RF-148 | Órdenes de servicio | Editar una ODS cerrada solo con solicitud y aprobación del jefe de taller (queda en la bitácora). | T1 base | C |  |
| RF-149 | Órdenes de servicio | Cotización previa vinculable a la ODS; ítems con o sin cotización; abonos y pagos solo tras crear la ODS. | T1 base | C |  |
| RF-150 | Órdenes de servicio | Calendario: mover eventos y validar capacidad de técnicos sin empalmes. | T3 ejecución | C |  |
| RF-151 | Órdenes de servicio | Rentabilidad por ítem editable en porcentaje (recalcula el precio). | Reportes | C |  |
| RF-152 | Órdenes de servicio | Servicios externos: usuario externo, subtareas y cotización con el jefe de taller. | INC-07 | C |  |
| RF-153 | Órdenes de servicio | Tarea de logística con datos del vehículo y cuadro de compra (proveedor, precio de compra y venta, margen); producto interno o externo. | INC-07 | C |  |
| RF-154 | Ventas y caja | Cotización con pestañas Cliente / Cotización, borrador, salir, atrás, emitir y enviar por WhatsApp. | Cotizaciones | C |  |
| RF-155 | Ventas y caja | Nota de venta con pestañas Cliente / Venta, serie, contado o crédito y emisión. | Cobro | C |  |
| RF-156 | Ventas y caja | Caja: apertura, detalle y cierre dentro de «Emitir comprobante». | Cobro | B | Apagado por defecto; la lógica se conserva |
| RF-157 | Ventas y caja | Ingreso, egreso y transferencia sin comprobante, con comprobante firmable en PDF. | Finanzas | B | Beta y ocultos; los ingresos y egresos se hacen desde Bancos |
| RF-158 | Ventas y caja | Menú reorganizado: Ingresos, Egresos, Seguimiento, Finanzas y Reportes; acordeón. | Transversal | C |  |
| RF-159 | Ventas y caja | Métricas con nombres de productos y servicios; el punto de equilibrio se elimina. | Reportes | C |  |
| RF-160 | Impuestos | IGV por ítem (incluido o no), base imponible e IGV en la nota de venta. | Cobro | C |  |
| RF-161 | Impuestos | Detracción: alerta (servicios sobre S/ 700, 12 %), separar en dos notas de la misma ODS y registrar el depósito. | Cobro | C | Tasa y monto a confirmar con el contador |
| RF-162 | Impuestos | Reporte «IGV y detracciones» con IGV pagado y no pagado, detracción retenida y saldo. | Reportes | C |  |
| RF-163 | Impuestos | IGV, tasa de detracción y monto mínimo configurables. | Cobro | C |  |
| RF-164 | Inventario | Almacenes (locales) con cajas asignadas por sede (listas Agregar / Quitar). | INC-07 | C |  |
| RF-165 | Inventario | Stock por local en Productos y servicios, con vista por local o solo total; los servicios no tienen stock. | INC-07 | C |  |
| RF-166 | Inventario | Ajuste de inventario con contraseña de 4 dígitos: edición tipo Excel de las cantidades por local; el total no se edita. | INC-07 | C |  |
| RF-167 | Inventario | Kárdex por producto y local con compras, movimientos, ajustes por edición, precio de compra y de venta. | INC-07 | C |  |
| RF-168 | Inventario | Precio de compra y de venta propios por local y si el precio incluye IGV. | INC-07 | C |  |
| RF-169 | Inventario | Movimientos entre locales y requerimientos de productos e insumos; la cajera solicita y el logístico acepta. | INC-07 | C |  |
| RF-170 | Inventario | Stock negativo configurable, con aviso al logístico antes de aceptar un movimiento que lo deje en negativo. | INC-07 | C |  |
| RF-171 | Inventario | Las compras alimentan el kárdex en el almacén de destino elegido. | INC-07 | C |  |
| RF-172 | CRM de posventa | Lista CRM dentro de la carpeta de posventa, con vistas Lista y Tablero y los cuatro estados de tarea. | T5 posventa | C |  |
| RF-173 | CRM de posventa | Contacto CRM: WhatsApp y llamada por número, cliente existente o nuevo, vehículo y plan, interés y cotización. | T5 posventa | C |  |
| RF-174 | CRM de posventa | Recorrido enlazado: contacto → cotización enviada → cita → ODS → nota de venta. | T5 posventa | C |  |
| RF-175 | CRM de posventa | Conversión definida: contacto que termina con una cita agendada (no cancelada); embudo y tasas. | T5 posventa | C | Definición propuesta, a confirmar |
| RF-176 | CRM de posventa | Cierre automático del contacto sin respuesta tras el plazo (días hábiles) con la cotización enviada. | T5 posventa | C |  |
| RF-177 | CRM de posventa | Chat del contacto con texto, enlaces, fotos y audios (sin videos). | T5 posventa | B | Simulado |
| RF-178 | Interfaz | Tablas con Acciones desplegable, paginación, ajuste de ancho y desliz táctil. | Transversal | C | Amplía RF-102 |
| RF-179 | Interfaz | Pantalla completa y uso táctil en tableta. | Transversal | C |  |
| RF-180 | Interfaz | X pequeña en todas las ventanas; ventanas de orden, nota y cotización sin barra horizontal. | Transversal | C |  |
| RF-181 | Beta | Integraciones de Google Workspace (Gmail, Calendar, Drive, Docs, Sheets, Chat) y Gemini, con cuenta por persona. | Evolución | B | Simulado |
| RF-182 | Beta | WhatsApp, Facebook, Instagram y TikTok de la empresa como canales del CRM. | Evolución | B | Simulado |
| RF-183 | Beta | Acciones de integración en las reglas (correo, Chat, WhatsApp, Drive, Calendar, Docs, Sheets, Gemini) y 16 plantillas. | Evolución | B | Se registran en «Actividad simulada» |
| RF-184 | Beta | Asistente Gemini: cifras reales del sistema y recomendaciones de mejora (respuestas simuladas). | Evolución | B |  |
| RF-185 | Bancos | Bancos simple: cada cuenta tiene Movimientos, Trasladar a otra cuenta, Ingreso, Egreso (a un proveedor, con concepto) y Editar. | Finanzas | C | Sustituye a «Movimientos de cuentas» |
| RF-186 | Bancos | Cada persona ve solo las cuentas de su sede (administración y finanzas, todas) y todos los que entran a Bancos ven los montos. | Finanzas | C |  |
| RF-187 | Bancos | El pago de facturas de compra se hace en Egresos; los selectores de cuenta de cobros y pagos muestran solo las cuentas de la sede. | Finanzas | C |  |
| RF-188 | Ventas y caja | Las series de comprobantes se asignan a una sede; la cajera emite con la serie de su sede (sin cajas). | Cobro | C | Sustituye la asignación de series a cajas |
| RF-189 | Ventas y caja | Cuentas por cobrar y por pagar muestran solo lo pendiente; el histórico está en Compras y en Emitir comprobante. | Cobro | C |  |
| RF-190 | Ventas y caja | Cotización con el diseño del sistema de referencia: cargar ítems desde una ODS, agregar ítems con precio, descuento %, impuesto y cantidad, cuadros de costos y rentabilidad, lista, observaciones y totales. | Cotizaciones | C |  |
| RF-191 | Reportes | Filtro por sede en todos los reportes (posventa, ventas, ítems, operaciones, rentabilidades, IGV y detracciones, técnicos y garantías). | Reportes | C |  |
| RF-192 | Reportes | El reporte de técnicos agrupa por el técnico de cada servicio, no por el de la orden. | Reportes | C |  |
| RF-193 | Métricas | Se quita la utilización de la capacidad productiva; «Ventas de mano de obra» pasa a llamarse «Venta de servicios». | Reportes | C |  |
| RF-194 | Métricas | Encuesta de satisfacción con enlace: el cliente responde en una página de una pantalla y la respuesta llega al sistema (NPS y satisfacción). | T5 posventa | C | En el prototipo el enlace es #encuesta=ODS; en el sistema real, enlace firmado |
| RF-195 | Configuración | Configuración como centro: estados de tarea, automatizaciones, usuarios, carga masiva, inventario, impuestos y APIs, y los interruptores de módulos beta y de caja. | Transversal | C |  |
| RF-196 | Configuración | Los módulos beta van al final del menú y se pueden ocultar todos desde Configuración. | Transversal | C |  |
| RF-197 | Configuración | Carga masiva (Excel o CSV) de clientes, vehículos, productos y servicios, proveedores, stock, solapamientos, paquetes, grupos y ÓRDENES DE SERVICIO diarias; con vista previa y modos solo agregar, actualizar o completar vacíos. | INC-02 | C | La carga de ODS crea tareas y activa las automatizaciones |
| RF-198 | Configuración | Precarga de datos de negocio de RSA (5 grupos, 135 reglas, 14 servicios con tarifas y excepciones), bajo confirmación. | INC-02 | C | Sin datos personales |
| RF-199 | Configuración | Consulta de placa y de DNI/RUC por API (configuración del superusuario) con respaldo local. | INC-02 | C | APIs reales no probadas |
| RF-200 | Configuración | Matriz de permisos por rol y módulo, e inicio de sesión provisional con botones por rol. | Transversal | C | Demostración; sin autenticación real |
| RF-201 | Inventario | Precio de venta final con y sin IGV, detracción por ítem activable o no, y precios por local. | INC-07 | C |  |
| RF-202 | Inventario | Grupos de vehículos G1 a G5 con reglas de asignación, tarifas por grupo y solapamiento de mano de obra. | INC-04 | C |  |
| RF-203 | Maestros | Paquetes de servicios y productos con promoción y pasos de cada servicio. | Evolución | B | Pasa a beta |
| RF-204 | Finanzas | Flujo de caja diario (dos columnas por día: concepto y monto; una fila por proveedor con detalle por clic) y Comparativo (estado de resultados mensual). | Finanzas | B | Solo en modo vista; carga desde Excel |
| RF-205 | Integración | API de integración: contrato previsto para recibir órdenes y entregar tareas; hoy la vía es la carga masiva. | Evolución | B | Contrato en docs/api/ |
| RF-206 | Configuración | Empresa: nombre comercial único, logo, razón social, RUC, cuentas bancarias y formato de los documentos (PDF o ticket). | Transversal | C | DEC-49 |
| RF-207 | Configuración | Estados de tarea e Inventario, impuestos y APIs son módulos de Configuración («Gestión del espacio de trabajo» e «Inventario, impuestos y APIs»). | Transversal | C | DEC-49 |
| RF-208 | Ventas y caja | Imprimir en PDF o ticket la cotización, la ODS, la nota de venta, los requerimientos y los movimientos de cuentas, con los datos y las cuentas de la empresa. | Cobro | C | DEC-50 |
| RF-209 | Inventario | Movimientos de inventario = requerimientos: la cajera solicita; el logístico edita el origen, asocia facturas de compra y aprueba; al aprobar se mueve el stock de lo que tiene código y se avisa al solicitante; se imprime en PDF. | INC-07 | C | DEC-51 |
| RF-210 | Inventario | Almacenes con solo local y dirección; «Asignar cajas» es beta. | INC-07 | C | DEC-51 |
| RF-211 | Impuestos | Columna de impuesto (IGV o sin impuesto) por ítem también en la ODS y la cita; el reporte se llama «Impuesto y detracciones». | Cobro | C | DEC-52 |
| RF-212 | Interfaz | Modo compacto: encabezado y menú lateral angostos y contenido a todo el ancho. | Transversal | C |  |
| RF-213 | Quitado | Reglas de precios (subir precios por reglas en bloque). | Inventario | Q | Quitado el 19/10/2026 |
| RF-214 | Quitado | Auditoría interna (queda la Bitácora). | Configuración | Q | Quitado el 19/10/2026 |
| RF-215 | Quitado | Movimientos de cuentas (sustituido por las acciones de Bancos). | Finanzas | Q | Quitado el 19/10/2026 |

Nivel: C = primera versión · B = beta · Q = quitado.

## 5. Qué quedó fuera de la primera versión

- **Beta (visibles al final del menú, ocultables):** Cajas (apertura y cierre, lógica conservada y apagada), Paquetes de servicios y productos, Ingreso y Egreso sin comprobante, Flujo de caja, Comparativo, Integraciones (Google Workspace, WhatsApp y redes), Asistente Gemini y API de integración; además, comisión por técnico, evidencias con audio y capturas y chat del contacto CRM.
- **Quitado:** Reglas de precios, Auditoría interna (queda la Bitácora) y Movimientos de cuentas.
- **Primera versión:** el resto del prototipo, incluida la carga masiva diaria de órdenes de servicio, que crea tareas y activa las automatizaciones.

## 6. Dudas y decisiones que quedan abiertas

1. **Definición de conversión** (RF-175): la propuesta es «contacto con cita agendada, no cancelada»; venta completa = cita → ODS → nota de venta. Confírmala o cámbiala.
2. **Detracción:** la tasa de 12 % para mantenimiento y reparación de bienes muebles se confirmó en la búsqueda; el monto mínimo de S/ 700 lo dio el investigador y no se confirmó. Verificar con el contador, incluido el riesgo de separar una misma operación en dos notas.
3. **Facturación electrónica:** la nota de venta es interna, no un comprobante SUNAT. La facturación electrónica real queda fuera.
4. **Persistencia:** audios y capturas se guardan en el navegador; un sistema real necesita almacenamiento de archivos.
5. **Roles:** el control de acceso del prototipo es de demostración (sin autenticación real). Desde el 19/10/2026 existe el rol «Asistente administrativo de finanzas» (DEC-47), aparte del Logístico.
6. **Módulos beta:** por defecto se ven al final del menú; confirmar si deben estar ocultos de fábrica.
7. **Numeración:** RF-118 en adelante son provisionales; renumerar cuando se congele el catálogo.
