# -*- coding: utf-8 -*-
"""Genera la matriz de permisos de R7.7 a partir de una sola fuente.

Salidas:
  docs/requisitos/MATRIZ_PERMISOS_R77.md        (documento para revisar)
  prototipo/capas/r77/ac_permisos_data.js       (datos que usa el HTML)
Uso: python herramientas/generar_permisos_r77.py
Es una PROPUESTA del asistente: el investigador decide quién ve y hace qué.
"""
import io, json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROLES = ['Administrador', 'Jefe de taller', 'Cajera', 'Técnico', 'Logístico', 'Externo', 'Finanzas']
ABREV = ['Superusuario', 'Jefe de taller', 'Cajera', 'Técnico', 'Logístico', 'Técnico externo', 'Asist. adm. finanzas']
# A = ver, editar y acciones sensibles · E = ver y editar · V = solo ver · - = sin acceso (el módulo no aparece)
# orden: Superusuario, Jefe, Cajera, Técnico, Logístico, Externo, Asistente administrativo de finanzas (el 7.º carácter se agrega abajo)
FILAS = [
 ('ods', 'Órdenes de servicio', '', 'AAEVVV', 'Técnico y externo ven solo lo asignado; sin costos ni márgenes'),
 ('inicio', 'Métricas', '', 'VV----', ''),
 ('tareas', 'Espacio de trabajo', '', 'AEEEEE', 'Cada persona ve sus tareas y las de las listas a las que pertenece; incluye la lista CRM'),
 ('timeline', 'Línea temporal', '', 'EEEV--', ''),
 ('clientes', 'Maestros › Clientes', 'Maestros', 'AEEVV-', ''),
 ('proveedores', 'Maestros › Proveedores', 'Maestros', 'AVV-E-', ''),
 ('vehiculos', 'Maestros › Vehículos', 'Maestros', 'AEEVV-', ''),
 ('grupos', 'Maestros › Grupos de vehículos', 'Maestros', 'AEV---', ''),
 ('planes', 'Maestros › Planes preventivos', 'Maestros', 'AEVV--', ''),
 ('paquetes', 'Beta › Paquetes de servicios y productos', 'Beta', 'AEV-V-', 'Beta: Los usa la cajera desde el detalle de la ODS'),
 ('solapes', 'Maestros › Solapamientos de servicios', 'Maestros', 'AEV---', ''),
 ('marcasv', 'Maestros › Marcas de vehículo', 'Maestros', 'AEV---', ''),
 ('series', 'Maestros › Series de comprobantes', 'Maestros', 'A-----', ''),
 ('cajasm', 'Beta › Cajas', 'Beta', 'A-V---', 'Beta'),
 ('catalogo', 'Inventario › Productos y servicios', 'Inventario', 'AVVVA-', 'Precios de venta por local: superusuario y logístico; ajuste de stock con contraseña'),
 ('locales', 'Inventario › Almacenes (locales)', 'Inventario', 'AVV-E-', ''),
 ('movinv', 'Inventario › Movimientos y requerimientos', 'Inventario', 'AEEEA-', 'Solicitan: jefe, cajera y técnico; aceptan: logístico y superusuario'),
 ('kardex', 'Inventario › Kárdex de productos', 'Inventario', 'VV--V-', ''),
 ('marcasp', 'Inventario › Marcas de producto', 'Inventario', 'AVV-E-', ''),
 ('categorias', 'Inventario › Categorías', 'Inventario', 'AVV-E-', ''),
 ('cotizaciones', 'Ingresos › Cotizaciones', 'Ingresos', 'AEEVV-', ''),
 ('notas', 'Ingresos › Emitir comprobante (nota de venta)', 'Ingresos', 'A-E---', ''),
 ('cobrar', 'Ingresos › Cuentas por cobrar', 'Ingresos', 'AVE---', ''),
 ('ing_var', 'Beta › Ingreso (sin comprobante)', 'Beta', 'A-E---', 'Beta: no se implementa en la primera versión; los ingresos se registran desde Bancos'),
 ('compras', 'Egresos › Compras y comprobantes', 'Egresos', 'A---E-', ''),
 ('pagar', 'Egresos › Cuentas por pagar', 'Egresos', 'A-E-E-', 'Paga facturas de compra eligiendo de qué banco sale; la cajera no ve el saldo del banco'),
 ('egr_var', 'Beta › Egreso (sin comprobante)', 'Beta', 'A-E---', 'Beta: no se implementa en la primera versión; los egresos se registran desde Bancos con proveedor'),
 ('citas', 'Seguimiento › Citas', 'Seguimiento', 'AEEV--', ''),
 ('bitacora', 'Seguimiento › Bitácora', 'Seguimiento', 'AEEEEV', 'Todos pueden comentar; nadie borra comentarios ajenos'),
 ('flujo', 'Beta › Flujo de caja', 'Beta', 'A---V-', 'Beta: Flujo diario por rubro, armado con lo que registra el sistema'),
 ('comparativo', 'Beta › Comparativo (estado de resultados)', 'Beta', 'A---V-', 'Beta: Mes a mes en soles y % de las ventas'),
 ('bancos', 'Finanzas › Bancos', 'Finanzas', 'A-E---', 'Cada persona ve las cuentas de su sede (superusuario y finanzas, todas); acciones: movimientos, trasladar, ingreso y egreso'),
 ('rep_post', 'Reportes › Posventa', 'Reportes', 'VVV---', ''),
 ('rep_ventas', 'Reportes › Ventas generales', 'Reportes', 'VV----', ''),
 ('rep_items', 'Reportes › Ventas por ítems', 'Reportes', 'VV----', ''),
 ('rep_ops', 'Reportes › Operaciones', 'Reportes', 'VV----', ''),
 ('rep_rent', 'Reportes › Rentabilidades', 'Reportes', 'V-----', 'Muestra costos y márgenes'),
 ('rep_igv', 'Reportes › IGV y detracciones', 'Reportes', 'V-----', ''),
 ('rep_tec', 'Reportes › Técnicos', 'Reportes', 'VV----', 'Beta'),
 ('rep_gar', 'Reportes › Garantías', 'Reportes', 'VVV---', ''),
 ('automatizaciones', 'Configuración › Automatizaciones', 'Configuración', 'AEV---', ''),
 ('usuarios', 'Configuración › Usuarios', 'Configuración', 'A-----', ''),
 ('ajustes', 'Configuración › Configuración (horarios y avisos)', 'Configuración', 'AV----', ''),
 ('importar', 'Configuración › Carga masiva', 'Configuración', 'A-----', ''),
 ('estados', 'Configuración › Estados de tarea', 'Configuración', 'A-----', ''),
 ('gemini', 'Beta › Asistente Gemini', 'Beta', 'VV----', 'Beta'),
 ('integraciones', 'Beta › Integraciones', 'Beta', 'A-----', 'Beta'),
 ('superusuario', 'Configuración › Configuración de superusuario', 'Configuración', 'A-----', 'APIs de placa y de DNI/RUC, contraseña de inventario, stock negativo e impuestos'),
]
FIN = {'ods': 'V', 'inicio': 'V', 'tareas': 'E', 'clientes': 'V', 'proveedores': 'E', 'vehiculos': 'V', 'catalogo': 'V', 'locales': 'V', 'movinv': 'V', 'kardex': 'V', 'cotizaciones': 'V', 'notas': 'V', 'cobrar': 'E', 'compras': 'E', 'pagar': 'E', 'bitacora': 'V', 'flujo': 'V', 'comparativo': 'V', 'bancos': 'E', 'rep_ventas': 'V', 'rep_items': 'V', 'rep_ops': 'V', 'rep_rent': 'V', 'rep_igv': 'V', 'ajustes': 'V'}
FILAS = [(a, b, c, d + FIN.get(a, '-'), e) for (a, b, c, d, e) in FILAS]
# acciones sensibles: id, texto, roles (índices en ROLES), ¿aplicada en el HTML?
ACCIONES = [
 ('costos', 'Ver costos y márgenes', 'ACLF', True, ''),
 ('precio_local', 'Cambiar el precio de venta por local', 'AL', True, ''),
 ('ajuste_stock', 'Ajuste de inventario (con contraseña)', 'AL', True, ''),
 ('mov_aceptar', 'Aceptar movimientos y requerimientos de inventario', 'AL', True, ''),
 ('mov_pedir', 'Solicitar movimientos y requerimientos', 'AJCT', False, 'La visibilidad del módulo sí se aplica'),
 ('corr_aprobar', 'Aprobar la edición de una ODS cerrada', 'AJ', False, ''),
 ('ods_eliminar', 'Eliminar una ODS', 'A', False, ''),
 ('nota_emitir', 'Emitir nota de venta', 'AC', False, ''),
 ('detra_deposito', 'Registrar el depósito de una detracción', 'A', True, ''),
 ('caja_cerrar', 'Abrir y cerrar caja', 'AC', False, 'Cada cajera opera su caja'),
 ('bancos_ver', 'Ver bancos y montos', 'ACF', True, ''),
 ('api_config', 'Configurar APIs y tokens (placa, DNI/RUC)', 'A', True, 'Solo en Configuración de superusuario'),
 ('impuestos', 'Cambiar IGV, detracción y contraseña de inventario', 'A', True, ''),
 ('usuarios_crear', 'Crear y desactivar usuarios', 'A', True, 'Por la visibilidad del módulo'),
 ('auto_editar', 'Crear y editar automatizaciones', 'AJ', False, 'El jefe de taller puede editarlas en esta propuesta; ajusta si prefieres'),
 ('crm_gestionar', 'Gestionar contactos del CRM y registrar clientes desde ahí', 'AJC', False, ''),
 ('consultar_api', 'Usar «Consultar placa» y «Consultar DNI/RUC»', 'AJC', True, 'Usan el token sin verlo'),
]

NIVEL_TXT = {'A': 'Ver, editar y acciones sensibles', 'E': 'Ver y editar', 'V': 'Solo ver', '-': 'Sin acceso (no aparece)'}


def main():
    datos = {
        'roles': ROLES,
        'rows': [{'id': i, 'label': l, 'group': g, 'lv': lv, 'note': n} for i, l, g, lv, n in FILAS],
        'actions': [{'id': i, 'label': t, 'who': w, 'applied': a, 'note': n} for i, t, w, a, n in ACCIONES],
    }
    for r in datos['rows']:
        assert len(r['lv']) == 7, r
    js = '/* Generado por herramientas/generar_permisos_r77.py: no editar a mano. */\nconst R77_PERM_DATA=' + json.dumps(datos, ensure_ascii=False) + ';\n'
    ruta_js = os.path.join(RAIZ, 'prototipo', 'capas', 'r77', 'ac_permisos_data.js')
    with io.open(ruta_js, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)

    out = []
    w = out.append
    w('# Matriz de permisos del prototipo R7.7')
    w('')
    w('Generado por `herramientas/generar_permisos_r77.py` (no editar a mano). **Es una propuesta del asistente**: quién ve y hace qué lo decide el investigador. El HTML aplica esta misma matriz (módulos visibles, solo lectura y las acciones marcadas «sí» más abajo). El control de acceso del prototipo es de **demostración**: no hay autenticación real ni autorización en el servidor.')
    w('')
    w('## Roles')
    w('')
    w('| Rol | Quién es |')
    w('|---|---|')
    w('| Superusuario (Administrador) | Dueño o administración: ve y hace todo, y es el único que configura APIs, impuestos y la contraseña de inventario |')
    w('| Jefe de taller | Organiza el taller: ODS, citas, agenda y aprobaciones |')
    w('| Cajera | Atiende al cliente, cotiza, cobra y gestiona el CRM |')
    w('| Técnico | Ejecuta los servicios de sus órdenes; ve sus tareas y la agenda |')
    w('| Logístico | Productos, compras, almacenes, precios por local y movimientos de inventario |')
    w('| Técnico externo | Usuario de servicios externos (tornería, plancha y pintura…): solo ve lo que se le asigna |')
    w('')
    w('## Niveles')
    w('')
    for k in 'AEV-':
        w('- **%s** = %s' % (k, NIVEL_TXT[k]))
    w('')
    w('## Módulos por rol')
    w('')
    w('| Módulo | ' + ' | '.join(ABREV) + ' | Nota |')
    w('|---|' + '---|' * 6 + '---|')
    for i, l, g, lv, n in FILAS:
        w('| %s | %s | %s |' % (l, ' | '.join(lv), n))
    w('')
    cont = {k: [sum(1 for f in FILAS if f[3][j] == k) for j in range(7)] for k in 'AEV-'}
    w('### Cuántos módulos ve cada rol')
    w('')
    w('| | ' + ' | '.join(ABREV) + ' |')
    w('|---|' + '---:|' * 6)
    w('| Con acceso (A, E o V) | ' + ' | '.join(str(len(FILAS) - cont['-'][j]) for j in range(7)) + ' |')
    w('| De ellos, con edición (A o E) | ' + ' | '.join(str(cont['A'][j] + cont['E'][j]) for j in range(7)) + ' |')
    w('| Solo lectura (V) | ' + ' | '.join(str(cont['V'][j]) for j in range(7)) + ' |')
    w('| Sin acceso | ' + ' | '.join(str(cont['-'][j]) for j in range(7)) + ' |')
    w('')
    w('## Acciones sensibles')
    w('')
    w('«Aplicada» = el HTML ya lo verifica. «No aplicada» = hoy solo se controla por la visibilidad del módulo; la verificación de la acción queda para el sistema real.')
    w('')
    w('| Acción | ' + ' | '.join(ABREV) + ' | Aplicada en el HTML | Nota |')
    w('|---|' + '---|' * 6 + '---|---|')
    for i, t, wo, a, n in ACCIONES:
        # wo: letras de rol por posición: A,J,C,T,L,X
        marca = ['✔' if 'AJCTLXF'[j] in wo else '—' for j in range(7)]
        w('| %s | %s | %s | %s |' % (t, ' | '.join(marca), 'sí' if a else 'no', n))
    w('')
    w('## Inicio de sesión de demostración')
    w('')
    w('El HTML abre con una pantalla de inicio de sesión. Como no hay autenticación real, trae un bloque **provisional** de botones para ingresar simulando cada rol (superusuario, jefe de taller, cajera, técnico, logístico y técnico externo). El botón «Cambiar usuario» de la barra superior vuelve a esa pantalla. La sesión simulada dura lo que dura la pestaña.')
    w('')
    w('## Decisiones que quedan abiertas')
    w('')
    w('1. ¿El jefe de taller puede crear y editar automatizaciones o solo verlas? (hoy: puede editarlas)')
    w('2. ¿La cajera ve costos y márgenes? (hoy sí, como en R7.6; los técnicos no)')
    w('3. ¿Técnico y técnico externo ven solo lo asignado? (se propone que sí; el HTML lo aplica en la visibilidad del módulo, no fila por fila)')
    w('4. ¿El técnico puede solicitar insumos o herramientas por requerimiento? (hoy sí)')
    w('5. Autenticación y autorización reales (servidor, contraseñas, sesiones): fuera del prototipo.')
    w('')
    ruta = os.path.join(RAIZ, 'docs', 'requisitos', 'MATRIZ_PERMISOS_R77.md')
    with io.open(ruta, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))
    print('filas', len(FILAS), 'acciones', len(ACCIONES))
    print({k: cont[k] for k in cont})


if __name__ == '__main__':
    main()
