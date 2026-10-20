# Matriz de permisos del prototipo R7.7

Generado por `herramientas/generar_permisos_r77.py` (no editar a mano). **Es una propuesta del asistente**: quién ve y hace qué lo decide el investigador. El HTML aplica esta misma matriz (módulos visibles, solo lectura y las acciones marcadas «sí» más abajo). El control de acceso del prototipo es de **demostración**: no hay autenticación real ni autorización en el servidor.

## Roles

| Rol | Quién es |
|---|---|
| Superusuario (Administrador) | Dueño o administración: ve y hace todo, y es el único que configura APIs, impuestos y la contraseña de inventario |
| Jefe de taller | Organiza el taller: ODS, citas, agenda y aprobaciones |
| Cajera | Atiende al cliente, cotiza, cobra y gestiona el CRM |
| Técnico | Ejecuta los servicios de sus órdenes; ve sus tareas y la agenda |
| Logístico | Productos, compras, almacenes, precios por local y movimientos de inventario |
| Técnico externo | Usuario de servicios externos (tornería, plancha y pintura…): solo ve lo que se le asigna |

## Niveles

- **A** = Ver, editar y acciones sensibles
- **E** = Ver y editar
- **V** = Solo ver
- **-** = Sin acceso (no aparece)

## Módulos por rol

| Módulo | Superusuario | Jefe de taller | Cajera | Técnico | Logístico | Técnico externo | Asist. adm. finanzas | Nota |
|---|---|---|---|---|---|---|---|
| Órdenes de servicio | A | A | E | V | V | V | V | Técnico y externo ven solo lo asignado; sin costos ni márgenes |
| Métricas | V | V | - | - | - | - | V |  |
| Espacio de trabajo | A | E | E | E | E | E | E | Cada persona ve sus tareas y las de las listas a las que pertenece; incluye la lista CRM |
| Línea temporal | E | E | E | V | - | - | - |  |
| Maestros › Clientes | A | E | E | V | V | - | V |  |
| Maestros › Proveedores | A | V | V | - | E | - | E |  |
| Maestros › Vehículos | A | E | E | V | V | - | V |  |
| Maestros › Grupos de vehículos | A | E | V | - | - | - | - |  |
| Maestros › Planes preventivos | A | E | V | V | - | - | - |  |
| Beta › Paquetes de servicios y productos | A | E | V | - | V | - | - | Beta: Los usa la cajera desde el detalle de la ODS |
| Maestros › Solapamientos de servicios | A | E | V | - | - | - | - |  |
| Maestros › Marcas de vehículo | A | E | V | - | - | - | - |  |
| Maestros › Series de comprobantes | A | - | - | - | - | - | - |  |
| Beta › Cajas | A | - | V | - | - | - | - | Beta |
| Inventario › Productos y servicios | A | V | V | V | A | - | V | Precios de venta por local: superusuario y logístico; ajuste de stock con contraseña |
| Inventario › Almacenes (locales) | A | V | V | - | E | - | V |  |
| Inventario › Movimientos y requerimientos | A | E | E | E | A | - | V | Solicitan: jefe, cajera y técnico; aceptan: logístico y superusuario |
| Inventario › Kárdex de productos | V | V | - | - | V | - | V |  |
| Inventario › Marcas de producto | A | V | V | - | E | - | - |  |
| Inventario › Categorías | A | V | V | - | E | - | - |  |
| Ingresos › Cotizaciones | A | E | E | V | V | - | V |  |
| Ingresos › Emitir comprobante (nota de venta) | A | - | E | - | - | - | V |  |
| Ingresos › Cuentas por cobrar | A | V | E | - | - | - | E |  |
| Beta › Ingreso (sin comprobante) | A | - | E | - | - | - | - | Beta: no se implementa en la primera versión; los ingresos se registran desde Bancos |
| Egresos › Compras y comprobantes | A | - | - | - | E | - | E |  |
| Egresos › Cuentas por pagar | A | - | E | - | E | - | E | Paga facturas de compra eligiendo de qué banco sale; la cajera no ve el saldo del banco |
| Beta › Egreso (sin comprobante) | A | - | E | - | - | - | - | Beta: no se implementa en la primera versión; los egresos se registran desde Bancos con proveedor |
| Seguimiento › Citas | A | E | E | V | - | - | - |  |
| Seguimiento › Bitácora | A | E | E | E | E | V | V | Todos pueden comentar; nadie borra comentarios ajenos |
| Beta › Flujo de caja | A | - | - | - | V | - | V | Beta: Flujo diario por rubro, armado con lo que registra el sistema |
| Beta › Comparativo (estado de resultados) | A | - | - | - | V | - | V | Beta: Mes a mes en soles y % de las ventas |
| Finanzas › Bancos | A | - | E | - | - | - | E | Cada persona ve las cuentas de su sede (superusuario y finanzas, todas); acciones: movimientos, trasladar, ingreso y egreso |
| Reportes › Posventa | V | V | V | - | - | - | - |  |
| Reportes › Ventas generales | V | V | - | - | - | - | V |  |
| Reportes › Ventas por ítems | V | V | - | - | - | - | V |  |
| Reportes › Operaciones | V | V | - | - | - | - | V |  |
| Reportes › Rentabilidades | V | - | - | - | - | - | V | Muestra costos y márgenes |
| Reportes › IGV y detracciones | V | - | - | - | - | - | V |  |
| Reportes › Técnicos | V | V | - | - | - | - | - | Beta |
| Reportes › Garantías | V | V | V | - | - | - | - |  |
| Configuración › Automatizaciones | A | E | V | - | - | - | - |  |
| Configuración › Usuarios | A | - | - | - | - | - | - |  |
| Configuración › Configuración (horarios y avisos) | A | V | - | - | - | - | V |  |
| Configuración › Carga masiva | A | - | - | - | - | - | - |  |
| Configuración › Estados de tarea | A | - | - | - | - | - | - |  |
| Beta › Asistente Gemini | V | V | - | - | - | - | - | Beta |
| Beta › Integraciones | A | - | - | - | - | - | - | Beta |
| Configuración › Configuración de superusuario | A | - | - | - | - | - | - | APIs de placa y de DNI/RUC, contraseña de inventario, stock negativo e impuestos |

### Cuántos módulos ve cada rol

| | Superusuario | Jefe de taller | Cajera | Técnico | Logístico | Técnico externo | Asist. adm. finanzas |
|---|---:|---:|---:|---:|---:|---:|
| Con acceso (A, E o V) | 48 | 31 | 29 | 11 | 18 | 3 | 25 |
| De ellos, con edición (A o E) | 37 | 15 | 15 | 3 | 10 | 1 | 6 |
| Solo lectura (V) | 11 | 16 | 14 | 8 | 8 | 2 | 19 |
| Sin acceso | 0 | 17 | 19 | 37 | 30 | 45 | 23 |

## Acciones sensibles

«Aplicada» = el HTML ya lo verifica. «No aplicada» = hoy solo se controla por la visibilidad del módulo; la verificación de la acción queda para el sistema real.

| Acción | Superusuario | Jefe de taller | Cajera | Técnico | Logístico | Técnico externo | Asist. adm. finanzas | Aplicada en el HTML | Nota |
|---|---|---|---|---|---|---|---|---|
| Ver costos y márgenes | ✔ | — | ✔ | — | ✔ | — | ✔ | sí |  |
| Cambiar el precio de venta por local | ✔ | — | — | — | ✔ | — | — | sí |  |
| Ajuste de inventario (con contraseña) | ✔ | — | — | — | ✔ | — | — | sí |  |
| Aceptar movimientos y requerimientos de inventario | ✔ | — | — | — | ✔ | — | — | sí |  |
| Solicitar movimientos y requerimientos | ✔ | ✔ | ✔ | ✔ | — | — | — | no | La visibilidad del módulo sí se aplica |
| Aprobar la edición de una ODS cerrada | ✔ | ✔ | — | — | — | — | — | no |  |
| Eliminar una ODS | ✔ | — | — | — | — | — | — | no |  |
| Emitir nota de venta | ✔ | — | ✔ | — | — | — | — | no |  |
| Registrar el depósito de una detracción | ✔ | — | — | — | — | — | — | sí |  |
| Abrir y cerrar caja | ✔ | — | ✔ | — | — | — | — | no | Cada cajera opera su caja |
| Ver bancos y montos | ✔ | — | ✔ | — | — | — | ✔ | sí |  |
| Configurar APIs y tokens (placa, DNI/RUC) | ✔ | — | — | — | — | — | — | sí | Solo en Configuración de superusuario |
| Cambiar IGV, detracción y contraseña de inventario | ✔ | — | — | — | — | — | — | sí |  |
| Crear y desactivar usuarios | ✔ | — | — | — | — | — | — | sí | Por la visibilidad del módulo |
| Crear y editar automatizaciones | ✔ | ✔ | — | — | — | — | — | no | El jefe de taller puede editarlas en esta propuesta; ajusta si prefieres |
| Gestionar contactos del CRM y registrar clientes desde ahí | ✔ | ✔ | ✔ | — | — | — | — | no |  |
| Usar «Consultar placa» y «Consultar DNI/RUC» | ✔ | ✔ | ✔ | — | — | — | — | sí | Usan el token sin verlo |

## Inicio de sesión de demostración

El HTML abre con una pantalla de inicio de sesión. Como no hay autenticación real, trae un bloque **provisional** de botones para ingresar simulando cada rol (superusuario, jefe de taller, cajera, técnico, logístico y técnico externo). El botón «Cambiar usuario» de la barra superior vuelve a esa pantalla. La sesión simulada dura lo que dura la pestaña.

## Decisiones que quedan abiertas

1. ¿El jefe de taller puede crear y editar automatizaciones o solo verlas? (hoy: puede editarlas)
2. ¿La cajera ve costos y márgenes? (hoy sí, como en R7.6; los técnicos no)
3. ¿Técnico y técnico externo ven solo lo asignado? (se propone que sí; el HTML lo aplica en la visibilidad del módulo, no fila por fila)
4. ¿El técnico puede solicitar insumos o herramientas por requerimiento? (hoy sí)
5. Autenticación y autorización reales (servidor, contraseñas, sesiones): fuera del prototipo.
