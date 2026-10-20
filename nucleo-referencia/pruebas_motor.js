'use strict';
// Pruebas del motor R8 (Node). Ejecutar: node pruebas_motor.js   (requiere haber corrido src/build.py)
const assert = require('assert');
const M = require('./src/motor.build.js');
const resultados = [];
const prueba = (nombre, fn) => { try { fn(); resultados.push({ nombre, ok: true }); } catch (e) { resultados.push({ nombre, ok: false, error: e.message.split('\n').slice(0,6).join(' ⏎ ') }); } };
const S = () => M.nuevoSistemaDemo();
const veh = (s, p) => s.ServicioVehiculos.buscarPorPlaca(p);
const prox = (s, p, nombre, modo) => { const t = s.ServicioLineaTemporal.construir(veh(s, p).id, null, null, modo); return t.proyectados.find(x => x.regla.nombre === nombre); };
const nuevaODS = (s, placa, fecha, km, lineas, uid = 'u-caj') => {
  const o = s.ServicioODS.crearODS(veh(s, placa).id, { fecha, km, lineas }, uid);
  s.ServicioODS.avanzarEstado(o.id, 'EN_PROCESO', uid); s.ServicioODS.avanzarEstado(o.id, 'ENTREGA', uid);
  return s.ServicioODS.archivar(o.id, { usuarioId: uid }, 'k-' + o.id);
};

prueba('T01 búsqueda por placa normalizada (guiones/espacios/minúsculas)', () => { const s = S(); assert(veh(s, 'dem-101') && veh(s, 'DEM 101') && veh(s, 'DEM101')); assert.strictEqual(veh(s, 'ZZZ-999'), null); });
prueba('T02 campos faltantes se declaran, no se inventan', () => { const s = S(); const f = M.camposFaltantes(veh(s, 'DEM-404')); assert(f.includes('codigoMotor') && f.includes('anio') && f.includes('perfilUso')); });
prueba('T03 vehículo sin coincidencia única no recibe plan (pendiente de validar)', () => {
  const s = S(); const v = veh(s, 'DEM-404'); assert.deepStrictEqual(s.ServicioPlanes.evaluarAplicabilidad(v.id), []);
  assert.throws(() => s.ServicioPlanes.asignarPlan(v.id, 'G2-PIC@v1', 'u-jef'), /pendiente de validar/);
  assert(s.ServicioLineaTemporal.construir(v.id, null, null).advertencias[0].includes('sin plan'));
});
prueba('T04 coincidencia PARCIAL (falta motor) no autoriza asignación', () => {
  const s = S(); const v = veh(s, 'DEM-404'); v.marca = 'Kia'; v.modelo = 'Picanto'; v.perfilUso = 'NORMAL';
  const ev = s.ServicioPlanes.evaluarAplicabilidad(v.id); assert.strictEqual(ev[0].resultado, 'PARCIAL');
  assert.throws(() => s.ServicioPlanes.asignarPlan(v.id, 'G2-PIC@v1', 'u-jef'), /no es suficiente/);
});
prueba('T05 solo JEFE_TALLER/EXPERTO asignan plan (cajera denegada)', () => { const s = S(); const v = veh(s, 'DEM-404'); v.marca = 'Kia'; v.modelo = 'Picanto'; v.codigoMotor = 'G3LA'; v.perfilUso = 'NORMAL'; assert.throws(() => s.ServicioPlanes.asignarPlan(v.id, 'G2-PIC@v1', 'u-caj'), /Permiso denegado/); });
prueba('T06 línea temporal separa proyectados (arriba) de ODS reales (abajo)', () => { const s = S(); const t = s.ServicioLineaTemporal.construir(veh(s, 'DEM-101').id, null, null); assert(t.proyectados.length === 12 && t.ejecutados.length === 4 && t.ejecutados.every(o => o.estado === 'ARCHIVADA')); assert.strictEqual(t.kmEsEstimado, true); });
prueba('T07 sin intervalo documentado => SIN_INTERVALO, nunca interpolado', () => { const s = S(); const p = prox(s, 'DEM-101', 'Aceite de caja manual'); assert.strictEqual(p.proximo.estado, 'SIN_INTERVALO'); assert(p.proximo.km === undefined); });
prueba('T08 sin evidencia previa => SIN_REGISTRO (no se declara VENCIDO)', () => { const s = S(); assert.strictEqual(prox(s, 'DEM-101', 'Servicio del sistema de combustible').proximo.estado, 'SIN_REGISTRO'); });
prueba('T09 primera proyección pendiente VENCIDO y ciclos siguientes CONDICIONAL (no repetidos como vencidos)', () => {
  const s = S(); const p = prox(s, 'DEM-202', 'Cambio de aceite de motor');
  assert.strictEqual(p.proximo.estado, 'VENCIDO'); assert(p.ciclos.length >= 1 && p.ciclos.every(c => c.estado === 'CONDICIONAL'));
});
prueba('T10 vence lo que ocurra primero: tiempo (severo, 1 mes) antes que km', () => { const s = S(); const p = prox(s, 'DEM-202', 'Cambio de aceite de motor').proximo; assert.strictEqual(p.criterio, 'tiempo'); assert.strictEqual(p.fecha, '2026-06-15'); assert.strictEqual(p.detalleVencimiento, 'por tiempo'); });
prueba('T11 aceite sintético usa 7.500 km (R5); semisintético 5.000', () => { const s = S(); assert.strictEqual(prox(s, 'DEM-202', 'Cambio de aceite de motor').proximo.km, 90500 + 7500); assert.strictEqual(prox(s, 'DEM-101', 'Cambio de aceite de motor').proximo.km, 70400 + 5000); });
prueba('T12 aceite NO especificado: política R5 => 5.000 km (supuesto) ; política sin_intervalo => SIN_INTERVALO', () => {
  const s = S(); assert.strictEqual(prox(s, 'DEM-303', 'Cambio de aceite de motor').proximo.km, 43300 + 5000);
  s.db.config.politicaAceiteNoEspecificado = 'sin_intervalo'; assert.strictEqual(prox(s, 'DEM-303', 'Cambio de aceite de motor').proximo.estado, 'SIN_INTERVALO');
});
prueba('T13 inspección de frenos NO cumple «Cambio de líquido de frenos» (Yaris)', () => {
  const s = S(); assert.strictEqual(prox(s, 'DEM-303', 'Cambio de líquido de frenos').proximo.estado, 'SIN_REGISTRO');
  const o = nuevaODS(s, 'DEM-303', '2026-10-14', 43900, [{ descripcion: 'Revisión de frenos', accion: 'INSPECCION' }]);
  assert(o.analisisPlan.some(a => a.estado === 'SIN_REGLA')); assert.strictEqual(s.db.reajustes.filter(r => r.reglaNombre === 'Cambio de líquido de frenos').length, 0);
  const o2 = nuevaODS(s, 'DEM-303', '2026-10-15', 44000, [{ descripcion: 'Revisión del líquido de frenos', accion: 'INSPECCION' }]);
  assert(o2.analisisPlan.some(a => a.estado === 'NO_CUMPLE_ACCION'), 'inspección del líquido no equivale a cambiarlo'); assert.strictEqual(s.db.reajustes.filter(r => r.reglaNombre === 'Cambio de líquido de frenos').length, 0);
});
prueba('T14 operación autónoma conserva su intervalo; revisionIndex no se inventa', () => { const s = S(); const t = s.ServicioLineaTemporal.construir(veh(s, 'DEM-101').id, null, null); const cab = t.proyectados.find(x => x.regla.nombre.startsWith('Servicio de cabina')); assert.strictEqual(cab.regla.tipo, 'AUTONOMA'); assert(t.proyectados.every(p => p.proximo.revisionIndex === null)); });
prueba('T15 ODS ejecutada genera propuesta; NO cambia la programación hasta aprobar', () => {
  const s = S(); const antes = prox(s, 'DEM-101', 'Cambio de aceite de motor').proximo.km;
  nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]);
  const r = s.db.reajustes.find(x => x.reglaNombre === 'Cambio de aceite de motor'); assert.strictEqual(r.estado, 'PENDIENTE'); assert.strictEqual(r.despues.km, 74900 + 5000);
  assert.strictEqual(prox(s, 'DEM-101', 'Cambio de aceite de motor').proximo.km, antes); assert.strictEqual(prox(s, 'DEM-101', 'Cambio de aceite de motor').reajustesPendientes.length, 1);
});
prueba('T16 aprobar reajuste mueve SOLO el futuro de esa regla; demás reglas y pasado intactos', () => {
  const s = S(); const t0 = s.ServicioLineaTemporal.construir(veh(s, 'DEM-101').id, null, null);
  nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]);
  const r = s.db.reajustes.find(x => x.reglaNombre === 'Cambio de aceite de motor'); s.MotorPlanes.aprobarReajuste(r.id, 'u-jef', 'ok');
  const t1 = s.ServicioLineaTemporal.construir(veh(s, 'DEM-101').id, null, null);
  t1.proyectados.forEach((p, i) => { const q = t0.proyectados[i]; if (p.regla.nombre === 'Cambio de aceite de motor') assert.strictEqual(p.proximo.km, 79900); else { assert.deepStrictEqual([p.proximo.estado, p.proximo.km ?? null], [q.proximo.estado, q.proximo.km ?? null], p.regla.nombre); if (p.proximo.criterio === 'tiempo') assert.strictEqual(p.proximo.fecha, q.proximo.fecha, p.regla.nombre); } });
  assert.strictEqual(t0.ejecutados.length + 1, t1.ejecutados.length);
});
prueba('T17 el plan base es inmutable y comparable tras el reajuste', () => {
  const s = S(); const a = s.ServicioPlanes.asignacionVigente(veh(s, 'DEM-101').id);
  nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]);
  s.MotorPlanes.aprobarReajuste(s.db.reajustes[0].id, 'u-exp', 'ok');
  assert(Object.isFrozen(a.baseSnapshot)); assert.throws(() => { 'use strict'; a.baseSnapshot.uso = 'X'; });
  const cmp = s.ServicioLineaTemporal.compararConBase(a.id, null, null), c = cmp.find(x => x.nombre === 'Cambio de aceite de motor');
  assert(c.cambio && c.base.km === 75400 && c.actual.km === 79900); assert.strictEqual(cmp.filter(x => x.cambio).length, 1);
});
prueba('T18 cajera no aprueba reajustes; técnico tampoco', () => { const s = S(); nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]); const id = s.db.reajustes[0].id; assert.throws(() => s.MotorPlanes.aprobarReajuste(id, 'u-caj', ''), /Permiso denegado/); assert.throws(() => s.MotorPlanes.aprobarReajuste(id, 'u-tec1', ''), /Permiso denegado/); });
prueba('T19 reproponer con la misma clave es idempotente (sin duplicados)', () => { const s = S(); const o = nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]); const n = s.db.reajustes.length; s.MotorPlanes.proponerReajuste(o.id, null, null); s.ServicioODS.archivar(o.id, { usuarioId: 'u-caj' }, 'k-' + o.id); assert.strictEqual(s.db.reajustes.length, n); assert.strictEqual(s.db.seguimientos.filter(x => x.ordenId === o.id).length, 1); });
prueba('T20 ODS anterior al ancla vigente no mueve el futuro (backfill histórico)', () => { const s = S(); const o = nuevaODS(s, 'DEM-101', '2026-03-01', 63000, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]); assert(o.analisisPlan.some(a => a.estado === 'ANTERIOR_AL_ANCLA')); assert.strictEqual(s.db.reajustes.length, 0); });
prueba('T21 sin km en la ODS y regla solo por km => ABSTENIDO', () => { const s = S(); nuevaODS(s, 'DEM-202', '2026-10-14', null, [{ descripcion: 'Servicio de frenos', accion: 'SERVICIO_GENERAL' }]); const r = s.db.reajustes.find(x => x.reglaNombre === 'Servicio de frenos'); assert.strictEqual(r.estado, 'ABSTENIDO'); });
prueba('T22 acción inferida/desconocida no reajusta: abstención', () => { const s = S(); nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Aceite motor' }]); const r = s.db.reajustes.find(x => x.reglaNombre === 'Cambio de aceite de motor'); assert.strictEqual(r.estado, 'ABSTENIDO'); });
prueba('T23 reaprobación: solo ítem NUEVO revierte APROBADA→PENDIENTE; editar no', () => { const s = S(); const o = s.ServicioODS.crearODS(veh(s, 'DEM-101').id, { fecha: '2026-10-15', km: 1, lineas: [{ descripcion: 'Servicio de frenos' }] }, 'u-caj'); s.ServicioODS.registrarDecision(o.id, 'APROBADA', 'u-caj'); o.lineas[0].cantidad = 3; assert.strictEqual(o.decisionCliente, 'APROBADA'); s.ServicioODS.agregarLinea(o.id, { descripcion: 'Bujías' }, 'u-caj'); assert.strictEqual(o.decisionCliente, 'PENDIENTE'); });
prueba('T24 retirar línea conserva historia y exige motivo', () => { const s = S(); const o = s.ServicioODS.crearODS(veh(s, 'DEM-101').id, { fecha: '2026-10-15', lineas: [{ descripcion: 'A' }] }, 'u-caj'); assert.throws(() => s.ServicioODS.retirarLinea(o.id, o.lineas[0].id, ''), /motivo/); s.ServicioODS.retirarLinea(o.id, o.lineas[0].id, 'cliente retira'); assert(o.lineas.length === 1 && !o.lineas[0].activa); });
prueba('T25 estados de ODS: no se salta Entrega; no se archiva desde Recepción salvo NO_APROBADA; reabrir/corregir solo admin', () => {
  const s = S(); const o = s.ServicioODS.crearODS(veh(s, 'DEM-101').id, { fecha: '2026-10-15', lineas: [{ descripcion: 'Servicio de frenos' }] }, 'u-caj');
  assert.throws(() => s.ServicioODS.avanzarEstado(o.id, 'ENTREGA', 'u-caj'), /Transición inválida/); assert.throws(() => s.ServicioODS.archivar(o.id, { usuarioId: 'u-caj' }, 'x'), /No se puede archivar/);
  s.ServicioODS.registrarDecision(o.id, 'NO_APROBADA', 'u-caj'); s.ServicioODS.archivar(o.id, { usuarioId: 'u-caj' }, 'x'); assert.strictEqual(o.estado, 'ARCHIVADA');
  assert.throws(() => s.ServicioODS.reabrir(o.id, 'm', 'u-caj'), /Permiso denegado/); s.ServicioODS.reabrir(o.id, 'continúa', 'u-adm'); assert.strictEqual(o.estado, 'EN_PROCESO');
});
prueba('T26 corregirArchivada exige admin y motivo y NO reactiva', () => { const s = S(); const o = s.db.ordenes[0]; assert.throws(() => s.ServicioODS.corregirArchivada(o.id, { km: 61300, usuarioId: 'u-caj' }, 'x'), /Permiso denegado/); assert.throws(() => s.ServicioODS.corregirArchivada(o.id, { km: 61300 }, ''), /motivo/); s.ServicioODS.corregirArchivada(o.id, { km: 61300 }, 'error de digitación'); assert(o.estado === 'ARCHIVADA' && o.kmIngreso === 61300); });
prueba('T27 importación: perfil reconocido y reimportar el mismo lote NO duplica', () => {
  const s = S(); const l = s.Importador.cargar({ nombre: 'm.csv', texto: M.MUESTRA_VALIDA }, null, 'crear'); assert.strictEqual(l.perfil.id, 'DEMO_plano_ods_v1'); assert(l.validacion.ok);
  const r1 = s.Importador.confirmar(l, 'u-caj').resultado; assert.strictEqual(r1.odsNuevas, 2); const nO = s.db.ordenes.length, nL = s.db.ordenes.reduce((a, o) => a + o.lineas.length, 0), nV = s.db.vehiculos.length;
  const l2 = s.Importador.cargar({ nombre: 'm.csv', texto: M.MUESTRA_VALIDA }, null, 'crear'); const r2 = s.Importador.confirmar(l2, 'u-caj').resultado;
  assert.strictEqual(r2.odsNuevas, 0); assert.strictEqual(r2.odsExistentes, 2); assert.strictEqual(s.db.ordenes.length, nO); assert.strictEqual(s.db.vehiculos.length, nV); assert.strictEqual(s.db.ordenes.reduce((a, o) => a + o.lineas.length, 0), nL);
});
prueba('T28 importación con errores: lote inválido, no aplica y CERO cambios', () => {
  const s = S(); const sinSeq = d => JSON.stringify({ ...d, seq: 0 }); const snap = sinSeq(s.db); const l = s.Importador.cargar({ nombre: 'e.csv', texto: M.MUESTRA_ERRORES }, null, 'crear');
  assert.strictEqual(l.estado, 'CON_ERRORES'); assert(l.validacion.errores.length >= 4); assert.throws(() => s.Importador.confirmar(l, 'u-caj'), /cero cambios/); assert.strictEqual(sinSeq(s.db), snap);
});
prueba('T29 importación: vehículo nuevo con datos faltantes queda sin plan ni uso (no se inventa)', () => { const s = S(); s.Importador.confirmar(s.Importador.cargar({ nombre: 'm.csv', texto: M.MUESTRA_VALIDA }, null, 'crear'), 'u-caj'); const v = veh(s, 'DEM-505'); assert(v && v.perfilUso === null && v.codigoMotor === null); assert(s.ServicioLineaTemporal.construir(v.id, null, null).advertencias.length > 0); });
prueba('T30 importación genera reajuste PENDIENTE para vehículo con plan (ODS más reciente)', () => { const s = S(); s.Importador.confirmar(s.Importador.cargar({ nombre: 'm.csv', texto: M.MUESTRA_VALIDA }, null, 'crear'), 'u-caj'); assert(s.db.reajustes.some(r => r.estado === 'PENDIENTE' && r.reglaNombre === 'Cambio de aceite de motor')); });
prueba('T31 rollback transaccional: error a mitad de aplicación revierte todo', () => {
  const s = S(); const l = s.Importador.cargar({ nombre: 'm.csv', texto: M.MUESTRA_VALIDA }, null, 'crear'); const snap = JSON.stringify(s.db);
  const orig = s.ServicioODS.crearODS.bind(s.ServicioODS); let n = 0; s.ServicioODS.crearODS = (...a) => { if (++n === 2) throw new Error('fallo simulado'); return orig(...a); };
  assert.throws(() => s.Importador.confirmar(l, 'u-caj'), /fallo simulado/); assert.strictEqual(JSON.stringify(s.db), snap);
});
prueba('T32 perfil: encabezados desconocidos => faltantes (mapeo manual requerido)', () => { const s = S(); const p = s.Importador.reconocerPerfil(['a', 'b', 'c']); assert(p.id === null && p.faltantes.length === 5); });
prueba('T33 CSV con separador ; y comillas; km con separador de miles', () => {
  const s = S(); const t = 'ods_id;fecha;placa;km;tipo_linea;descripcion\nZ-1;15/10/2026;DEM-101;"74.900";servicio;"Cambio de aceite; motor"\n'; const l = s.Importador.cargar({ nombre: 'p.csv', texto: t }, null, 'crear');
  assert(l.validacion.ok, JSON.stringify(l.validacion.errores)); assert.strictEqual(l.validacion.ordenes[0].km, 74900); assert.strictEqual(l.validacion.ordenes[0].fecha, '2026-10-15');
});
prueba('T34 modo actualizar reemplaza el detalle sin perder líneas (quedan inactivas)', () => {
  const s = S(); s.Importador.confirmar(s.Importador.cargar({ nombre: 'a.csv', texto: M.MUESTRA_VALIDA }, null, 'crear'), 'u-caj');
  const t2 = 'ods_id,fecha,placa,km,tipo_linea,descripcion\nD-1005,2026-10-10,DEM-101,74100,servicio,Servicio de frenos\n'; s.Importador.confirmar(s.Importador.cargar({ nombre: 'b.csv', texto: t2 }, null, 'actualizar'), 'u-caj');
  const o = s.db.ordenes.find(x => x.codigo === 'D-1005'); assert(o.lineas.filter(l => l.activa).length === 1 && o.lineas.length === 3);
});
prueba('T35 posventa: abrir WhatsApp no acredita contacto; flujo de estados DES-R8-0003', () => {
  const s = S(); const seg = s.ServicioPosventa.asegurarSeguimiento(s.db.ordenes[0].id, 'hito:x'); const w = s.ServicioPosventa.generarEnlaceWhatsApp(seg.id);
  assert(w.url.startsWith('https://wa.me/') && w.envioAutomatico === false); assert.strictEqual(seg.estado, 'PENDIENTE');
  assert.throws(() => s.ServicioPosventa.registrarResultado(seg.id, 'respondio'), /primero un intento/); s.ServicioPosventa.registrarIntento(seg.id, 'whatsapp'); assert.strictEqual(seg.estado, 'INTENTO_REGISTRADO');
  s.ServicioPosventa.registrarResultado(seg.id, 'respondio'); assert.strictEqual(seg.estado, 'CONTACTO_DECLARADO');
});
const prepSeg = s => { const seg = s.ServicioPosventa.asegurarSeguimiento(s.db.ordenes[0].id, 'h1'); s.ServicioPosventa.registrarIntento(seg.id, 'whatsapp'); s.ServicioPosventa.registrarResultado(seg.id, 'respondio'); return seg; };
prueba('T36 cita: solo múltiplos de 15 min, dentro de horario y fuera del descanso', () => {
  const s = S(); const seg = prepSeg(s); const L = [{ descripcion: 'Aceite', duracionHH: 1, tecnicoId: 'u-tec1' }];
  assert.throws(() => s.ServicioCitas.programarCita(seg.id, L, [{ inicio: '2026-10-16T09:10', fin: '2026-10-16T10:10' }]), /15 minutos/);
  assert.throws(() => s.ServicioCitas.programarCita(seg.id, L, [{ inicio: '2026-10-16T07:00', fin: '2026-10-16T08:00' }]), /horario/);
  assert.throws(() => s.ServicioCitas.programarCita(seg.id, L, [{ inicio: '2026-10-16T12:30', fin: '2026-10-16T13:30' }]), /descanso/);
  assert.throws(() => s.ServicioCitas.programarCita(seg.id, [{ ...L[0], duracionHH: 1.1 }], [{ inicio: '2026-10-16T09:00', fin: '2026-10-16T10:00' }]), /0\.25/);
  assert.strictEqual(s.get('seguimientos', seg.id).estado, 'CONTACTO_DECLARADO'); const c = s.ServicioCitas.programarCita(seg.id, L, [{ inicio: '2026-10-16T09:00', fin: '2026-10-16T10:00' }]); assert(c.estado === 'RESERVADA' && s.get('seguimientos', seg.id).estado === 'COMPLETADO_CON_CITA' && s.db.avisos.length === 1);
});
prueba('T37 capacidad simultánea (regla por confirmar): tercera superposición rechazada', () => {
  const s = S(); for (let i = 0; i < 3; i++) { const seg = prepSeg(s); seg.claveEvento += i; const f = () => s.ServicioCitas.programarCita(seg.id, [{ descripcion: 'x', duracionHH: 1, tecnicoId: 'u-tec1' }], [{ inicio: '2026-10-17T09:00', fin: '2026-10-17T10:00' }]); if (i < 2) f(); else assert.throws(f, /simultáneos/); }
});
prueba('T38 llegada de cita => una sola ODS en RECEPCIÓN, idempotente, bloques enlazados', () => {
  const s = S(); const seg = prepSeg(s); const c = s.ServicioCitas.programarCita(seg.id, [{ descripcion: 'Servicio de frenos', duracionHH: 1, tecnicoId: 'u-tec1' }], [{ inicio: '2026-10-16T09:00', fin: '2026-10-16T10:00' }]);
  const nO = s.db.ordenes.length, o1 = s.ServicioCitas.convertirLlegada(c.id, 'k'), o2 = s.ServicioCitas.convertirLlegada(c.id, 'k');
  assert.strictEqual(o1.id, o2.id); assert.strictEqual(s.db.ordenes.length, nO + 1); assert.strictEqual(o1.estado, 'RECEPCION'); assert(s.db.bloques.every(b => b.ordenId === o1.id));
});
prueba('T39 auditoría registra aprobación con antes/después y motivo', () => { const s = S(); nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]); s.MotorPlanes.aprobarReajuste(s.db.reajustes[0].id, 'u-exp', 'validado'); const e = s.db.auditoria.find(a => a.accion === 'aprobar_reajuste'); assert(e && e.motivo === 'validado' && e.antes && e.despues && e.actorId === 'u-exp'); });
prueba('T40 reajuste obsoleto (ancla más reciente) es rechazado al aprobar', () => {
  const s = S(); nuevaODS(s, 'DEM-101', '2026-10-13', 74500, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]); nuevaODS(s, 'DEM-101', '2026-10-14', 74900, [{ descripcion: 'Cambio de aceite de motor', accion: 'SUSTITUCION' }]);
  const [a, b] = s.db.reajustes.filter(r => r.reglaNombre === 'Cambio de aceite de motor'); s.MotorPlanes.aprobarReajuste(b.id, 'u-jef', ''); assert.throws(() => s.MotorPlanes.aprobarReajuste(a.id, 'u-jef', ''), /obsoleto/);
});
const fallos = resultados.filter(r => !r.ok);
resultados.forEach(r => console.log((r.ok ? 'PASÓ   ' : 'FALLÓ  ') + r.nombre + (r.ok ? '' : '\n         → ' + r.error)));
console.log(`\n${resultados.length - fallos.length}/${resultados.length} pruebas del motor pasaron.`);
process.exit(fallos.length ? 1 : 0);
