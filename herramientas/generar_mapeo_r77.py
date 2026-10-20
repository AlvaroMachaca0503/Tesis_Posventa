# -*- coding: utf-8 -*-
"""Genera docs/requisitos/MAPEO_COMPLETO_R77.md y MAPEO_R77.csv.

Fuentes: docs/requisitos/CLASIFICACION_RF.csv (RF-01..117 de R7.6) y la lista
de funciones que R7.7 agrega, escrita aquí (RF-118 en adelante, PROPUESTOS por
el asistente, no decididos por el investigador). Los totales se calculan.
Uso: python herramientas/generar_mapeo_r77.py
"""
import csv, collections, os, io

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_RF = os.path.join(RAIZ, 'docs', 'requisitos', 'CLASIFICACION_RF.csv')

# Niveles (decididos por el investigador el 19/10/2026, al delimitar la primera versión):
# C = primera versión (se implementa y se defiende: todo lo que no es beta) ·
# B = beta (visible al final del menú y ocultable en Configuración; NO se implementa:
#     se queda como demostración, simulado o apagado) ·
# Q = quitado del sistema (se eliminó del menú).
NIVEL = {
    'C': 'Primera versión (se implementa y se defiende)',
    'B': 'Beta (visible, ocultable, no se implementa)',
    'Q': 'Quitado',
}

# De R6/R7.6: pasan a beta la comisión por técnico (RF-58) y la apertura y cierre de caja
# (RF-55, RF-82: la lógica se conserva pero está apagada). Todo lo demás de R7.6 es primera versión.
BASE_B = {'RF-58', 'RF-55', 'RF-82'}


def nivel_base(rf, inc):
    return 'B' if rf in BASE_B else 'C'


# (módulo, requisito, bloque propuesto, nivel, nota)
NUEVOS = [
 # --- Automatizaciones
 ('Automatizaciones', 'Motor «Cuando / Y si / Entonces» editable por el usuario (desencadenante, condiciones y acciones, con nombre, descripción y activación).', 'T5 posventa', 'C', ''),
 ('Automatizaciones', 'Desencadenantes por suceso (ODS, cita, vehículo, tarea, producto, pago, nota, inventario, CRM) y por tiempo (km, cita, salida de la ODS, fecha límite, atraso, sin respuesta).', 'T5 posventa', 'C', '31 desencadenantes en R7.7'),
 ('Automatizaciones', 'Condiciones combinables: sede, celular, deuda, plan preventivo, sin técnico, recomendación, prioridad, etiqueta, tipo de tarea y dato de un módulo.', 'T5 posventa', 'C', ''),
 ('Automatizaciones', 'Acciones reales: crear tarea, etiquetar la ODS, avisar, comentar en la bitácora, reasignar, cambiar prioridad, estado o lista, cerrar contacto CRM.', 'T5 posventa', 'C', ''),
 ('Automatizaciones', 'Reglas de sistema editables, apagables y eliminables (confirmar cita, consultar km, posventa) con los mismos resultados que antes.', 'T5 posventa', 'C', 'Regresión de R7.4'),
 ('Automatizaciones', 'Variables en los textos ({cliente.nombre}, {vehiculo.placa}, {ods.codigo}, {producto}, {monto}…) por módulo.', 'T5 posventa', 'A', ''),
 ('Automatizaciones', 'Plazos con unidad (minutos a años) y modo hábil o consecutivo según el horario de atención.', 'T5 posventa', 'A', ''),
 ('Automatizaciones', 'Historial de ejecuciones, uso del mes y protección contra bucles (límite de acciones por pasada).', 'T5 posventa', 'A', ''),
 ('Automatizaciones', 'Biblioteca de plantillas por categoría con filtro lateral (46 plantillas).', 'T5 posventa', 'A', ''),
 ('Automatizaciones', 'Hora simulada global para probar reglas de tiempo sin esperar.', 'Transversal', 'A', ''),
 ('Automatizaciones', 'Tareas periódicas con panorámica de la última repetición.', 'T3 ejecución', 'A', ''),
 ('Automatizaciones', 'Reglas semilla: aprobar edición de ODS cerrada, tarea a la cajera tras aprobar, cliente con deuda (etiqueta y bitácora con enlace a cuentas por cobrar), servicio externo → cotizar.', 'T1 base', 'A', ''),
 ('Automatizaciones', 'Reglas de logística editables: cotizar, cotizar lo que agrega el técnico y comprar lo aprobado (se pueden apagar).', 'INC-07', 'A', ''),
 ('Automatizaciones', 'Regla «Solicitud de inventario → tarea al logístico».', 'INC-07', 'A', ''),
 # --- Espacio de trabajo
 ('Espacio de trabajo', 'Panel de áreas, carpetas, subcarpetas y listas con menú ⋯ y +, cambiar nombre, mover, duplicar y eliminar.', 'T3 ejecución', 'C', ''),
 ('Espacio de trabajo', 'Iconos y colores por carpeta y lista; ordenar de la A a la Z; expandir y contraer todo.', 'T3 ejecución', 'A', ''),
 ('Espacio de trabajo', 'Panel redimensionable y ocultable (« solo el panel; ☰ oculta menú, título y panel).', 'Transversal', 'A', ''),
 ('Espacio de trabajo', 'Contador de tareas pendientes por lista y carpeta; ⋯ y + al pasar el mouse; crear tarea en esa lista.', 'T3 ejecución', 'C', ''),
 ('Espacio de trabajo', 'Cuatro estados fijos de tarea con nombres editables para todo el espacio de trabajo.', 'T3 ejecución', 'C', ''),
 ('Espacio de trabajo', 'Agenda de técnicos solo en las listas que la activan; el técnico externo no entra en la agenda.', 'T3 ejecución', 'C', ''),
 ('Espacio de trabajo', 'Buscador global de módulos, tareas, clientes, vehículos, ODS y automatizaciones.', 'Transversal', 'A', ''),
 ('Espacio de trabajo', 'Encabezado compacto, menú de subtareas y espacio de trabajo al 80 % para ver más.', 'Transversal', 'A', ''),
 ('Espacio de trabajo', 'Evidencias de contacto en las tareas: captura, audio, canal y resultado.', 'T5 posventa', 'B', 'Se guarda en el navegador'),
 # --- ODS
 ('Órdenes de servicio', 'Cuatro estados de la ODS (En recepción, En proceso, En entrega, Cerrado); sin archivar; eliminar solo desde Acciones.', 'T1 base', 'C', 'Sustituye el «Archivada» de R7.6'),
 ('Órdenes de servicio', 'Barra de estados con LED de color y tarjetas con todo el encabezado, el último mensaje de la bitácora y los mensajes no leídos.', 'T1 base', 'A', ''),
 ('Órdenes de servicio', 'Nueva ODS y Editar ODS con pestañas ODS / Detalle y la misma estructura en ambas.', 'T1 base', 'C', ''),
 ('Órdenes de servicio', 'Tipo de atención con «Otro» de texto libre; el motivo de ingreso se elimina y el texto previo pasa al tipo de atención.', 'T1 base', 'C', 'Migración automática'),
 ('Órdenes de servicio', 'Fotos de ingreso (cargar o tomar) y «Estado del vehículo» desde Acciones.', 'T1 base', 'C', ''),
 ('Órdenes de servicio', 'Garantía enlazada a la ODS de origen.', 'T1 base', 'A', ''),
 ('Órdenes de servicio', 'Etiquetas en la orden, visibles arriba y quitables.', 'T1 base', 'A', ''),
 ('Órdenes de servicio', 'Editar una ODS cerrada solo con solicitud y aprobación del jefe de taller (queda en la bitácora).', 'T1 base', 'C', ''),
 ('Órdenes de servicio', 'Cotización previa vinculable a la ODS; ítems con o sin cotización; abonos y pagos solo tras crear la ODS.', 'T1 base', 'A', ''),
 ('Órdenes de servicio', 'Calendario: mover eventos y validar capacidad de técnicos sin empalmes.', 'T3 ejecución', 'C', ''),
 ('Órdenes de servicio', 'Rentabilidad por ítem editable en porcentaje (recalcula el precio).', 'Reportes', 'A', ''),
 ('Órdenes de servicio', 'Servicios externos: usuario externo, subtareas y cotización con el jefe de taller.', 'INC-07', 'A', ''),
 ('Órdenes de servicio', 'Tarea de logística con datos del vehículo y cuadro de compra (proveedor, precio de compra y venta, margen); producto interno o externo.', 'INC-07', 'A', ''),
 # --- Ventas y caja
 ('Ventas y caja', 'Cotización con pestañas Cliente / Cotización, borrador, salir, atrás, emitir y enviar por WhatsApp.', 'Cotizaciones', 'A', ''),
 ('Ventas y caja', 'Nota de venta con pestañas Cliente / Venta, serie, contado o crédito y emisión.', 'Cobro', 'A', ''),
 ('Ventas y caja', 'Caja: apertura, detalle y cierre dentro de «Emitir comprobante».', 'Cobro', 'A', ''),
 ('Ventas y caja', 'Ingreso, egreso y transferencia sin comprobante, con comprobante firmable en PDF.', 'Finanzas', 'B', ''),
 ('Ventas y caja', 'Menú reorganizado: Ingresos, Egresos, Seguimiento, Finanzas y Reportes; acordeón.', 'Transversal', 'A', ''),
 ('Ventas y caja', 'Métricas con nombres de productos y servicios; el punto de equilibrio se elimina.', 'Reportes', 'A', ''),
 # --- Impuestos
 ('Impuestos', 'IGV por ítem (incluido o no), base imponible e IGV en la nota de venta.', 'Cobro', 'A', ''),
 ('Impuestos', 'Detracción: alerta (servicios sobre S/ 700, 12 %), separar en dos notas de la misma ODS y registrar el depósito.', 'Cobro', 'A', 'Tasa y monto a confirmar con el contador'),
 ('Impuestos', 'Reporte «IGV y detracciones» con IGV pagado y no pagado, detracción retenida y saldo.', 'Reportes', 'A', ''),
 ('Impuestos', 'IGV, tasa de detracción y monto mínimo configurables.', 'Cobro', 'A', ''),
 # --- Inventario
 ('Inventario', 'Almacenes (locales) con cajas asignadas por sede (listas Agregar / Quitar).', 'INC-07', 'A', ''),
 ('Inventario', 'Stock por local en Productos y servicios, con vista por local o solo total; los servicios no tienen stock.', 'INC-07', 'A', ''),
 ('Inventario', 'Ajuste de inventario con contraseña de 4 dígitos: edición tipo Excel de las cantidades por local; el total no se edita.', 'INC-07', 'A', ''),
 ('Inventario', 'Kárdex por producto y local con compras, movimientos, ajustes por edición, precio de compra y de venta.', 'INC-07', 'A', ''),
 ('Inventario', 'Precio de compra y de venta propios por local y si el precio incluye IGV.', 'INC-07', 'A', ''),
 ('Inventario', 'Movimientos entre locales y requerimientos de productos e insumos; la cajera solicita y el logístico acepta.', 'INC-07', 'A', ''),
 ('Inventario', 'Stock negativo configurable, con aviso al logístico antes de aceptar un movimiento que lo deje en negativo.', 'INC-07', 'A', ''),
 ('Inventario', 'Las compras alimentan el kárdex en el almacén de destino elegido.', 'INC-07', 'A', ''),
 # --- CRM
 ('CRM de posventa', 'Lista CRM dentro de la carpeta de posventa, con vistas Lista y Tablero y los cuatro estados de tarea.', 'T5 posventa', 'C', ''),
 ('CRM de posventa', 'Contacto CRM: WhatsApp y llamada por número, cliente existente o nuevo, vehículo y plan, interés y cotización.', 'T5 posventa', 'C', ''),
 ('CRM de posventa', 'Recorrido enlazado: contacto → cotización enviada → cita → ODS → nota de venta.', 'T5 posventa', 'C', ''),
 ('CRM de posventa', 'Conversión definida: contacto que termina con una cita agendada (no cancelada); embudo y tasas.', 'T5 posventa', 'C', 'Definición propuesta, a confirmar'),
 ('CRM de posventa', 'Cierre automático del contacto sin respuesta tras el plazo (días hábiles) con la cotización enviada.', 'T5 posventa', 'C', ''),
 ('CRM de posventa', 'Chat del contacto con texto, enlaces, fotos y audios (sin videos).', 'T5 posventa', 'B', 'Simulado'),
 # --- Interfaz transversal
 ('Interfaz', 'Tablas con Acciones desplegable, paginación, ajuste de ancho y desliz táctil.', 'Transversal', 'A', 'Amplía RF-102'),
 ('Interfaz', 'Pantalla completa y uso táctil en tableta.', 'Transversal', 'A', ''),
 ('Interfaz', 'X pequeña en todas las ventanas; ventanas de orden, nota y cotización sin barra horizontal.', 'Transversal', 'A', ''),
 # --- Beta
 ('Beta', 'Integraciones de Google Workspace (Gmail, Calendar, Drive, Docs, Sheets, Chat) y Gemini, con cuenta por persona.', 'Evolución', 'B', 'Simulado'),
 ('Beta', 'WhatsApp, Facebook, Instagram y TikTok de la empresa como canales del CRM.', 'Evolución', 'B', 'Simulado'),
 ('Beta', 'Acciones de integración en las reglas (correo, Chat, WhatsApp, Drive, Calendar, Docs, Sheets, Gemini) y 16 plantillas.', 'Evolución', 'B', 'Se registran en «Actividad simulada»'),
 ('Beta', 'Asistente Gemini: cifras reales del sistema y recomendaciones de mejora (respuestas simuladas).', 'Evolución', 'B', ''),
]
NUEVOS = [(m, t, bl, ('C' if n == 'A' else n), nt) for (m, t, bl, n, nt) in NUEVOS]
PASAN_A_BETA = ('Caja: apertura, detalle y cierre', 'Ingreso, egreso y transferencia sin comprobante')
NUEVOS = [(m, t, bl, ('B' if t.startswith(PASAN_A_BETA) else n),
           ('Apagado por defecto; la lógica se conserva' if t.startswith('Caja: apertura') else
            ('Beta y ocultos; los ingresos y egresos se hacen desde Bancos' if t.startswith('Ingreso, egreso') else nt)))
          for (m, t, bl, n, nt) in NUEVOS]
NUEVOS += [
 # --- Delimitación del 19/10/2026
 ('Bancos', 'Bancos simple: cada cuenta tiene Movimientos, Trasladar a otra cuenta, Ingreso, Egreso (a un proveedor, con concepto) y Editar.', 'Finanzas', 'C', 'Sustituye a «Movimientos de cuentas»'),
 ('Bancos', 'Cada persona ve solo las cuentas de su sede (administración y finanzas, todas) y todos los que entran a Bancos ven los montos.', 'Finanzas', 'C', ''),
 ('Bancos', 'El pago de facturas de compra se hace en Egresos; los selectores de cuenta de cobros y pagos muestran solo las cuentas de la sede.', 'Finanzas', 'C', ''),
 ('Ventas y caja', 'Las series de comprobantes se asignan a una sede; la cajera emite con la serie de su sede (sin cajas).', 'Cobro', 'C', 'Sustituye la asignación de series a cajas'),
 ('Ventas y caja', 'Cuentas por cobrar y por pagar muestran solo lo pendiente; el histórico está en Compras y en Emitir comprobante.', 'Cobro', 'C', ''),
 ('Ventas y caja', 'Cotización con el diseño del sistema de referencia: cargar ítems desde una ODS, agregar ítems con precio, descuento %, impuesto y cantidad, cuadros de costos y rentabilidad, lista, observaciones y totales.', 'Cotizaciones', 'C', ''),
 ('Reportes', 'Filtro por sede en todos los reportes (posventa, ventas, ítems, operaciones, rentabilidades, IGV y detracciones, técnicos y garantías).', 'Reportes', 'C', ''),
 ('Reportes', 'El reporte de técnicos agrupa por el técnico de cada servicio, no por el de la orden.', 'Reportes', 'C', ''),
 ('Métricas', 'Se quita la utilización de la capacidad productiva; «Ventas de mano de obra» pasa a llamarse «Venta de servicios».', 'Reportes', 'C', ''),
 ('Métricas', 'Encuesta de satisfacción con enlace: el cliente responde en una página de una pantalla y la respuesta llega al sistema (NPS y satisfacción).', 'T5 posventa', 'C', 'En el prototipo el enlace es #encuesta=ODS; en el sistema real, enlace firmado'),
 ('Configuración', 'Configuración como centro: estados de tarea, automatizaciones, usuarios, carga masiva, inventario, impuestos y APIs, y los interruptores de módulos beta y de caja.', 'Transversal', 'C', ''),
 ('Configuración', 'Los módulos beta van al final del menú y se pueden ocultar todos desde Configuración.', 'Transversal', 'C', ''),
 ('Configuración', 'Carga masiva (Excel o CSV) de clientes, vehículos, productos y servicios, proveedores, stock, solapamientos, paquetes, grupos y ÓRDENES DE SERVICIO diarias; con vista previa y modos solo agregar, actualizar o completar vacíos.', 'INC-02', 'C', 'La carga de ODS crea tareas y activa las automatizaciones'),
 ('Configuración', 'Precarga de datos de negocio de RSA (5 grupos, 135 reglas, 14 servicios con tarifas y excepciones), bajo confirmación.', 'INC-02', 'C', 'Sin datos personales'),
 ('Configuración', 'Consulta de placa y de DNI/RUC por API (configuración del superusuario) con respaldo local.', 'INC-02', 'C', 'APIs reales no probadas'),
 ('Configuración', 'Matriz de permisos por rol y módulo, e inicio de sesión provisional con botones por rol.', 'Transversal', 'C', 'Demostración; sin autenticación real'),
 ('Inventario', 'Precio de venta final con y sin IGV, detracción por ítem activable o no, y precios por local.', 'INC-07', 'C', ''),
 ('Inventario', 'Grupos de vehículos G1 a G5 con reglas de asignación, tarifas por grupo y solapamiento de mano de obra.', 'INC-04', 'C', ''),
 ('Maestros', 'Paquetes de servicios y productos con promoción y pasos de cada servicio.', 'Evolución', 'B', 'Pasa a beta'),
 ('Finanzas', 'Flujo de caja diario (dos columnas por día: concepto y monto; una fila por proveedor con detalle por clic) y Comparativo (estado de resultados mensual).', 'Finanzas', 'B', 'Solo en modo vista; carga desde Excel'),
 ('Integración', 'API de integración: contrato previsto para recibir órdenes y entregar tareas; hoy la vía es la carga masiva.', 'Evolución', 'B', 'Contrato en docs/api/'),
 ('Configuración', 'Empresa: nombre comercial único, logo, razón social, RUC, cuentas bancarias y formato de los documentos (PDF o ticket).', 'Transversal', 'C', 'DEC-49'),
 ('Configuración', 'Estados de tarea e Inventario, impuestos y APIs son módulos de Configuración («Gestión del espacio de trabajo» e «Inventario, impuestos y APIs»).', 'Transversal', 'C', 'DEC-49'),
 ('Ventas y caja', 'Imprimir en PDF o ticket la cotización, la ODS, la nota de venta, los requerimientos y los movimientos de cuentas, con los datos y las cuentas de la empresa.', 'Cobro', 'C', 'DEC-50'),
 ('Inventario', 'Movimientos de inventario = requerimientos: la cajera solicita; el logístico edita el origen, asocia facturas de compra y aprueba; al aprobar se mueve el stock de lo que tiene código y se avisa al solicitante; se imprime en PDF.', 'INC-07', 'C', 'DEC-51'),
 ('Inventario', 'Almacenes con solo local y dirección; «Asignar cajas» es beta.', 'INC-07', 'C', 'DEC-51'),
 ('Impuestos', 'Columna de impuesto (IGV o sin impuesto) por ítem también en la ODS y la cita; el reporte se llama «Impuesto y detracciones».', 'Cobro', 'C', 'DEC-52'),
 ('Interfaz', 'Modo compacto: encabezado y menú lateral angostos y contenido a todo el ancho.', 'Transversal', 'C', ''),
 ('Quitado', 'Reglas de precios (subir precios por reglas en bloque).', 'Inventario', 'Q', 'Quitado el 19/10/2026'),
 ('Quitado', 'Auditoría interna (queda la Bitácora).', 'Configuración', 'Q', 'Quitado el 19/10/2026'),
 ('Quitado', 'Movimientos de cuentas (sustituido por las acciones de Bancos).', 'Finanzas', 'Q', 'Quitado el 19/10/2026'),
]

# Módulos del menú → nivel, según el árbol R75_NAV de R7.7 delimitado (19/10/2026)
MENU = [
 ('Órdenes de servicio', 'tesis', 'C'), ('Métricas', '', 'C'), ('Espacio de trabajo', 'tesis', 'C'), ('Línea temporal', 'tesis', 'C'),
 ('Maestros › Clientes', 'tesis', 'C'), ('Maestros › Proveedores', '', 'C'), ('Maestros › Vehículos', 'tesis', 'C'), ('Maestros › Grupos de vehículos', 'tesis', 'C'),
 ('Maestros › Planes preventivos', 'tesis', 'C'), ('Maestros › Solapamientos de servicios', 'tesis', 'C'), ('Maestros › Marcas de vehículo', 'tesis', 'C'), ('Maestros › Series de comprobantes (por sede)', 'tesis', 'C'),
 ('Inventario › Productos y servicios', 'tesis', 'C'), ('Inventario › Almacenes (locales)', '', 'C'), ('Inventario › Movimientos y requerimientos', '', 'C'),
 ('Inventario › Kárdex de productos', '', 'C'), ('Inventario › Marcas de producto', 'tesis', 'C'), ('Inventario › Categorías', 'tesis', 'C'),
 ('Ingresos › Cotizaciones', 'tesis', 'C'), ('Ingresos › Emitir comprobante (nota de venta)', '', 'C'), ('Ingresos › Cuentas por cobrar', '', 'C'),
 ('Egresos › Compras y comprobantes', '', 'C'), ('Egresos › Cuentas por pagar', '', 'C'),
 ('Seguimiento › Citas', 'tesis', 'C'), ('Seguimiento › Bitácora', 'tesis', 'C'),
 ('Finanzas › Bancos', '', 'C'),
 ('Reportes › Posventa', 'tesis', 'C'), ('Reportes › Ventas generales', '', 'C'), ('Reportes › Ventas por ítems', '', 'C'),
 ('Reportes › Operaciones', '', 'C'), ('Reportes › Rentabilidades', '', 'C'), ('Reportes › IGV y detracciones', '', 'C'), ('Reportes › Técnicos', '', 'C'),
 ('Reportes › Garantías', 'tesis', 'C'),
 ('Configuración › Automatizaciones', 'tesis', 'C'), ('Configuración › Usuarios', '', 'C'), ('Configuración › Configuración (estados de tarea, inventario, impuestos y APIs)', '', 'C'),
 ('Configuración › Carga masiva (incluye órdenes de servicio)', '', 'C'),
 ('Lista CRM (dentro del Espacio de trabajo)', '', 'C'),
 ('Beta › Cajas (apertura y cierre)', 'beta', 'B'), ('Beta › Paquetes de servicios y productos', 'beta', 'B'),
 ('Beta › Ingreso (sin comprobante)', 'beta', 'B'), ('Beta › Egreso (sin comprobante)', 'beta', 'B'),
 ('Beta › Flujo de caja', 'beta', 'B'), ('Beta › Comparativo (estado de resultados)', 'beta', 'B'),
 ('Beta › Integraciones', 'beta', 'B'), ('Beta › Asistente Gemini', 'beta', 'B'), ('Beta › API de integración', 'beta', 'B'),
 ('Quitado › Reglas de precios', '', 'Q'), ('Quitado › Auditoría interna', '', 'Q'), ('Quitado › Movimientos de cuentas', '', 'Q'),
]


def leer_base():
    with io.open(CSV_RF, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def main():
    base = leer_base()
    por_inc = collections.OrderedDict()
    for r in base:
        n = nivel_base(r['rf'], r['incremento_propuesto'])
        por_inc.setdefault(r['incremento_propuesto'], collections.Counter())[n] += 1
    tot_base = collections.Counter(nivel_base(r['rf'], r['incremento_propuesto']) for r in base)
    nuevos = []
    for i, (mod, txt, bloque, niv, nota) in enumerate(NUEVOS):
        nuevos.append({'rf': 'RF-%d' % (118 + i), 'modulo': mod, 'requisito': txt, 'bloque': bloque, 'nivel': niv, 'nota': nota})
    tot_nuevos = collections.Counter(x['nivel'] for x in nuevos)
    por_mod = collections.OrderedDict()
    for x in nuevos:
        por_mod.setdefault(x['modulo'], collections.Counter())[x['nivel']] += 1
    total = len(base) + len(nuevos)
    tot = tot_base + tot_nuevos
    m_menu = collections.Counter(n for _, _, n in MENU)

    out = []
    w = out.append
    w('# Mapeo completo del prototipo R7.7: módulos, submódulos y requisitos (delimitado el 19/10/2026)')
    w('')
    w('Generado por `herramientas/generar_mapeo_r77.py` (no editar a mano: edita el script y vuelve a ejecutarlo). Versión: R7.7, 19/10/2026. La delimitación completa, con reglas y excepciones, está en `docs/alcance/DELIMITACION_PRIMERA_VERSION_R77.md`.')
    w('')
    w('**Qué es esto.** El catálogo vigente (`CATALOGO_RF.md`) llega a RF-117 (R7.6). Aquí se agrega lo que R7.7 construyó después (RF-118 en adelante) y se clasifica todo según la **delimitación que decidió el investigador el 19/10/2026**: lo que no es beta es la **primera versión**, lo beta se muestra al final del menú y no se implementa, y lo quitado ya no está. La numeración RF-118 en adelante sigue siendo provisional.')
    w('')
    w('## 1. Cifras')
    w('')
    w('| | Requisitos |')
    w('|---|---:|')
    w('| Catálogo R7.6 (RF-01 a RF-117) | %d |' % len(base))
    w('| Agregados por R7.7 (RF-118 a RF-%d) | %d |' % (117 + len(nuevos), len(nuevos)))
    w('| **Total mapeado** | **%d** |' % total)
    w('')
    w('### Delimitación decidida')
    w('')
    w('| Nivel | R7.6 | R7.7 nuevos | Total |')
    w('|---|---:|---:|---:|')
    for k in 'CBQ':
        w('| %s | %d | %d | **%d** |' % (NIVEL[k], tot_base[k], tot_nuevos[k], tot[k]))
    w('| Total | %d | %d | %d |' % (len(base), len(nuevos), total))
    w('')
    w('- **Primera versión: %d de %d (%d %%).** Es lo que se implementa en el sistema real y se defiende con pruebas.' % (tot['C'], total, round(100 * tot['C'] / total)))
    w('- **Beta: %d.** Visibles al final del menú con la etiqueta «beta»; se pueden ocultar todos desde Configuración. No se implementan.' % tot['B'])
    w('- **Quitado: %d.** Ya no están en el menú (reglas de precios, auditoría interna y movimientos de cuentas).' % tot['Q'])
    w('')
    w('## 2. Módulos y submódulos del menú (R7.7 delimitado)')
    w('')
    w('«Etiqueta hoy» es la que muestra el menú. «Nivel» es el de la delimitación.')
    w('')
    w('| Módulo › submódulo | Etiqueta hoy | Nivel |')
    w('|---|---|---|')
    for nombre, tag, niv in MENU:
        w('| %s | %s | %s |' % (nombre, tag or '—', NIVEL[niv].split(' (')[0]))
    w('')
    w('Entradas: **%d**. Primera versión: %d · beta: %d · quitadas: %d.' % (len(MENU), m_menu['C'], m_menu['B'], m_menu['Q']))
    w('')
    w('## 3. Catálogo R7.6 (RF-01 a RF-117) por incremento')
    w('')
    w('| Incremento | RF | Primera versión | Beta |')
    w('|---|---:|---:|---:|')
    for inc, c in por_inc.items():
        w('| %s | %d | %d | %d |' % (inc, sum(c.values()), c['C'], c['B']))
    w('')
    w('Criterio: todo lo de R7.6 es primera versión salvo la comisión por técnico (RF-58) y la apertura y cierre de caja (RF-55, RF-82), que pasan a beta. Los PENDIENTE de R7.6 (RF-93 reportes, RF-94 cotizaciones, RF-114 métricas) quedan en la primera versión.')
    w('')
    w('## 4. Requisitos nuevos de R7.7 (RF-118 en adelante)')
    w('')
    w('| Módulo | Primera versión | Beta | Quitado | Total |')
    w('|---|---:|---:|---:|---:|')
    for mod, c in por_mod.items():
        w('| %s | %d | %d | %d | %d |' % (mod, c['C'], c['B'], c['Q'], sum(c.values())))
    w('')
    w('| RF | Módulo | Requisito | Bloque propuesto | Nivel | Nota |')
    w('|---|---|---|---|---|---|')
    for x in nuevos:
        w('| %s | %s | %s | %s | %s | %s |' % (x['rf'], x['modulo'], x['requisito'], x['bloque'], x['nivel'], x['nota']))
    w('')
    w('Nivel: C = primera versión · B = beta · Q = quitado.')
    w('')
    w('## 5. Qué quedó fuera de la primera versión')
    w('')
    w('- **Beta (visibles al final del menú, ocultables):** Cajas (apertura y cierre, lógica conservada y apagada), Paquetes de servicios y productos, Ingreso y Egreso sin comprobante, Flujo de caja, Comparativo, Integraciones (Google Workspace, WhatsApp y redes), Asistente Gemini y API de integración; además, comisión por técnico, evidencias con audio y capturas y chat del contacto CRM.')
    w('- **Quitado:** Reglas de precios, Auditoría interna (queda la Bitácora) y Movimientos de cuentas.')
    w('- **Primera versión:** el resto del prototipo, incluida la carga masiva diaria de órdenes de servicio, que crea tareas y activa las automatizaciones.')
    w('')
    w('## 6. Dudas y decisiones que quedan abiertas')
    w('')
    w('1. **Definición de conversión** (RF-%d): la propuesta es «contacto con cita agendada, no cancelada»; venta completa = cita → ODS → nota de venta. Confírmala o cámbiala.' % (118 + [i for i, x in enumerate(NUEVOS) if 'Conversión definida' in x[1]][0]))
    w('2. **Detracción:** la tasa de 12 % para mantenimiento y reparación de bienes muebles se confirmó en la búsqueda; el monto mínimo de S/ 700 lo dio el investigador y no se confirmó. Verificar con el contador, incluido el riesgo de separar una misma operación en dos notas.')
    w('3. **Facturación electrónica:** la nota de venta es interna, no un comprobante SUNAT. La facturación electrónica real queda fuera.')
    w('4. **Persistencia:** audios y capturas se guardan en el navegador; un sistema real necesita almacenamiento de archivos.')
    w('5. **Roles:** el control de acceso del prototipo es de demostración (sin autenticación real). Desde el 19/10/2026 existe el rol «Asistente administrativo de finanzas» (DEC-47), aparte del Logístico.')
    w('6. **Módulos beta:** por defecto se ven al final del menú; confirmar si deben estar ocultos de fábrica.')
    w('7. **Numeración:** RF-118 en adelante son provisionales; renumerar cuando se congele el catálogo.')
    w('')
    ruta = os.path.join(RAIZ, 'docs', 'requisitos', 'MAPEO_COMPLETO_R77.md')
    with io.open(ruta, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))
    ruta_csv = os.path.join(RAIZ, 'docs', 'requisitos', 'MAPEO_R77.csv')
    with io.open(ruta_csv, 'w', encoding='utf-8-sig', newline='') as f:
        wr = csv.writer(f)
        wr.writerow(['rf', 'origen', 'incremento_o_bloque', 'nivel', 'modulo', 'requisito', 'nota'])
        for r in base:
            wr.writerow([r['rf'], 'R7.6', r['incremento_propuesto'], nivel_base(r['rf'], r['incremento_propuesto']), '', r['requisito'], ''])
        for x in nuevos:
            wr.writerow([x['rf'], 'R7.7', x['bloque'], x['nivel'], x['modulo'], x['requisito'], x['nota']])
    print('base', len(base), 'nuevos', len(nuevos), 'total', total)
    print('niveles', dict(tot), 'menu', len(MENU), dict(m_menu))
    print('base', dict(tot_base), 'nuevos', dict(tot_nuevos))


if __name__ == '__main__':
    main()
