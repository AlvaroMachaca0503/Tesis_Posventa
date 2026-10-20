// Capturas de las vistas principales del prototipo R7.7 para la tesis.
// Uso: node capturas_r77.mjs <ruta absoluta a R_Motriz_R7.7.html> <carpeta de salida>
// Solo datos sintéticos: borra en memoria las ODS históricas embebidas en el HTML (traen nombres de personas),
// renombra al superusuario y carga ODS, clientes y vehículos inventados con el propio importador. No guarda nada.
import { chromium } from 'playwright';
import fs from 'fs';
const HTML = process.argv[2], OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
const wait = ms => p.waitForTimeout(ms);
const ev = (f, a) => p.evaluate(f, a);
const lista = [];
const shot = async (n, titulo, rol, h) => { await wait(350); await p.evaluate(() => { const t = document.getElementById('toast'); if (t) t.style.display = 'none'; }); await p.screenshot({ path: `${OUT}/${n}.png`, ...(h ? { clip: { x: 0, y: 0, width: 1440, height: h } } : {}) }); lista.push([n, titulo, rol]); console.log('✔', n); };

// 1) inicio de sesión (sin #sinlogin)
await p.goto('file://' + HTML); await wait(700);
await shot('01_inicio_de_sesion', 'Inicio de sesión provisional con un botón por rol', 'sin sesión');
await p.evaluate(() => { document.getElementById('r77login')?.remove(); });
await p.goto('file://' + HTML + '#sinlogin'); await wait(500);

// 2) estado limpio y datos sintéticos
await ev(() => {
  actor = 'u-admin';
  db.orders = db.orders.filter(o => o.origin !== 'Tuulapp histórico completo');
  db.users.find(u => u.id === 'u-admin').name = 'Superusuario · demo';
  db.suppliers.forEach((s, i) => { s.doc = '2000000000' + (i + 1); });
  const hoy = new Date(today() + 'T12:00:00'), d = n => { const x = new Date(hoy); x.setDate(x.getDate() - n); return x.toLocaleDateString('en-CA'); };
  const marcas = [['KIA', 'PICANTO', 2019], ['HYUNDAI', 'ACCENT', 2018], ['TOYOTA', 'YARIS', 2020], ['CHEVROLET', 'SAIL', 2017], ['NISSAN', 'VERSA', 2021], ['SUZUKI', 'SWIFT', 2016], ['KIA', 'RIO', 2018], ['TOYOTA', 'COROLLA', 2015]];
  const sv = db.catalog.filter(c => c.type === 'servicio' && !c.deleted).slice(0, 6), pr = db.catalog.filter(c => c.type === 'producto' && !c.deleted).slice(0, 6);
  const estados = ['Recepción', 'Recepción', 'En proceso', 'En proceso', 'En proceso', 'Entrega', 'Cerrada', 'Cerrada', 'Cerrada', 'Cerrada', 'Cerrada', 'Cerrada'];
  const rows = [];
  estados.forEach((est, i) => {
    const m = marcas[i % marcas.length], placa = 'DEM-' + (101 + i), cli = 'CLIENTE DEMO ' + String.fromCharCode(65 + i), doc = '0000' + String(1000 + i);
    const s1 = sv[i % sv.length], s2 = sv[(i + 2) % sv.length], p1 = pr[i % pr.length];
    const base = { codigo_ods: String(500100 + i), fecha: d(est === 'Cerrada' ? 4 + i : est === 'Entrega' ? 1 : 0), hora: '0' + (8 + (i % 4)) + ':30', placa, kilometraje: 30000 + i * 7300, estado: est, tipo_atencion: i % 3 ? 'Mantenimiento' : 'Correctivo', motivo: i % 3 ? 'Mantenimiento preventivo' : 'Ruido en el tren delantero', sede: i % 4 === 3 ? 'prohogar' : 'union', tecnico_orden: i % 2 ? 'Luis' : 'Juan', asesor: 'Cajera', documento_cliente: doc, nombre_cliente: cli, marca: m[0], modelo: m[1], anio: m[2] };
    rows.push({ ...base, tipo_item: 'servicio', codigo_item: s1.code, item: s1.name, cantidad: s1.hours || 1, precio_unitario: s1.price || 60, costo: '', descuento: 0, tecnico_servicio: i % 2 ? 'Luis' : 'Juan' });
    rows.push({ ...base, tipo_item: 'servicio', codigo_item: s2.code, item: s2.name, cantidad: s2.hours || 1, precio_unitario: s2.price || 50, costo: '', descuento: 0, tecnico_servicio: i % 2 ? 'Juan' : 'Luis' });
    rows.push({ ...base, tipo_item: 'producto', codigo_item: p1.code, item: p1.name, cantidad: 1 + (i % 3), precio_unitario: p1.price || 40, costo: p1.cost || 25, descuento: 0, tecnico_servicio: '' });
  });
  const P = R77_IMP.ordenes.plan({ csv: rows }, 'add'); P.ops.filter(o => o.kind === 'add').forEach(o => o.apply());
  r77Fc(); db.settings.showBeta = true; db.settings.useCajas = false;
});
await ev(() => { r72DemoData(); });          // notas de venta y cobros sintéticos
await ev(() => { r75DemoMetrics(); });       // 12 meses de métricas y encuestas
await ev(() => { r76PostDemo(); const f = document.getElementById('editor'); if (f) f.requestSubmit(); });
await wait(500);
await ev(() => { closeModal(); R77_IMP; });
// compras, pagos y movimientos de banco sintéticos
await ev(() => {
  const sup = db.suppliers[0], hoy = new Date().toISOString();
  db.purchaseInvoices.push({ id: 'inv-d1', code: 'F001-000101', docType: 'Factura', series: 'F001', number: '000101', supplier: sup.id, date: today(), due: today(), branch: 'union', condition: 'Crédito', affectsCash: false, lines: [{ id: 'il1', description: 'Filtro de aceite (demo)', qty: 10, cost: 18, discount: 0 }], total: 180, payments: [{ id: 'ip1', amount: 60, account: 'bank-union', method: 'Transferencia bancaria', date: hoy, actor: 'u-admin', seq: 9001 }] });
  db.bankAccounts.find(a => a.id === 'bank-union').balance -= 60;
  actor = 'u-admin'; r77BankMov('cash-union', 'Ingreso'); let f = document.getElementById('editor'); f.querySelector('[name=amount]').value = '150'; f.querySelector('[name=detail]').value = 'Adelanto de cliente (demo)'; f.requestSubmit();
  r77BankMov('bank-union', 'Egreso'); f = document.getElementById('editor'); f.querySelector('[name=supplier]').value = sup.id; f.querySelector('[name=amount]').value = '80'; f.querySelector('[name=detail]').value = 'Pago de repuestos (demo)'; f.requestSubmit();
  closeModal();
});

// 3) capturas
const vista = async (n, titulo, rol, js, h) => { await ev(js); await shot(n, titulo, rol, h); };
const sup = 'Superusuario';
await ev(() => { R75.open = new Set(['Maestros', 'Inventario', 'Ingresos', 'Egresos', 'Seguimiento', 'Finanzas', 'Reportes', 'Configuración', 'Beta']); go('inicio'); });
await p.setViewportSize({ width: 1440, height: 1250 }); await shot('02_menu_con_beta', 'Menú con todas las secciones; los módulos beta van al final', sup);
await p.setViewportSize({ width: 1440, height: 900 });
await ev(() => { R75.open = new Set(); });
await vista('03_ordenes_de_servicio', 'Órdenes de servicio: lista con estados y filtros', sup, () => { go('ods'); });
await vista('04_detalle_ods', 'Detalle de una orden de servicio', sup, () => { const o = db.orders.find(x => x.state === 'En proceso'); r72OpenOrder(o.id); });
await ev(() => { closeModal(); });
await vista('05_espacio_de_trabajo', 'Espacio de trabajo: carpetas, listas y tareas', sup, () => { go('tareas'); });
await vista('06_agenda_tecnicos', 'Agenda de técnicos', sup, () => { taskView = 'Agenda (técnicos)'; go('tareas'); });
await vista('07_linea_temporal', 'Línea temporal del plan preventivo de un vehículo', sup, () => { go('timeline'); });
await vista('08_automatizaciones', 'Automatizaciones: reglas «Cuando / Y si / Entonces»', sup, () => { R77.tab = 'gestionar'; R77.fs = 'todos'; go('automatizaciones'); });
await vista('09_editor_de_regla', 'Editor de una regla de automatización', sup, () => { r77Edit('sys-km'); });
await ev(() => { closeModal(); });
await vista('10_citas', 'Citas', sup, () => { go('citas'); });
await vista('11_bitacora', 'Bitácora', sup, () => { go('bitacora'); });
await vista('12_cotizaciones', 'Cotizaciones: lista', sup, () => { go('cotizaciones'); });
await p.setViewportSize({ width: 1440, height: 1150 });
await vista('13_cotizacion_nueva', 'Cotización: cargar ítems, agregar ítems, cuadros, lista y totales', sup, () => {
  const v = db.vehicles.find(x => x.plate === 'DEM-101') || db.vehicles[0], q = r73NewQuoteRecord({ client: v.client, vehicle: v.id, branch: 'union' });
  r73OpenQuote(q.id); r77QuoteTab(q.id, 'cot');
  const items = [db.catalog.find(c => c.type === 'servicio' && !c.deleted), db.catalog.filter(c => c.type === 'producto' && !c.deleted)[1], db.catalog.filter(c => c.type === 'producto' && !c.deleted)[2]];
  items.forEach((c, i) => { document.getElementById('r77qc-item').value = r72CatLabel(c); r77QcPick(r72CatLabel(c)); document.getElementById('r77qc-qty').value = i ? '2' : String(c.hours || 1); r77QcAdd(q.id); });
});
await ev(() => { closeModal(); });
await p.setViewportSize({ width: 1440, height: 900 });
await vista('14_emitir_nota_de_venta', 'Emitir comprobante (nota de venta)', sup, () => { newNoteR5(); });
await ev(() => { closeModal(); });
await vista('15_cuentas_por_cobrar', 'Cuentas por cobrar (solo pendientes)', sup, () => { go('cobrar'); });
await vista('16_compras', 'Compras y comprobantes', sup, () => { go('compras'); });
await vista('17_cuentas_por_pagar', 'Cuentas por pagar (solo pendientes)', sup, () => { go('pagar'); });
await vista('18_bancos', 'Bancos: cuentas por sede', sup, () => { go('bancos'); });
await p.click('#view tbody tr:first-child td button').catch(() => {}); await shot('19_bancos_acciones', 'Bancos: acciones de una cuenta (movimientos, trasladar, ingreso, egreso, editar)', sup);
await p.keyboard.press('Escape'); await ev(() => { document.querySelectorAll('.r75-dd,.r77-pop,[data-open]').forEach(x => { x.hidden = true; }); });
await vista('20_movimientos_de_cuenta', 'Movimientos de una cuenta', sup, () => { r73MovList('bank-union'); });
await ev(() => { closeModal(); });
await vista('21_egreso_a_proveedor', 'Egreso desde una cuenta: proveedor, valor y concepto', sup, () => { r77BankMov('bank-union', 'Egreso'); });
await ev(() => { closeModal(); });
await vista('22_productos_y_servicios', 'Inventario: productos y servicios con stock', sup, () => { go('catalogo'); });
await vista('23_kardex', 'Inventario: kárdex de productos', sup, () => { go('kardex'); });
await vista('24_movimientos_y_requerimientos', 'Inventario: movimientos y requerimientos', sup, () => { go('movinv'); });
await vista('25_vehiculos', 'Maestros: vehículos', sup, () => { go('vehiculos'); });
await vista('26_series_por_sede', 'Maestros: series de comprobantes por sede', sup, () => { go('series'); });
await vista('27_reporte_posventa', 'Reporte de posventa', sup, () => { R77.sede = ''; go('rep_post'); });
await vista('28_reporte_ventas_por_sede', 'Reporte de ventas generales con filtro por sede', sup, () => { R77.sede = 'union'; go('rep_ventas'); });
await ev(() => { R77.sede = ''; });
await vista('29_reporte_tecnicos', 'Reporte de técnicos (por el técnico de cada servicio)', sup, () => { go('rep_tec'); });
await vista('30_metricas', 'Métricas: pestaña Principal', sup, () => { R75M.tab = 'principal'; go('inicio'); });
await vista('31_metricas_satisfaccion', 'Métricas: satisfacción del cliente y NPS', sup, () => { R75M.tab = 'satisfaccion'; go('inicio'); });
await ev(() => { R75M.tab = 'principal'; });
await vista('32_encuesta_con_enlace', 'Encuesta de satisfacción con enlace (vista del cliente)', 'cliente', () => { r77SurveyPage(db.orders.find(o => o.state === 'Cerrada' || o.state === 'Archivada').id, true); });
await ev(() => { r77SurveyClose(); });
await ev(() => { R77IMP.ent = 'ordenes'; R77IMP.mode = 'add'; R77IMP.plan = null; go('importar'); });
const csv = ['codigo_ods;fecha;hora;placa;kilometraje;estado;tipo_atencion;motivo;sede;tecnico_orden;asesor;tipo_item;codigo_item;item;cantidad;precio_unitario;costo;descuento;tecnico_servicio;documento_cliente;nombre_cliente;marca;modelo;anio', '700001;2026-10-19;09:00;DEM-201;41000;En proceso;Mantenimiento;Cambio de aceite;union;;;servicio;;CAMBIO DE ACEITE (DEMO);0.75;30;;0;;00000201;CLIENTE DEMO X;KIA;RIO;2018', '700001;2026-10-19;09:00;DEM-201;41000;En proceso;Mantenimiento;Cambio de aceite;union;;;producto;;ACEITE 5W-30 (DEMO);4;38;28;0;;00000201;CLIENTE DEMO X;KIA;RIO;2018', '700002;2026-10-19;10:30;DEM-202;66000;Recepción;Correctivo;Revisión de frenos;prohogar;;;servicio;;REVISIÓN DE FRENOS (DEMO);1;45;;0;;00000202;CLIENTE DEMO Y;TOYOTA;YARIS;2020'].join('\n');
await p.setInputFiles('#view .r77-imp input[type=file]', { name: 'ordenes_demo.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) }); await wait(500);
await shot('33_carga_masiva_de_ods', 'Carga masiva de órdenes de servicio: vista previa antes de aplicar', sup);
await ev(() => { R77IMP.plan = null; R77IMP.ent = 'grupos'; });
await vista('34_empresa', 'Configuración › Empresa: nombre, logo, cuentas y formato de documentos', sup, () => { go('ajustes'); });
await vista('35_gestion_espacio_trabajo', 'Configuración › Gestión del espacio de trabajo (estados de tarea)', sup, () => { go('estados'); });
await vista('36_flujo_de_caja', 'Beta · Flujo de caja diario (dos columnas por día)', sup, () => { R77F.ym = today().slice(0, 7); go('flujo'); });
await vista('37_api_de_integracion', 'Beta · API de integración (contrato previsto)', sup, () => { go('api'); });
await vista('38_usuarios', 'Configuración: usuarios y roles', sup, () => { go('usuarios'); });
await vista('39_inicio_finanzas', 'Rol «Asistente administrativo de finanzas»: Bancos y pagos', 'finanzas', () => { actor = 'u-finanzas'; go('bancos'); });
await vista('40_inicio_cajera', 'Rol Cajera: cuentas de su sede', 'cajera', () => { actor = 'u-caja'; go('bancos'); });
await ev(() => { actor = 'u-admin'; });

fs.writeFileSync(`${OUT}/INDICE_CAPTURAS.md`, '# Capturas del prototipo R7.7\n\nGeneradas con `prototipo/pruebas/capturas_r77.mjs` sobre `R_Motriz_R7.7.html`. **Prototipo HTML local con datos sintéticos (placas DEM, «Cliente demo»); no es el sistema real.**\n\n| Archivo | Vista | Rol |\n|---|---|---|\n' + lista.map(l => `| ${l[0]}.png | ${l[1]} | ${l[2]} |`).join('\n') + '\n');
console.log('capturas', lista.length, 'errores JS', errs.length, errs.slice(0, 3));
await b.close();
