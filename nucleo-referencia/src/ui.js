'use strict';
/* UI R8 — solo presentación. Todas las reglas viven en Motor (motor.js). */
(() => {
  let sys = Motor.nuevoSistemaDemo();
  const ROLES = { CAJERA: 'u-caj', JEFE_TALLER: 'u-jef', EXPERTO: 'u-exp', TECNICO: 'u-tec1', ADMINISTRADOR: 'u-adm' };
  const ui = { vista: 'inicio', placa: '', vehId: null, tab: 'resumen', modo: 'dinamico', horizonte: 30000, tabla: false, lote: null, csv: '', rol: 'CAJERA', msg: null, lineasForm: [{ descripcion: '', accion: 'SUSTITUCION' }] };
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const km = n => (n == null ? '—' : Number(n).toLocaleString('es-PE'));
  const fF = f => (f ? f.slice(8, 10) + '/' + f.slice(5, 7) + '/' + f.slice(0, 4) : '—');
  const uid = () => ROLES[ui.rol];
  const puede = a => sys.ServicioAcceso.puede(uid(), a, 'sede-1');
  const veh = id => sys.get('vehiculos', id);
  const ESTADO = { EJECUTADO: ['ok', '✓ Ejecutado'], PROGRAMADO: ['info', '◇ Programado'], VENCIDO: ['bad', '▲ Vencido'], CONDICIONAL: ['gray', '◌ Condicional'], SIN_REGISTRO: ['warn', '? Sin registro'], SIN_INTERVALO: ['gray', '— Sin intervalo documentado'] };
  const pillE = e => `<span class="pill ${ESTADO[e][0] === 'gray' ? '' : ESTADO[e][0]}">${ESTADO[e][1]}</span>`;
  const toast = (m, err) => { const t = $('#toast'); t.textContent = m; t.className = 'on' + (err ? ' err' : ''); clearTimeout(toast.h); toast.h = setTimeout(() => t.className = '', err ? 6000 : 3500); };
  const intentar = fn => { try { return fn(); } catch (e) { toast(e.message, true); return undefined; } };
  const modal = html => { $('#dlg-body').innerHTML = html; const d = $('#dlg'); if (!d.open) d.showModal(); };

  // -------------------------------------------------------------- navegación
  const VISTAS = [['inicio', 'Inicio'], ['vehiculos', 'Vehículos'], ['reajustes', 'Reajustes'], ['importacion', 'Importación'], ['posventa', 'Posventa'], ['auditoria', 'Auditoría'], ['trazabilidad', 'Trazabilidad']];
  const pendientes = () => sys.db.reajustes.filter(r => r.estado === 'PENDIENTE').length;
  const renderNav = () => { $('#nav').innerHTML = VISTAS.map(([k, t]) => `<button data-act="vista" data-v="${k}" ${ui.vista === k ? 'aria-current="page"' : ''}>${t}${k === 'reajustes' && pendientes() ? `<span class="n" aria-label="${pendientes()} pendientes">${pendientes()}</span>` : ''}</button>`).join(''); };

  // -------------------------------------------------------------- vistas
  const vistaInicio = () => {
    const vs = sys.db.vehiculos, tls = vs.map(v => ({ v, t: sys.ServicioLineaTemporal.construir(v.id, null, null) }));
    const vencidos = tls.filter(x => x.t.proyectados.some(p => p.proximo.estado === 'VENCIDO')).length;
    const sinPlan = vs.filter(v => !sys.ServicioPlanes.asignacionVigente(v.id)).length;
    return `<h1>Núcleo de tesis — placa → plan → línea temporal → reajuste → posventa</h1>
    <p class="sub">Corte de la demo: <b>${fF(sys.db.hoy)}</b>. Esta versión R8 reimplementa solo el núcleo (Capa A de R7). La visión empresarial ampliada (logística, cobros, caja, bancos) permanece en <code>R_Motriz_R7.html</code> y no se mezcla aquí.</p>
    <div class="grid g4" style="margin-top:12px">
      <div class="kpi"><b>${vs.length}</b><span>vehículos sintéticos</span></div>
      <div class="kpi"><b>${vencidos}</b><span>vehículos con servicio VENCIDO</span></div>
      <div class="kpi"><b>${pendientes()}</b><span>reajustes pendientes de validación</span></div>
      <div class="kpi"><b>${sinPlan}</b><span>vehículos sin plan (pendiente de validar)</span></div>
    </div>
    <div class="panel"><h2>Recorrido sugerido</h2>
      <ol><li><b>Vehículos</b>: busque <button data-act="ir-placa" data-p="DEM-101">DEM-101</button> o <button data-act="ir-placa" data-p="DEM-202">DEM-202</button>.</li>
      <li>Abra la pestaña <b>Línea temporal</b>: arriba lo proyectado por regla; abajo las ODS reales.</li>
      <li>En <b>Registrar ODS</b> cargue un cambio de aceite reciente. Se crea una <i>propuesta</i> de reajuste; el plan todavía no cambia.</li>
      <li>En <b>Reajustes</b> cambie el rol a Jefe de taller o Experto y apruebe: solo se mueve esa regla; compare con el <b>plan base congelado</b>.</li>
      <li>En <b>Posventa</b> genere el seguimiento, el enlace de WhatsApp (envío manual), el contacto y la cita.</li>
      <li>En <b>Importación</b> cargue la muestra de CSV y repita la carga para comprobar que no duplica.</li></ol></div>
    <div class="panel"><h2>Qué es y qué no es esta pantalla</h2>
      <ul><li><b>Es</b>: un prototipo navegable de las reglas del núcleo, con pruebas automáticas del motor (40) y un recorrido de navegador.</li>
      <li><b>No es</b>: un sistema productivo, ni valida intervalos mecánicos, ni se conecta a YM/Tuulapp/ToolLab, ni tiene IA entrenada, ni usuarios reales.</li>
      <li>Conflictos abiertos entre fuentes se muestran donde aplican (p. ej. aceite no especificado, almuerzo 13–14 vs 14–15, capacidad simultánea).</li></ul></div>`;
  };

  const listaVehiculos = () => {
    const q = Motor.norm(ui.placa).replace(/[^a-z0-9]/g, '');
    const lista = sys.db.vehiculos.filter(v => !q || Motor.norm(v.placa).replace(/[^a-z0-9]/g, '').includes(q));
    return `<div class="panel"><form id="f-buscar" class="row" role="search"><label>Placa<input name="placa" value="${esc(ui.placa)}" placeholder="p. ej. DEM-101" autocomplete="off" aria-label="Buscar por placa"></label><button class="primary">Buscar</button><span class="sub">La búsqueda es local y normaliza guiones, espacios y mayúsculas.</span></form>
    <div class="scroll" style="margin-top:10px"><table><thead><tr><th>Placa</th><th>Vehículo</th><th>Uso</th><th>Plan</th><th>Datos pendientes</th></tr></thead><tbody>
    ${lista.map(v => { const a = sys.ServicioPlanes.asignacionVigente(v.id), f = Motor.camposFaltantes(v); return `<tr class="click" tabindex="0" data-act="abrir-veh" data-id="${v.id}"><td class="mono"><b>${esc(v.placa)}</b></td><td>${esc((v.marca || '—') + ' ' + (v.modelo || ''))}</td><td>${v.perfilUso ? esc(v.perfilUso.toLowerCase()) : '<span class="pill warn">sin definir</span>'}</td><td>${a ? `<span class="pill ok">${esc(a.versionId)}</span>` : '<span class="pill warn">sin plan</span>'}</td><td>${f.length ? f.map(c => `<span class="pill">${esc(c)}</span>`).join(' ') : '—'}</td></tr>`; }).join('') || '<tr><td colspan="5"><div class="empty">Sin coincidencias. Verifique la placa o impórtela en Importación.</div></td></tr>'}
    </tbody></table></div></div>`;
  };

  const fichaCabecera = v => {
    const a = sys.ServicioPlanes.asignacionVigente(v.id), f = Motor.camposFaltantes(v);
    return `<div class="panel"><div class="row c" style="justify-content:space-between"><div><h2 style="margin:0">${esc(v.placa)} · ${esc((v.marca || '—') + ' ' + (v.modelo || ''))}</h2>
      <div class="sub">${a ? 'Plan ' + esc(a.versionId) + ' asignado por ' + esc(sys.usuario(a.asignadoPor).nombre) + ' el ' + fF(a.fechaBase) : 'Sin plan asignado: plan pendiente de validar'} · uso ${v.perfilUso ? esc(v.perfilUso.toLowerCase()) : 'sin definir'} · aceite ${esc(v.tipoAceite || 'no especificado')}</div></div>
      <button data-act="cerrar-veh">← Lista</button></div>
      ${f.length ? `<div class="note warn">Datos <b>pendientes de verificar</b> (no se inventan): ${f.map(esc).join(', ')}.</div>` : ''}
      <div class="subtabs" role="tablist">${[['resumen', 'Resumen'], ['historial', 'Historial ODS'], ['plan', 'Plan'], ['linea', 'Línea temporal'], ['registrar', 'Registrar ODS']].map(([k, t]) => `<button role="tab" aria-pressed="${ui.tab === k}" data-act="tab" data-t="${k}">${t}</button>`).join('')}</div></div>`;
  };

  const tabResumen = v => {
    const ctx = Motor.contextoKm(sys, v, sys.db.hoy);
    return `<div class="panel"><h3>Perfil operativo</h3><div class="row">
      <label>Perfil de uso<select data-act="set-uso" aria-label="Perfil de uso"><option value="">sin definir</option>${['NORMAL', 'SEVERO'].map(o => `<option ${v.perfilUso === o ? 'selected' : ''} value="${o}">${o.toLowerCase()}</option>`).join('')}</select></label>
      <label>Aceite<select data-act="set-aceite" aria-label="Tipo de aceite"><option value="">no especificado</option>${['Mineral', 'Semisintético', 'Sintético', 'Full sintético'].map(o => `<option ${v.tipoAceite === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <form id="f-km" class="row"><label>Lectura real de km<input name="km" type="number" min="0" placeholder="${ctx.km ? 'est. ' + km(ctx.km) : ''}" value="${v.kmDeclarado ?? ''}"></label><label>Fecha de la lectura<input name="fecha" type="date" value="${v.kmDeclaradoFecha || sys.db.hoy}"></label><button>Guardar lectura</button></form></div>
      <div class="note">Kilometraje actual: <b>${km(ctx.km)} km</b> ${ctx.esEstimado ? '(<b>estimado</b>, no es lectura real)' : '(lectura)'} · tasa ${km(ctx.tasa)} km/mes${ctx.tasaSupuesta ? ' <b>supuesta</b> (historial insuficiente)' : ''}. Última lectura: ${ctx.ultima ? km(ctx.ultima.km) + ' km — ' + esc(ctx.ultima.fuente) + ' (' + fF(ctx.ultima.fecha) + ')' : 'ninguna'}.</div>
      ${v.tipoAceite ? '' : `<div class="note warn">Aceite no especificado: política vigente <b>${esc(sys.db.config.politicaAceiteNoEspecificado === 'R5_5000' ? 'R5 → 5.000 km (supuesto)' : 'sin intervalo')}</b>. El contexto del 29/09 decía «aceite desconocido no implica intervalo»; la decisión R5 (11/10) fija 5.000 km. <label style="display:inline-flex;flex-direction:row;gap:6px;margin-left:8px"><input type="checkbox" data-act="pol-aceite" ${sys.db.config.politicaAceiteNoEspecificado === 'R5_5000' ? 'checked' : ''}> aplicar R5</label></div>`}</div>`;
  };

  const tabHistorial = v => {
    const h = sys.ServicioVehiculos.consultarHistorial(v.id);
    return `<div class="panel"><h3>Historial de ODS (ordenado por fecha y km)</h3><div class="scroll"><table><thead><tr><th>ODS</th><th>Fecha</th><th class="right">Km</th><th>Estado</th><th>Origen</th><th>Líneas</th></tr></thead><tbody>${h.map(o => `<tr><td class="mono"><b>${esc(o.codigo)}</b></td><td>${fF(o.fecha)}</td><td class="right k">${o.kmIngreso == null ? '<span class="pill warn">sin km</span>' : km(o.kmIngreso)}</td><td><span class="pill">${esc(o.estado)}</span></td><td>${esc(o.origenSistema)}</td>
    <td><details><summary>${o.lineas.filter(l => l.activa).length} línea(s)</summary><ul>${o.lineas.map(l => `<li class="${l.activa ? '' : 'mut'}">${esc(l.descripcion)} <span class="pill">${l.tipo === 'PRODUCTO' ? 'producto' : esc(l.accion.toLowerCase())}${l.accionInferida && l.tipo === 'SERVICIO' ? ' · inferida' : ''}</span>${l.activa ? '' : ' (retirada)'}</li>`).join('')}</ul>${(o.analisisPlan || []).length ? `<div class="sub"><b>Análisis contra el plan:</b><ul>${o.analisisPlan.map(a => `<li>${esc(a.estado)}: ${esc(a.detalle)}</li>`).join('')}</ul></div>` : ''}</details></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Sin ODS registradas.</div></td></tr>'}</tbody></table></div></div>`;
  };

  const ivTxt = (iv, ap) => (!iv ? '<span class="mut">sin intervalo documentado</span>' : `${iv.km != null ? km(iv.km) + ' km' : ''}${iv.km != null && iv.meses != null ? ' / ' : ''}${iv.meses != null ? iv.meses + ' meses' : ''}${iv.kmInicial != null ? ` <small>(desde ${km(iv.kmInicial)} km)</small>` : ''}`);
  const tabPlan = v => {
    const a = sys.ServicioPlanes.asignacionVigente(v.id);
    if (!a) {
      const ev = sys.ServicioPlanes.evaluarAplicabilidad(v.id);
      return `<div class="panel"><h3>Plan pendiente de validar</h3><div class="note warn">El vehículo no tiene plan asignado. No se asigna por aproximación: solo una coincidencia <b>suficiente</b> (marca + modelo + motor) puede asignarse y requiere Jefe de taller o Experto.</div>
      ${ev.length ? `<table><thead><tr><th>Plan</th><th>Coincidencia</th><th>Nota</th><th></th></tr></thead><tbody>${ev.map(e => `<tr><td>${esc(e.plan)} <span class="mono">${esc(e.versionId)}</span></td><td><span class="pill ${e.resultado === 'SUFICIENTE' ? 'ok' : 'warn'}">${e.resultado}</span></td><td>${esc(e.nota || '')} ${e.faltantes.length ? 'Faltan: ' + esc(e.faltantes.join(', ')) : ''}</td><td><button data-act="asignar" data-ver="${e.versionId}" ${e.resultado === 'SUFICIENTE' && puede('asignar_plan') ? '' : 'disabled'}>Asignar plan</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Ninguna versión de plan del catálogo demo coincide con este vehículo.</div>'}</div>`;
    }
    const ver = sys.ServicioPlanes.version(a.versionId), snap = a.baseSnapshot;
    return `<div class="panel"><h3>${esc(ver.id)} — ${esc(sys.get('planes', ver.id.split('@')[0]).nombre)}</h3>
      <div class="note warn"><b>Fuente:</b> ${esc(ver.fuente)}. Intervalos <b>no validados</b> por experto mecánico; el campo «tipo» (periódica/autónoma) se interpretó desde R7 y debe confirmarse. Plan base congelado el ${fF(snap?.fecha)} (inmutable); los reajustes aprobados solo mueven el plan dinámico.</div>
      <div class="scroll"><table><thead><tr><th>Operación</th><th>Tipo</th><th>Acción exigida</th><th>Normal</th><th>Severo</th><th>Observación</th></tr></thead><tbody>${ver.reglas.map(r => `<tr><td><b>${esc(r.nombre)}</b><br><small class="mut">${esc(r.categoria)}</small></td><td>${r.tipo === 'PERIODICA' ? 'periódica (malla)' : 'autónoma'}</td><td>${esc(r.accionRequerida.toLowerCase())}</td><td>${ivTxt(r.normal)}</td><td>${ivTxt(r.severo)}</td><td>${r.acompana && !r.normal && !r.severo ? 'acompaña a otra operación; sin intervalo propio' : ''}${r.servicioClave === 'ACEITE_MOTOR' ? 'km ajustado por tipo de aceite (R5)' : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
  };

  // -------- línea temporal
  const lineaTemporal = v => {
    const a = sys.ServicioPlanes.asignacionVigente(v.id);
    if (!a) return `<div class="panel"><div class="empty"><b>Sin proyección.</b> El vehículo no tiene plan asignado (plan pendiente de validar). Se muestran solo las ODS reales en el historial.</div></div>`;
    const t = sys.ServicioLineaTemporal.construir(v.id, null, null, ui.modo === 'base' ? 'base' : 'dinamico');
    const cmp = sys.ServicioLineaTemporal.compararConBase(a.id, null, null);
    const base = ui.modo === 'base';
    const nowKm = t.kmActual;
    // eje
    const kms = [];
    t.ejecutados.forEach(o => o.kmIngreso != null && kms.push(o.kmIngreso));
    if (nowKm != null) kms.push(nowKm);
    const lo = Math.max(0, Math.floor((Math.min(...kms, nowKm ?? 1e9) - 2000) / 5000) * 5000);
    const hi = Math.ceil(((nowKm ?? Math.max(...kms, 0)) + ui.horizonte) / 5000) * 5000;
    const pct = k => ((k - lo) / (hi - lo)) * 100;
    const dentro = k => k != null && k >= lo && k <= hi;
    const paso = (hi - lo) > 60000 ? 10000 : 5000;
    const ticks = []; for (let k = lo; k <= hi; k += paso) ticks.push(k);
    const sinKm = [];
    const mk = (cls, k, txt, sub, attrs) => `<button class="mk ${cls}" style="left:${pct(k).toFixed(2)}%;top:${attrs.top || 6}px" ${attrs.data} aria-label="${esc(attrs.aria)}">${txt}${sub ? `<small>${sub}</small>` : ''}</button>`;
    const filas = t.proyectados.map((p, i) => {
      const r = p.regla, x = p.proximo, c = cmp[i];
      let marks = '';
      if (!base) p.evidencias.forEach(e => { if (dentro(e.km)) marks += mk('ejecutado', e.km, '✓ ' + esc(e.codigo), km(e.km), { aria: `Ejecutado en ODS ${e.codigo} a ${e.km} km`, data: `data-act="abrir-ods" data-id="${e.ordenId}"`, top: 4 }); });
      else p.evidencias.forEach(e => { if (e.fecha <= (a.baseSnapshot?.fecha || '9999') && dentro(e.km)) marks += mk('ejecutado', e.km, '✓ ' + esc(e.codigo), km(e.km), { aria: `Ejecutado ODS ${e.codigo}`, data: `data-act="abrir-ods" data-id="${e.ordenId}"`, top: 4 }); });
      const cls = x.estado === 'VENCIDO' ? 'vencido' : 'programado';
      if (['VENCIDO', 'PROGRAMADO'].includes(x.estado)) { if (x.km != null && dentro(x.km)) marks += mk(cls, x.km, (x.estado === 'VENCIDO' ? '▲ Vencido' : '◇ Próximo'), km(x.km) + ' km<br>' + fF(x.fecha), { aria: `${x.estado} ${x.km} km ${x.fecha || ''}`, data: `data-act="detalle-hito" data-i="${i}" data-n="1"`, top: 4 }); else if (x.km == null) sinKm.push([r.nombre, x]); }
      p.ciclos.forEach((cx, j) => { if (cx.km != null && dentro(cx.km)) marks += mk('condicional', cx.km, '◌ Cond.', km(cx.km) + ' km', { aria: `Ciclo condicional ${cx.km} km`, data: `data-act="detalle-hito" data-i="${i}" data-n="${j + 2}"`, top: 4 }); });
      if (!base && c.cambio && c.base.km != null && dentro(c.base.km)) marks += mk('base', c.base.km, '◇ base', km(c.base.km), { aria: `Plan base: ${c.base.km} km`, data: 'data-act="nada" tabindex="-1"', top: 38 });
      const side = ['SIN_REGISTRO', 'SIN_INTERVALO'].includes(x.estado) ? pillE(x.estado) : (x.km == null && x.fecha ? `${pillE(x.estado)}<br>${fF(x.fecha)} (solo tiempo)` : '');
      return `<div class="tl-row"><div class="tl-label"><b>${esc(r.nombre)}</b><small>${r.tipo === 'PERIODICA' ? 'periódica' : 'autónoma'} · ${p.proximo.intervalo ? esc(ivTxt(p.proximo.intervalo).replace(/<[^>]+>/g, '')) : 'sin intervalo'}</small>${!base && c.cambio ? `<br><span class="pill info">movido vs base</span>` : ''}${p.reajustesPendientes.length ? `<br><button data-act="vista" data-v="reajustes" style="padding:1px 7px;min-height:0">⏳ reajuste pendiente</button>` : ''}</div>
        <div class="tl-track" style="--step:${(paso / (hi - lo) * 100).toFixed(3)}%">${nowKm != null ? `<div class="tl-now" style="left:${pct(nowKm).toFixed(2)}%" title="Km actual"></div>` : ''}${marks}${x.estado === 'SIN_REGISTRO' || x.estado === 'SIN_INTERVALO' ? `<div class="sub" style="padding:8px 12px">${esc(x.motivo)}</div>` : ''}</div><div class="tl-side">${side}</div></div>`;
    }).join('');
    const odsMk = t.ejecutados.filter(o => o.kmIngreso != null && dentro(o.kmIngreso)).map((o, i) => mk('ods', o.kmIngreso, '#' + esc(o.codigo), fF(o.fecha) + '<br>' + km(o.kmIngreso) + ' km', { aria: `ODS ${o.codigo}`, data: `data-act="abrir-ods" data-id="${o.id}"`, top: 4 + (i % 2) * 44 })).join('');
    const odsSin = t.ejecutados.filter(o => o.kmIngreso == null);
    const vistaTabla = `<div class="scroll"><table><thead><tr><th>Operación</th><th>Estado</th><th class="right">Próx. km</th><th>Próx. fecha</th><th>Criterio</th><th>Ancla</th><th>Ciclos condicionales</th><th>Base (congelado)</th></tr></thead><tbody>${t.proyectados.map((p, i) => { const x = p.proximo, c = cmp[i]; return `<tr><td><b>${esc(p.regla.nombre)}</b></td><td>${pillE(x.estado)}${x.detalleVencimiento ? ' ' + esc(x.detalleVencimiento) : ''}</td><td class="right k">${km(x.km)}</td><td>${fF(x.fecha)}</td><td>${esc(x.criterio || '—')}</td><td>${p.ancla ? 'ODS ' + esc(p.ancla.codigo) + ' · ' + fF(p.ancla.fecha) + (p.ancla.km != null ? ' · ' + km(p.ancla.km) + ' km' : '') : '—'}</td><td>${p.ciclos.map(cx => km(cx.km)).join(' · ') || '—'}</td><td>${c.cambio ? km(c.base.km) + ' km → ' + km(c.actual.km) + ' km' : 'sin cambio'}</td></tr>`; }).join('')}</tbody></table></div>`;
    return `<div class="panel"><div class="row c" style="justify-content:space-between"><h3 style="margin:0">Línea temporal</h3>
      <div class="row c"><div class="seg" role="group" aria-label="Versión del plan"><button data-act="modo" data-m="dinamico" aria-pressed="${!base}">Plan dinámico</button><button data-act="modo" data-m="base" aria-pressed="${base}">Plan base congelado</button></div>
      <label style="flex-direction:row;align-items:center;gap:6px">Horizonte<select data-act="horizonte">${[15000, 30000, 60000].map(h => `<option value="${h}" ${ui.horizonte === h ? 'selected' : ''}>+${km(h)} km</option>`).join('')}</select></label>
      <div class="seg" role="group" aria-label="Tipo de vista"><button data-act="vtabla" data-v="0" aria-pressed="${!ui.tabla}">Gráfica</button><button data-act="vtabla" data-v="1" aria-pressed="${ui.tabla}">Tabla</button></div></div></div>
      <div class="grid g4" style="margin-top:10px"><div class="kpi"><b>${km(nowKm)}</b><span>km actual ${t.kmEsEstimado ? '(estimado)' : '(lectura)'}</span></div><div class="kpi"><b>${fF(t.fechaCorte)}</b><span>fecha de corte</span></div><div class="kpi"><b>${km(t.tasa)}</b><span>km/mes ${t.tasaSupuesta ? '(supuesta)' : '(del historial)'}</span></div><div class="kpi"><b>${base ? 'BASE' : 'DINÁMICO'}</b><span>${base ? 'congelado ' + fF(a.baseSnapshot.fecha) : 'con reajustes aprobados'}</span></div></div>
      ${t.advertencias.map(w => `<div class="note warn">${esc(w)}</div>`).join('')}
      <div class="legend" aria-hidden="true"><span class="l1">Ejecutado (ODS)</span><span class="l2">Vencido (primer pendiente)</span><span class="l3">Programado</span><span class="l4">Condicional (presupone atención previa)</span><span>Línea roja = km actual</span></div>
      ${ui.tabla ? vistaTabla : `<div class="scroll"><div class="tl"><div class="tl-head"><div class="tl-label">ARRIBA · Plan (proyección)</div><div class="tl-track" style="min-height:30px;background:none">${ticks.map(k => `<span style="position:absolute;left:${pct(k).toFixed(2)}%;transform:translateX(-50%);top:6px">${km(k)}</span>`).join('')}</div><div class="tl-side">Estado</div></div>
      ${filas}
      <div class="tl-sec">ABAJO · ODS reales (hechos; no se reescriben)</div>
      <div class="tl-row"><div class="tl-label"><b>ODS archivadas</b><small>posición por km de ingreso</small></div><div class="tl-track" style="min-height:96px;--step:${(paso / (hi - lo) * 100).toFixed(3)}%">${nowKm != null ? `<div class="tl-now" style="left:${pct(nowKm).toFixed(2)}%"></div>` : ''}${odsMk}</div><div class="tl-side">${odsSin.map(o => `<button data-act="abrir-ods" data-id="${o.id}" style="padding:2px 6px;min-height:0">#${esc(o.codigo)} sin km</button>`).join('<br>')}</div></div></div></div>`}
      ${sinKm.length ? `<div class="note">Solo por tiempo (ODS ancla sin km): ${sinKm.map(([n, x]) => `${esc(n)} → ${fF(x.fecha)}`).join('; ')}.</div>` : ''}
      <p class="sub">Cada hito conserva su umbral exacto en km y fecha; <b>vence lo que ocurra primero</b>. Las fechas por km son estimaciones a partir de la última lectura y la tasa. Los ciclos «condicional» presuponen que se atienda el pendiente; no son citas ni aprobaciones técnicas.</p></div>`;
  };

  const detalleHito = (i, n) => {
    const v = veh(ui.vehId), t = sys.ServicioLineaTemporal.construir(v.id, null, null, ui.modo === 'base' ? 'base' : 'dinamico'), p = t.proyectados[i], x = n === 1 ? p.proximo : p.ciclos[n - 2];
    modal(`<h2 style="margin:0 0 6px">${esc(p.regla.nombre)}</h2><p>${pillE(x.estado)} ${x.detalleVencimiento ? '· vence ' + esc(x.detalleVencimiento) : ''}</p>
      <ul><li><b>Regla:</b> ${ivTxt(x.intervalo)} <span class="mut">(${esc(x.intervalo?.origen || '')})</span></li>
      <li><b>Umbral exacto:</b> ${km(x.km)} km · ${fF(x.fecha)} · criterio ${esc(x.criterio || '—')}</li>
      <li><b>Ancla:</b> ${x.ancla ? 'ODS ' + esc(x.ancla.codigo) + ' (' + fF(x.ancla.fecha) + (x.ancla.km != null ? ', ' + km(x.ancla.km) + ' km' : ', sin km') + ')' : 'ninguna (km inicial de la ficha)'}</li>
      <li><b>Tipo:</b> ${p.regla.tipo === 'PERIODICA' ? 'periódica (malla); revision_index no disponible en la fuente demo' : 'autónoma: conserva su propio intervalo'}</li></ul>
      <div class="note warn">Proyección derivada de reglas <b>no validadas técnicamente</b>. ${n > 1 ? 'Ciclo condicional: presupone atención del pendiente anterior.' : ''}</div>`);
  };

  const tabRegistrar = v => {
    if (!puede('crear_ods')) return `<div class="panel"><div class="note bad">El rol ${esc(ui.rol)} no puede registrar ODS (cajera, jefe de taller o administrador).</div></div>`;
    const nombres = [...new Set(sys.db.planes.flatMap(p => p.versiones[0].reglas.map(r => r.nombre)))];
    return `<div class="panel"><h3>Registrar ODS ejecutada y archivarla</h3><p class="sub">Recorre los estados Recepción → En proceso → Entrega → Archivada y propone reajustes. <b>El plan no cambia hasta que un Jefe de taller o Experto apruebe.</b></p>
      <form id="f-ods"><div class="row"><label>Fecha<input type="date" name="fecha" value="${sys.db.hoy}" required></label><label>Km de ingreso<input type="number" name="km" min="0" placeholder="vacío = sin km"></label></div>
      <div class="lineas" style="margin-top:12px"><h3>Servicios ejecutados</h3>${ui.lineasForm.map((l, i) => `<div class="ln"><input list="dl-serv" data-linea="${i}" data-campo="descripcion" value="${esc(l.descripcion)}" placeholder="Descripción del servicio" aria-label="Descripción ${i + 1}"><select data-linea="${i}" data-campo="accion" aria-label="Acción ${i + 1}">${['SUSTITUCION', 'INSPECCION', 'SERVICIO_GENERAL'].map(a => `<option value="${a}" ${l.accion === a ? 'selected' : ''}>${a.toLowerCase().replace('_', ' ')}</option>`).join('')}</select><button type="button" data-act="quitar-linea" data-i="${i}" aria-label="Quitar línea">✕</button></div>`).join('')}<datalist id="dl-serv">${nombres.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <button type="button" data-act="mas-linea">+ Servicio</button></div>
      <div class="row" style="margin-top:12px"><button class="primary">Registrar y archivar</button><span class="sub">Prueba: «Cambio de aceite de motor» (sustitución) con km 74.900 mueve solo el aceite; «Revisión de frenos» en un Yaris no reemplaza el cambio de líquido.</span></div></form></div>`;
  };

  const vistaVehiculos = () => {
    if (!ui.vehId) return listaVehiculos();
    const v = veh(ui.vehId);
    return fichaCabecera(v) + ({ resumen: tabResumen, historial: tabHistorial, plan: tabPlan, linea: lineaTemporal, registrar: tabRegistrar }[ui.tab])(v);
  };

  const vistaReajustes = () => {
    const todos = sys.db.reajustes.slice().reverse(), pend = todos.filter(r => r.estado === 'PENDIENTE');
    const fila = r => { const v = veh(sys.get('asignaciones', r.asignacionId).vehiculoId); return `<tr><td class="mono">${esc(v.placa)}</td><td><b>${esc(r.reglaNombre)}</b><br><small class="mut">${esc(r.motivo)}</small></td><td>ODS ${esc(r.evidencia.codigo)}<br><small>${fF(r.evidencia.fecha)} · ${r.evidencia.km != null ? km(r.evidencia.km) + ' km' : 'sin km'}</small></td>
      <td>${r.antes ? `${km(r.antes.km)} km · ${fF(r.antes.fecha)}<br><span class="mut">(${esc(r.antes.estado)})</span>` : '—'}</td><td>${r.despues ? `<b>${km(r.despues.km)} km · ${fF(r.despues.fecha)}</b>` : '—'}</td><td><span class="pill ${r.estado === 'PENDIENTE' ? 'warn' : r.estado === 'APROBADO' ? 'ok' : r.estado === 'ABSTENIDO' ? '' : 'bad'}">${r.estado}</span>${r.aprobadoPor ? '<br><small>' + esc(sys.usuario(r.aprobadoPor).nombre) + '</small>' : ''}</td>
      <td>${r.estado === 'PENDIENTE' ? `<input aria-label="Motivo de la decisión" placeholder="motivo" data-motivo="${r.id}" style="width:130px"><br><button data-act="aprobar" data-id="${r.id}" ${puede('aprobar_reajuste') ? '' : 'disabled title="Requiere Jefe de taller o Experto"'}>Aprobar</button> <button class="danger" data-act="rechazar" data-id="${r.id}" ${puede('aprobar_reajuste') ? '' : 'disabled'}>Rechazar</button>` : (r.estado === 'ABSTENIDO' ? '<small>requiere revisión humana</small>' : '')}</td></tr>`; };
    return `<h1>Reajustes</h1><p class="sub">Regla R7/contexto: el sistema <b>propone</b>; un Jefe de taller o Experto <b>valida</b> antes de modificar la programación. Solo se mueve el futuro de la regla afectada. Si no hay evidencia suficiente, el sistema se abstiene.</p>
    ${!puede('aprobar_reajuste') ? `<div class="note warn">Rol activo: ${esc(ui.rol)}. Cambie a Jefe de taller o Experto para aprobar o rechazar.</div>` : ''}
    <div class="panel"><div class="scroll"><table><thead><tr><th>Placa</th><th>Regla</th><th>Evidencia</th><th>Antes</th><th>Después</th><th>Estado</th><th></th></tr></thead><tbody>${todos.map(fila).join('') || '<tr><td colspan="7"><div class="empty">No hay propuestas. Registre una ODS o importe un lote.</div></td></tr>'}</tbody></table></div><p class="sub">${pend.length} pendiente(s).</p></div>`;
  };

  const vistaImportacion = () => {
    const l = ui.lote;
    const mapeoUI = l && !l.perfil.id ? `<div class="note warn">No se reconoció el perfil. Falta mapear: ${l.perfil.faltantes.map(esc).join(', ')}.</div><div class="row">${Object.keys(Motor.PERFIL.campos).map(c => `<label>${c}<select data-act="mapa" data-c="${c}"><option value="">—</option>${l.encabezados.map((h, i) => `<option value="${i}" ${l.perfil.mapeo[c] === i ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></label>`).join('')}</div><button data-act="reanalizar">Aplicar mapeo y revalidar</button>` : '';
    return `<h1>Importación normalizada e idempotente (CSV demo)</h1><p class="sub">Flujo: reconocer perfil → validar todo → simular → aplicar atómicamente. Un solo error implica <b>cero cambios</b>. Reimportar el mismo lote no duplica. El adaptador XLSX sigue <b>pendiente</b>: este prototipo solo lee CSV.</p>
    <div class="panel"><div class="row"><button data-act="muestra" data-m="ok">Cargar muestra válida</button><button data-act="muestra" data-m="err">Cargar muestra con errores</button><label>…o archivo CSV<input type="file" accept=".csv,text/csv" id="f-csv"></label><label>Modo<select id="modo-imp"><option value="crear">crear (omite ODS existentes)</option><option value="actualizar">actualizar (reemplaza detalle; conserva líneas inactivas)</option></select></label></div>
    <label style="margin-top:10px">Contenido CSV (editable)<textarea id="csv" rows="7" class="mono" spellcheck="false">${esc(ui.csv)}</textarea></label><div class="row" style="margin-top:8px"><button class="primary" data-act="analizar">Analizar lote</button></div></div>
    ${l ? `<div class="panel"><h3>Lote ${esc(l.nombre)} · hash ${esc(l.hash)} <span class="pill ${l.estado === 'VALIDO' || l.estado === 'APLICADO' ? 'ok' : 'bad'}">${l.estado}</span></h3>
      <p>Perfil: <b>${esc(l.perfil.id || 'no reconocido')}</b> · filas originales conservadas: ${l.filasOriginales.length}</p>${mapeoUI}
      ${l.validacion.errores.length ? `<div class="note bad"><b>${l.validacion.errores.length} error(es): cero cambios de negocio.</b></div><table><thead><tr><th>Fila</th><th>Campo</th><th>Mensaje</th></tr></thead><tbody>${l.validacion.errores.map(e => `<tr><td>${e.fila}</td><td>${esc(e.campo)}</td><td>${esc(e.mensaje)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${l.simulacion ? `<div class="grid g4"><div class="kpi"><b>${l.simulacion.odsNuevas}</b><span>ODS nuevas</span></div><div class="kpi"><b>${l.simulacion.odsExistentes}</b><span>ODS ya existentes</span></div><div class="kpi"><b>${l.simulacion.vehiculosNuevos}</b><span>vehículos nuevos (campos faltantes quedan vacíos)</span></div><div class="kpi"><b>${l.simulacion.lineas}</b><span>líneas</span></div></div>` : ''}
      ${l.estado === 'VALIDO' ? `<div class="row" style="margin-top:10px"><button class="primary" data-act="aplicar" ${puede('importar') ? '' : 'disabled title="Requiere cajera o administrador"'}>Aplicar lote (atómico)</button></div>` : ''}
      ${l.estado === 'APLICADO' ? `<div class="note ok">Aplicado: ${l.resultado.odsNuevas} ODS nuevas, ${l.resultado.odsExistentes} existentes, ${l.resultado.vehiculosNuevos} vehículos nuevos, ${l.resultado.reajustesPropuestos} reajuste(s) propuesto(s). <button data-act="reaplicar">Reimportar el mismo archivo (prueba de idempotencia)</button></div>` : ''}</div>` : ''}`;
  };

  const sugerencias = () => {
    const out = [];
    for (const v of sys.db.vehiculos) { const a = sys.ServicioPlanes.asignacionVigente(v.id); if (!a) continue; const t = sys.ServicioLineaTemporal.construir(v.id, null, null);
      for (const p of t.proyectados) { const x = p.proximo; const cercano = x.estado === 'VENCIDO' || (x.estado === 'PROGRAMADO' && ((x.km != null && t.kmActual != null && x.km - t.kmActual <= 1000) || (x.fecha && x.fecha <= Motor.addDays(sys.db.hoy, 30)))); if (cercano && p.ancla) out.push({ v, p, x }); } }
    return out;
  };
  const vistaPosventa = () => {
    const sg = sugerencias(), segs = sys.db.seguimientos.slice().reverse(), cit = sys.db.citas.slice().reverse();
    const tecs = sys.db.usuarios.filter(u => u.rol === 'TECNICO');
    return `<h1>Posventa</h1><p class="sub">Seguimiento → intento → contacto declarado → cita → llegada convertida en ODS. Abrir WhatsApp <b>no</b> acredita envío ni respuesta; hay que registrar el intento y el resultado.</p>
    ${!puede('posventa') ? `<div class="note warn">Rol ${esc(ui.rol)}: acciones de contacto reservadas a cajera/administrador (simulado en el navegador).</div>` : ''}
    <div class="panel"><h3>Sugerencias del plan (vencidos o próximos)</h3>${sg.length ? `<table><thead><tr><th>Placa</th><th>Operación</th><th>Estado</th><th>Umbral</th><th></th></tr></thead><tbody>${sg.map((s, i) => `<tr><td class="mono">${esc(s.v.placa)}</td><td>${esc(s.p.regla.nombre)}</td><td>${pillE(s.x.estado)}</td><td>${km(s.x.km)} km · ${fF(s.x.fecha)}</td><td><button data-act="crear-seg" data-i="${i}" ${puede('posventa') ? '' : 'disabled'}>Crear seguimiento</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Sin hitos vencidos o próximos con ancla.</div>'}</div>
    <div class="panel"><h3>Seguimientos</h3>${segs.length ? segs.map(x => { const v = veh(x.vehiculoId); return `<div class="panel" style="margin:8px 0"><div class="row c" style="justify-content:space-between"><div><b class="mono">${esc(v.placa)}</b> <span class="pill ${x.estado.startsWith('COMPLETADO') ? 'ok' : 'warn'}">${x.estado}</span> <small class="mut">${esc(x.origen)} · vence ${fF(x.vence)}</small></div>
      <div class="row c"><button data-act="wa" data-id="${x.id}" ${puede('posventa') ? '' : 'disabled'}>Preparar WhatsApp</button><button data-act="intento" data-id="${x.id}" ${puede('posventa') && ['PENDIENTE', 'INTENTO_REGISTRADO'].includes(x.estado) ? '' : 'disabled'}>Registrar intento</button>
      <select data-act="resultado" data-id="${x.id}" aria-label="Registrar resultado" ${puede('posventa') && ['INTENTO_REGISTRADO', 'CONTACTO_DECLARADO'].includes(x.estado) ? '' : 'disabled'}><option value="">Resultado…</option><option value="respondio">El cliente respondió</option><option value="sin_respuesta_2do">Segundo intento sin respuesta</option><option value="nuevo_intento">Se acuerda nuevo intento</option><option value="no_requiere_cita">No requiere cita</option></select></div></div>
      ${x.estado === 'CONTACTO_DECLARADO' && puede('citas') ? `<form class="row" data-form="cita" data-id="${x.id}" style="margin-top:8px"><label>Fecha<input type="date" name="fecha" required></label><label>Inicio<input type="time" name="hora" step="900" value="09:00" required></label><label>Duración (H-H, múltiplo de 0.25)<input type="number" name="hh" step="0.25" min="0.25" value="1" required></label><label>Servicio<input name="serv" value="Servicio de revisión" required></label><label>Técnico<select name="tec">${tecs.map(t => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select></label><button class="primary">Programar cita</button></form>` : ''}</div>`; }).join('') : '<div class="empty">Sin seguimientos. Se crean al archivar una ODS o desde las sugerencias.</div>'}</div>
    <div class="panel"><h3>Citas</h3>${cit.length ? `<table><thead><tr><th>Placa</th><th>Inicio</th><th>Servicios</th><th>Estado</th><th></th></tr></thead><tbody>${cit.map(c => `<tr><td class="mono">${esc(veh(c.vehiculoId).placa)}</td><td>${fF(c.inicio.slice(0, 10))} ${c.inicio.slice(11)}</td><td>${c.lineas.map(l => esc(l.descripcion) + ' (' + l.duracionHH + ' H-H)').join(', ')}</td><td><span class="pill">${c.estado}</span>${c.ordenId ? ' → ODS ' + esc(sys.get('ordenes', c.ordenId).codigo) : ''}</td><td><button data-act="llegada" data-id="${c.id}" ${c.estado === 'LLEGADA_CONVERTIDA' || !puede('citas') ? 'disabled' : ''}>Llegó: crear ODS</button></td></tr>`).join('')}</tbody></table><p class="sub">Agenda en múltiplos de 15 min; horario ${sys.db.config.horario.ini}:00–${sys.db.config.horario.fin}:00, descanso ${sys.db.config.horario.descIni}:00–${sys.db.config.horario.descFin}:00 (R5; el seed R7 decía 14–15: conflicto abierto); máximo ${sys.db.config.capacidadSimultanea} simultáneos por técnico (regla por confirmar).</p>` : '<div class="empty">Sin citas.</div>'}</div>`;
  };

  const vistaAuditoria = () => `<h1>Auditoría</h1><div class="panel"><div class="scroll"><table><thead><tr><th>#</th><th>Actor</th><th>Acción</th><th>Motivo</th><th>Antes</th><th>Después</th></tr></thead><tbody>${sys.db.auditoria.slice().reverse().map(e => `<tr><td class="mono">${esc(e.id)}</td><td>${esc(e.actorId)}</td><td>${esc(e.accion)}</td><td>${esc(e.motivo || '—')}</td><td><code>${esc(JSON.stringify(e.antes) || '—').slice(0, 140)}</code></td><td><code>${esc(JSON.stringify(e.despues) || '—').slice(0, 140)}</code></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Aún sin eventos desde el inicio de la demo.</div></td></tr>'}</tbody></table></div></div>`;

  const TRAZA = [
    ['RF-04', 'Consultar por placa', 'Vehículos', 'ServicioVehiculos.buscarPorPlaca', 'T01, T02'], ['RF-03', 'Vehículo sin inventar faltantes', 'Ficha / Resumen', 'Vehiculo.camposFaltantes', 'T02, T29'],
    ['RF-09/10/25/26', 'Perfil XLSX/CSV, atómico e idempotente', 'Importación', 'Importador.cargar · ValidadorLote.validarTodo · AplicadorLote.aplicarAtomico', 'T27–T34'], ['RF-11', 'Normalizar servicios con evidencia', 'Historial', 'NormalizadorServicios.resolverEquivalencia', 'T13, T22'],
    ['RF-13/14', 'Aplicabilidad y asignación explícita', 'Plan', 'ServicioPlanes.evaluarAplicabilidad / asignarPlan', 'T03–T05'], ['RF-15', 'Línea temporal (proyectado arriba, real abajo)', 'Línea temporal', 'ServicioLineaTemporal.construir', 'T06–T12, T14'],
    ['RF-16', 'Reajustar solo el futuro', 'Reajustes', 'MotorPlanes.proponerReajuste / aprobarReajuste', 'T15–T22, T39, T40'], ['RF-17', 'Plan base inmutable / versionado', 'Plan', 'Asignacion.congelarBase · ServicioPlanes.publicarVersion', 'T17'],
    ['RF-05/07/28/29', 'ODS, estados, corrección y reapertura', 'Registrar ODS', 'ServicioODS.crearODS/avanzarEstado/archivar/corregirArchivada/reabrir', 'T23–T26'], ['RF-63/64/65', 'Decisión global y reaprobación por ítem nuevo', '(motor)', 'ServicioODS.registrarDecision/agregarLinea/retirarLinea', 'T23, T24'],
    ['RF-18/19/36', 'Seguimiento y WhatsApp manual', 'Posventa', 'ServicioPosventa.*', 'T35'], ['RF-20/39–44', 'Citas, 15 min, capacidad, llegada → ODS', 'Posventa', 'ServicioCitas.* · Planificador.validarCapacidad', 'T36–T38'], ['RF-21', 'Auditoría', 'Auditoría', 'RegistroAuditoria.registrar', 'T39'], ['RF-23', 'Roles (simulados)', 'Cabecera', 'ServicioAcceso.puede', 'T05, T18, T25'],
  ];
  const vistaTraza = () => `<h1>Trazabilidad RF → pantalla → método UML → prueba</h1><p class="sub">Los nombres de clase y método coinciden con <code>DCL-R8-0001A/B/C</code>. «Prueba» remite a <code>pruebas_motor.js</code> (Node). Que una pantalla exista aquí no la convierte en implementación productiva.</p>
    <div class="panel"><div class="scroll"><table><thead><tr><th>RF</th><th>Requisito</th><th>Pantalla</th><th>Método (UML)</th><th>Prueba</th></tr></thead><tbody>${TRAZA.map(r => `<tr>${r.map((c, i) => `<td class="${i === 3 ? 'mono' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="panel"><h3>No implementado en R8</h3><ul><li>Adaptador XLSX real, API/BD de YM/Tuulapp/ToolLab, autenticación y autorización de servidor, persistencia, concurrencia.</li><li>Agenda táctil, continuación de servicios (<code>Planificador.agregarContinuacion</code>), tarea raíz/bitácora, productos/logística, cobros y bancos (siguen solo en R7).</li><li>Propuesta de plan con IA/ML: no existe modelo entrenado; solo reglas explícitas y abstención.</li><li>Validación mecánica de intervalos y aceptación por usuarios.</li></ul></div>`;

  // -------------------------------------------------------------- render
  const render = () => {
    renderNav();
    const v = { inicio: vistaInicio, vehiculos: vistaVehiculos, reajustes: vistaReajustes, importacion: vistaImportacion, posventa: vistaPosventa, auditoria: vistaAuditoria, trazabilidad: vistaTraza }[ui.vista];
    $('#main').innerHTML = v();
  };
  const refrescarTrasCambio = () => { render(); };
  const tick = n => new Promise(r => setTimeout(r, n));

  // -------------------------------------------------------------- eventos
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, d = el.dataset;
    if (['set-uso', 'set-aceite', 'horizonte', 'resultado', 'mapa', 'pol-aceite'].includes(a)) return; // se manejan en change
    switch (a) {
      case 'vista': ui.vista = d.v; if (d.v !== 'vehiculos') ui.vehId = ui.vehId; render(); break;
      case 'ir-placa': ui.vista = 'vehiculos'; ui.placa = d.p; { const x = sys.ServicioVehiculos.buscarPorPlaca(d.p); if (x) { ui.vehId = x.id; ui.tab = 'linea'; } } render(); break;
      case 'abrir-veh': ui.vehId = d.id; ui.tab = 'resumen'; render(); break;
      case 'cerrar-veh': ui.vehId = null; render(); break;
      case 'tab': ui.tab = d.t; render(); break;
      case 'modo': ui.modo = d.m; render(); break;
      case 'vtabla': ui.tabla = d.v === '1'; render(); break;
      case 'detalle-hito': detalleHito(+d.i, +d.n); break;
      case 'abrir-ods': { const o = sys.get('ordenes', d.id); modal(`<h2 style="margin:0">ODS ${esc(o.codigo)}</h2><p>${fF(o.fecha)} · ${o.kmIngreso == null ? 'sin km' : km(o.kmIngreso) + ' km'} · ${esc(o.estado)} · origen ${esc(o.origenSistema)}</p><ul>${o.lineas.map(l => `<li class="${l.activa ? '' : 'mut'}">${esc(l.descripcion)} <span class="pill">${l.tipo === 'PRODUCTO' ? 'producto' : esc(l.accion.toLowerCase())}</span></li>`).join('')}</ul>${(o.analisisPlan || []).length ? `<h3>Análisis contra el plan</h3><ul>${o.analisisPlan.map(x => `<li><b>${esc(x.estado)}</b>: ${esc(x.detalle)}</li>`).join('')}</ul>` : ''}`); break; }
      case 'asignar': intentar(() => { sys.ServicioPlanes.asignarPlan(ui.vehId, d.ver, uid()); toast('Plan asignado y base congelada.'); ui.tab = 'linea'; render(); }); break;
      case 'mas-linea': ui.lineasForm.push({ descripcion: '', accion: 'SUSTITUCION' }); render(); break;
      case 'quitar-linea': ui.lineasForm.splice(+d.i, 1); if (!ui.lineasForm.length) ui.lineasForm.push({ descripcion: '', accion: 'SUSTITUCION' }); render(); break;
      case 'aprobar': case 'rechazar': { const mot = (document.querySelector(`[data-motivo="${d.id}"]`) || {}).value || ''; intentar(() => { a === 'aprobar' ? sys.MotorPlanes.aprobarReajuste(d.id, uid(), mot) : sys.MotorPlanes.rechazarReajuste(d.id, uid(), mot); toast(a === 'aprobar' ? 'Reajuste aprobado: solo cambió el futuro de esa regla.' : 'Reajuste rechazado: el plan no cambia.'); render(); }); break; }
      case 'muestra': ui.csv = d.m === 'ok' ? Motor.MUESTRA_VALIDA : Motor.MUESTRA_ERRORES; ui.lote = null; render(); break;
      case 'analizar': case 'reanalizar': analizar(a === 'reanalizar'); break;
      case 'aplicar': intentar(() => { sys.Importador.confirmar(ui.lote, uid()); toast('Lote aplicado de forma atómica.'); render(); }); break;
      case 'reaplicar': { ui.lote = null; analizar(false, true); break; }
      case 'crear-seg': { const s = sugerencias()[+d.i]; intentar(() => { const o = sys.get('ordenes', s.p.ancla.ordenId); sys.ServicioPosventa.asegurarSeguimiento(o.id, `hito:${s.p.regla.id}:${s.x.km}`); toast('Seguimiento creado (idempotente por clave).'); render(); }); break; }
      case 'wa': { const w = sys.ServicioPosventa.generarEnlaceWhatsApp(d.id); modal(`<h2 style="margin:0">Mensaje preparado</h2><p>${esc(w.texto)}</p><div class="note warn">El envío es <b>manual</b>: abrir el enlace no acredita que se envió ni que el cliente respondió. Después registre el intento y el resultado.</div><p><a href="${esc(w.url)}" target="_blank" rel="noopener">Abrir WhatsApp con el mensaje</a></p>`); break; }
      case 'intento': intentar(() => { sys.ServicioPosventa.registrarIntento(d.id, 'whatsapp'); toast('Intento registrado.'); render(); }); break;
      case 'llegada': intentar(() => { const o = sys.ServicioCitas.convertirLlegada(d.id, 'llegada-' + d.id); toast('ODS ' + o.codigo + ' creada en Recepción; bloques enlazados.'); render(); }); break;
      case 'nada': break;
    }
  });
  document.addEventListener('change', e => {
    const el = e.target, a = el.dataset && el.dataset.act;
    if (el.id === 'rol') { ui.rol = el.value; render(); return; }
    if (el.dataset.linea !== undefined) { ui.lineasForm[+el.dataset.linea][el.dataset.campo] = el.value; return; }
    if (a === 'set-uso') intentar(() => { sys.ServicioVehiculos.actualizarPerfil(ui.vehId, { perfilUso: el.value }, uid(), 'ajuste de uso'); render(); });
    if (a === 'set-aceite') intentar(() => { sys.ServicioVehiculos.actualizarPerfil(ui.vehId, { tipoAceite: el.value }, uid(), 'ajuste de aceite'); render(); });
    if (a === 'pol-aceite') { sys.db.config.politicaAceiteNoEspecificado = el.checked ? 'R5_5000' : 'sin_intervalo'; render(); }
    if (a === 'horizonte') { ui.horizonte = +el.value; render(); }
    if (a === 'resultado' && el.value) intentar(() => { sys.ServicioPosventa.registrarResultado(el.dataset.id, el.value); render(); });
    if (a === 'mapa' && ui.lote) { if (el.value === '') delete ui.lote.perfil.mapeo[el.dataset.c]; else ui.lote.perfil.mapeo[el.dataset.c] = +el.value; }
    if (el.id === 'f-csv' && el.files[0]) { const r = new FileReader(); r.onload = () => { ui.csv = String(r.result); ui.lote = ui.lote && null; ui.archivo = el.files[0].name; render(); }; r.readAsText(el.files[0]); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'csv') ui.csv = e.target.value; });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr.click')) { e.preventDefault(); e.target.click(); } });
  document.addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, fd = new FormData(f);
    if (f.id === 'f-buscar') { ui.placa = fd.get('placa'); const v = sys.ServicioVehiculos.buscarPorPlaca(ui.placa); if (v) { ui.vehId = v.id; ui.tab = 'resumen'; } else if (ui.placa) toast('No hay un vehículo con esa placa (se muestran coincidencias parciales).', false); render(); }
    else if (f.id === 'f-km') intentar(() => { sys.ServicioVehiculos.actualizarPerfil(ui.vehId, { kmDeclarado: fd.get('km') === '' ? null : +fd.get('km'), kmDeclaradoFecha: fd.get('fecha') }, uid(), 'lectura declarada'); toast('Lectura guardada.'); render(); });
    else if (f.id === 'f-ods') intentar(() => {
      const ls = ui.lineasForm.filter(l => l.descripcion.trim()); if (!ls.length) throw new Error('Agregue al menos un servicio.');
      const o = sys.ServicioODS.crearODS(ui.vehId, { fecha: fd.get('fecha'), km: fd.get('km'), lineas: ls }, uid());
      sys.ServicioODS.avanzarEstado(o.id, 'EN_PROCESO', uid()); sys.ServicioODS.avanzarEstado(o.id, 'ENTREGA', uid());
      const r = sys.ServicioODS.archivar(o.id, { usuarioId: uid() }, 'ui-' + o.id);
      const res = sys.get('ordenes', r.id), n = (res.ultimasPropuestas || []).length;
      ui.lineasForm = [{ descripcion: '', accion: 'SUSTITUCION' }]; ui.tab = 'linea';
      toast(`ODS ${res.codigo} archivada. ${n} propuesta(s) de reajuste; el plan NO cambia hasta que se aprueben.`); render();
    });
    else if (f.dataset.form === 'cita') intentar(() => {
      const ini = `${fd.get('fecha')}T${fd.get('hora')}`, hh = +fd.get('hh'), fin = new Date(new Date(ini + ':00Z').getTime() + hh * 3600000).toISOString().slice(0, 16);
      sys.ServicioCitas.programarCita(f.dataset.id, [{ descripcion: fd.get('serv'), duracionHH: hh, tecnicoId: fd.get('tec'), asignacionExplicita: true }], [{ inicio: ini, fin }]); toast('Cita reservada; aviso de reconfirmación creado.'); render();
    });
  });
  const analizar = (conMapeo, reimport) => {
    intentar(() => {
      const modo = ($('#modo-imp') || {}).value || (ui.lote && ui.lote.modo) || 'crear';
      const texto = reimport ? ui.csv : ($('#csv') ? $('#csv').value : ui.csv); ui.csv = texto;
      const perfil = conMapeo && ui.lote ? { mapeo: ui.lote.perfil.mapeo } : null;
      ui.lote = sys.Importador.cargar({ nombre: ui.archivo || 'muestra.csv', texto }, perfil, modo);
      if (perfil) ui.lote.perfil.id = ui.lote.validacion.ok ? 'MAPEO_MANUAL' : null;
      if (reimport && ui.lote.estado === 'VALIDO') { sys.Importador.confirmar(ui.lote, uid()); toast(`Reimportación: ${ui.lote.resultado.odsNuevas} ODS nuevas (esperado 0), ${ui.lote.resultado.odsExistentes} existentes. No se duplicó.`); }
      render();
    });
  };
  $('#dlg-close').addEventListener('click', () => $('#dlg').close());
  $('#btn-reset').addEventListener('click', () => { sys = Motor.nuevoSistemaDemo(); ui.vehId = null; ui.lote = null; ui.vista = 'inicio'; toast('Demo reiniciada.'); render(); });
  $('#btn-export').addEventListener('click', () => { const b = new Blob([JSON.stringify(sys.db, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'estado_demo_R8.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); });
  window.__R8 = { get sys() { return sys; }, ui };
  render();
})();
