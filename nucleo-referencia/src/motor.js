'use strict';
/* =====================================================================
   MOTOR R8 — núcleo de tesis R Motriz (reglas separadas de la interfaz)
   Las clases y métodos usan EXACTAMENTE los nombres de DCL-R8-0001A/B/C.
   Esto es un PROTOTIPO DEMO en memoria: no es backend productivo,
   no hay autenticación real, concurrencia ni persistencia de servidor.
   ===================================================================== */
const Motor = (() => {
  // ---------------------------------------------------------------- utilidades
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const clone = o => JSON.parse(JSON.stringify(o));
  const DAY = 86400000;
  const T = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  const iso = ms => new Date(ms).toISOString().slice(0, 10);
  const addDays = (f, n) => iso(T(f) + n * DAY);
  const addMonths = (f, n) => {
    const y = +f.slice(0, 4), m = +f.slice(5, 7) - 1, d = +f.slice(8, 10);
    const t = m + n, yy = y + Math.floor(t / 12), mm = ((t % 12) + 12) % 12;
    const last = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
    return iso(Date.UTC(yy, mm, Math.min(d, last)));
  };
  const monthsBetween = (a, b) => (T(b) - T(a)) / DAY / 30.4375;
  const validISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && iso(T(s)) === s;
  const normPlaca = p => String(p ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const min2 = (a, b) => (a == null ? b : b == null ? a : (a < b ? a : b));

  // ---------------------------------------------------------------- catálogo y equivalencias
  const FILTRO = /filtro (de )?aceite/;
  const CATALOGO = {
    ACEITE_MOTOR: { nombre: 'Aceite de motor', test: t => /\baceite\b/.test(t.replace(/filtro (de )?aceite/g, ' ')) && !/(caja|transmis|diferencial|hidraul|direccion|atf|gl-?\d)/.test(t) },
    FILTRO_ACEITE: { nombre: 'Filtro de aceite', test: t => FILTRO.test(t) },
    REVISION_GENERAL: { nombre: 'Revisión general', test: t => /(revision|inspeccion) general|chequeo general/.test(t) },
    CABINA: { nombre: 'Cabina / ventilación', test: t => /cabina|polen|ventilacion/.test(t) },
    COMBUSTIBLE: { nombre: 'Sistema de combustible', test: t => /combustible|inyector|filtro de gasolina/.test(t) },
    FRENOS: { nombre: 'Frenos', test: t => /freno|pastilla|zapata/.test(t) && !/liquido/.test(t) },
    LIQUIDO_FRENOS: { nombre: 'Líquido de frenos', test: t => /liquido.*freno|freno.*liquido/.test(t) },
    ADMISION_AIRE: { nombre: 'Admisión / filtro de aire', test: t => /filtro de aire|admision/.test(t) },
    BUJIAS: { nombre: 'Bujías / encendido', test: t => /bujia|encendido/.test(t) },
    REFRIGERANTE: { nombre: 'Refrigerante', test: t => /refrigerante|enfriamiento|radiador/.test(t) },
    DISTRIBUCION: { nombre: 'Distribución', test: t => /distribucion|correa de tiempo/.test(t) },
    ACEITE_CAJA_MANUAL: { nombre: 'Aceite de caja manual', test: t => /(aceite.*caja|caja.*aceite|gl-?[45])/.test(t) && !/auto|atf/.test(t) },
    ACEITE_CAJA_AUTO: { nombre: 'Aceite de caja automática', test: t => /atf|(aceite.*caja|caja.*aceite).*auto/.test(t) },
    EMBRAGUE: { nombre: 'Embrague', test: t => /embrague|clutch/.test(t) && !/liquido/.test(t) },
    LIQUIDO_EMBRAGUE: { nombre: 'Líquido de embrague', test: t => /liquido.*embrague/.test(t) },
  };
  const inferirAccion = d => {
    const t = norm(d);
    if (/cambio|sustituc|reemplaz|cambiar/.test(t)) return 'SUSTITUCION';
    if (/revision|inspecc|diagnost|chequeo|verificac/.test(t)) return 'INSPECCION';
    if (/servicio|limpieza|mantenimiento|reparac|afinamiento/.test(t)) return 'SERVICIO_GENERAL';
    return 'DESCONOCIDA';
  };
  // ¿una línea con acción `a` cumple una regla que exige `req`?  (inspección NO equivale a sustitución)
  const accionCumple = (req, a) => {
    if (a === 'DESCONOCIDA') return null; // indeterminado -> abstención
    if (req === 'SUSTITUCION') return a === 'SUSTITUCION';
    if (req === 'INSPECCION') return a === 'INSPECCION' || a === 'SUSTITUCION';
    return a === 'SUSTITUCION' || a === 'SERVICIO_GENERAL';
  };

  // ---------------------------------------------------------------- permisos (DEMO: no sustituye autorización de servidor)
  const PERMISOS = {
    importar: ['CAJERA', 'ADMINISTRADOR'],
    crear_ods: ['CAJERA', 'JEFE_TALLER', 'ADMINISTRADOR'],
    archivar: ['CAJERA', 'JEFE_TALLER', 'ADMINISTRADOR'],
    reabrir: ['ADMINISTRADOR'],
    corregir_archivada: ['ADMINISTRADOR'],
    asignar_plan: ['JEFE_TALLER', 'EXPERTO'],
    aprobar_reajuste: ['JEFE_TALLER', 'EXPERTO'],
    editar_vehiculo: ['CAJERA', 'JEFE_TALLER', 'ADMINISTRADOR', 'EXPERTO'],
    posventa: ['CAJERA', 'ADMINISTRADOR'],
    citas: ['CAJERA', 'JEFE_TALLER', 'ADMINISTRADOR'],
  };

  // ---------------------------------------------------------------- base de datos en memoria
  const PLANES_R7 = __PLANES_R7__;
  const nuevaDB = () => ({
    seq: 0, hoy: '2026-10-15',
    config: { politicaAceiteNoEspecificado: 'R5_5000', capacidadSimultanea: 2, horario: { ini: 8, fin: 18, descIni: 13, descFin: 14 }, tasaKmMesDefault: 1000, diasSeguimiento: 7, anticipacionHoras: 24 },
    usuarios: [
      { id: 'u-caj', nombre: 'Cajera demo', rol: 'CAJERA', sedeId: 'sede-1' },
      { id: 'u-jef', nombre: 'Jefe de taller demo', rol: 'JEFE_TALLER', sedeId: 'sede-1' },
      { id: 'u-tec1', nombre: 'Técnico demo 1', rol: 'TECNICO', sedeId: 'sede-1' },
      { id: 'u-tec2', nombre: 'Técnico demo 2', rol: 'TECNICO', sedeId: 'sede-1' },
      { id: 'u-exp', nombre: 'Experto mecánico demo', rol: 'EXPERTO', sedeId: 'sede-1' },
      { id: 'u-adm', nombre: 'Administrador demo', rol: 'ADMINISTRADOR', sedeId: 'sede-1' },
    ],
    clientes: [], vehiculos: [], ordenes: [], identidades: {}, lotes: [],
    planes: PLANES_R7.map(p => ({ id: p.id, nombre: p.nombre, versiones: [{ id: p.id + '@v1', numero: 1, fuente: 'R7 (AutoData, recuperado) — NO validado técnicamente', estado: 'PUBLICADA', congelada: true, aplicabilidad: p.aplicabilidad, reglas: p.reglas }] })),
    asignaciones: [], reajustes: [], seguimientos: [], intentos: [], citas: [], bloques: [], avisos: [], auditoria: [], claves: {}, equivalencias: [],
  });

  class Sistema {
    constructor(db) {
      this.db = db || nuevaDB();
      this.RegistroAuditoria = new RegistroAuditoria(this);
      this.Repositorio = new Repositorio(this);
      this.ServicioAcceso = new ServicioAcceso(this);
      this.NormalizadorServicios = new NormalizadorServicios(this);
      this.ServicioVehiculos = new ServicioVehiculos(this);
      this.ServicioLineaTemporal = new ServicioLineaTemporal(this);
      this.ServicioPlanes = new ServicioPlanes(this);
      this.MotorPlanes = new MotorPlanes(this);
      this.ServicioPosventa = new ServicioPosventa(this);
      this.Planificador = new Planificador(this);
      this.ServicioAvisos = new ServicioAvisos(this);
      this.ServicioODS = new ServicioODS(this);
      this.ServicioCitas = new ServicioCitas(this);
      this.ValidadorLote = new ValidadorLote(this);
      this.ResolvedorIdentidad = new ResolvedorIdentidad(this);
      this.AplicadorLote = new AplicadorLote(this);
      this.Importador = new Importador(this);
    }
    id(p) { return p + '-' + (++this.db.seq); }
    get(col, id) { return this.db[col].find(x => x.id === id); }
    usuario(id) { const u = this.get('usuarios', id); if (!u) throw new Error('Usuario inexistente: ' + id); return u; }
    exigir(usuarioId, accion) {
      if (!this.ServicioAcceso.puede(usuarioId, accion, this.usuario(usuarioId).sedeId))
        throw new Error(`Permiso denegado: el rol ${this.usuario(usuarioId).rol} no puede «${accion}».`);
    }
    claveUsada(c) { return !!this.db.claves[c]; }
    marcarClave(c, v) { this.db.claves[c] = v ?? true; }
  }

  // ---------------------------------------------------------------- servicios transversales
  class ServicioAcceso {
    constructor(s) { this.s = s; }
    puede(usuarioId, accion, sedeId) {
      const u = this.s.get('usuarios', usuarioId); if (!u) return false;
      return (PERMISOS[accion] || []).includes(u.rol);
    }
  }
  class RegistroAuditoria {
    constructor(s) { this.s = s; }
    registrar(actor, accion, motivo, antes, despues) {
      const e = { id: this.s.id('aud'), actorId: actor, fechaHora: this.s.db.hoy + 'T00:00', accion, motivo: motivo ?? null, antes: antes ?? null, despues: despues ?? null };
      this.s.db.auditoria.push(e); return e;
    }
  }
  class Repositorio {
    constructor(s) { this.s = s; this.snap = null; this.prof = 0; }
    iniciar() { if (this.prof === 0) this.snap = JSON.stringify(this.s.db); this.prof++; }
    guardar(datos) { /* en el prototipo los servicios mutan la BD en memoria; en producción persistiría aquí */ return true; }
    confirmar() { if (this.prof > 0) this.prof--; if (this.prof === 0) this.snap = null; }
    revertir() {
      if (!this.snap) return;
      const db = this.s.db, ant = JSON.parse(this.snap);
      Object.keys(db).forEach(k => delete db[k]); Object.assign(db, ant);
      this.snap = null; this.prof = 0;
    }
  }
  class NormalizadorServicios {
    constructor(s) { this.s = s; }
    /** Devuelve las claves de catálogo que la descripción puede cubrir. Sin coincidencia => claves vacías (no se inventa). */
    resolverEquivalencia(descripcion, accion) {
      const t = norm(descripcion);
      const claves = Object.keys(CATALOGO).filter(k => CATALOGO[k].test(t));
      return { descripcionOrigen: descripcion, claves, accion: accion || inferirAccion(descripcion), metodo: claves.length ? 'patrón de catálogo' : 'sin equivalencia', confianza: claves.length ? 0.8 : 0 };
    }
  }

  // ---------------------------------------------------------------- vehículos
  const CAMPOS_VEH = ['placa', 'vin', 'marca', 'modelo', 'anio', 'codigoMotor', 'perfilUso', 'tipoAceite'];
  const camposFaltantes = v => CAMPOS_VEH.filter(c => v[c] == null || v[c] === '');
  class ServicioVehiculos {
    constructor(s) { this.s = s; }
    buscarPorPlaca(placa) { const p = normPlaca(placa); return p ? (this.s.db.vehiculos.find(v => normPlaca(v.placa) === p) || null) : null; }
    consultarHistorial(vehiculoId) {
      return this.s.db.ordenes.filter(o => o.vehiculoId === vehiculoId)
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.kmIngreso ?? -1) - (b.kmIngreso ?? -1));
    }
    actualizarPerfil(vehiculoId, cambios, usuarioId, motivo) { // soporte de UI (uso y aceite); auditado
      this.s.exigir(usuarioId, 'editar_vehiculo');
      const v = this.s.get('vehiculos', vehiculoId), antes = {};
      for (const k of Object.keys(cambios)) { if (!['perfilUso', 'tipoAceite', 'kmDeclarado', 'kmDeclaradoFecha'].includes(k)) throw new Error('Campo no editable: ' + k); antes[k] = v[k]; v[k] = cambios[k] === '' ? null : cambios[k]; }
      this.s.RegistroAuditoria.registrar(usuarioId, 'actualizar_vehiculo', motivo || 'ajuste de perfil', antes, cambios);
      return v;
    }
  }

  // ---------------------------------------------------------------- reglas de intervalo y proyección
  const kmOleo = (v, intervaloPlan, cfg) => {
    // R5: sintético/full sintético 7.500; mineral/semisintético 5.000; no especificado 5.000 (política configurable)
    const t = norm(v.tipoAceite);
    if (/sintetico|full/.test(t) && !/semi/.test(t)) return { km: 7500, origen: 'R5: sintético 7.500 km' };
    if (/mineral|semi/.test(t)) return { km: 5000, origen: 'R5: mineral/semisintético 5.000 km' };
    if (cfg.politicaAceiteNoEspecificado === 'R5_5000') return { km: 5000, origen: 'R5: aceite no especificado = 5.000 km (supuesto; conflicto con contexto 29/09 pendiente de confirmar)' };
    return null; // política «sin_intervalo»: aceite desconocido no implica intervalo
  };
  const intervaloPara = (regla, uso, vehiculo, cfg) => {
    if (!uso) return null;
    const iv = uso === 'SEVERO' ? regla.severo : regla.normal;
    if (!iv) return null;
    let km = iv.km, origen = 'plan ' + (uso === 'SEVERO' ? 'severo' : 'normal');
    if (regla.servicioClave === 'ACEITE_MOTOR' && vehiculo) {
      const o = kmOleo(vehiculo, iv, cfg);
      if (!o) return null;
      km = o.km; origen = o.origen;
    }
    if (km == null && iv.meses == null) return null;
    return { km, meses: iv.meses, kmInicial: iv.kmInicial ?? null, origen };
  };

  /** Contexto de kilometraje: lectura más reciente + tasa. Nunca presentado como lectura real. */
  const contextoKm = (s, vehiculo, hoy) => {
    const lect = s.ServicioVehiculos.consultarHistorial(vehiculo.id).filter(o => o.kmIngreso != null).map(o => ({ km: o.kmIngreso, fecha: o.fecha, fuente: 'ODS ' + o.codigo }));
    if (vehiculo.kmDeclarado != null && vehiculo.kmDeclaradoFecha) lect.push({ km: vehiculo.kmDeclarado, fecha: vehiculo.kmDeclaradoFecha, fuente: 'lectura declarada' });
    lect.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.km - b.km);
    if (!lect.length) return { km: null, tasa: null, ultima: null, esEstimado: true, tasaSupuesta: true };
    const ult = lect[lect.length - 1], pri = lect[0];
    const span = monthsBetween(pri.fecha, ult.fecha);
    let tasa = s.db.config.tasaKmMesDefault, supuesta = true;
    if (lect.length >= 2 && span >= 2 && ult.km > pri.km) { tasa = Math.round((ult.km - pri.km) / span); supuesta = false; }
    const meses = Math.max(0, monthsBetween(ult.fecha, hoy));
    const real = ult.fecha >= hoy;
    return { km: real ? ult.km : Math.round(ult.km + tasa * meses), tasa, ultima: ult, esEstimado: !real, tasaSupuesta: supuesta };
  };
  const fechaPorKm = (ctx, km) => (ctx.ultima && ctx.tasa > 0 ? addDays(ctx.ultima.fecha, Math.round((km - ctx.ultima.km) / ctx.tasa * 30.4375)) : null);

  /** Una proyección a partir del ancla; `n` = ciclo (1 = próximo, >1 = condicional). */
  const proyectar = (regla, ancla, uso, vehiculo, ctx, hoy, cfg, n = 1) => {
    const iv = intervaloPara(regla, uso, vehiculo, cfg);
    const base = { reglaId: regla.id, tipo: regla.tipo, revisionIndex: null };
    if (regla.acompana && !regla.normal && !regla.severo) return { ...base, estado: 'SIN_INTERVALO', motivo: 'Operación que acompaña a otra o sin intervalo propio en la fuente; no se proyecta.' };
    if (!uso) return { ...base, estado: 'SIN_INTERVALO', motivo: 'Falta definir el perfil de uso (normal/severo) del vehículo.' };
    if (!iv) return { ...base, estado: 'SIN_INTERVALO', motivo: 'Sin intervalo documentado para este uso' + (regla.servicioClave === 'ACEITE_MOTOR' ? ' / aceite' : '') + '. No se interpola.' };
    if (!ancla) {
      if (iv.kmInicial != null && ctx.km != null && ctx.km < iv.kmInicial)
        return { ...base, estado: 'PROGRAMADO', km: iv.kmInicial, fecha: fechaPorKm(ctx, iv.kmInicial), criterio: 'km inicial de la ficha', intervalo: iv, ancla: null };
      return { ...base, estado: 'SIN_REGISTRO', motivo: 'Sin ODS que acredite una ejecución previa: se revisa en la próxima visita; no se declara vencido.', intervalo: iv, ancla: null };
    }
    const k = iv.km != null && ancla.km != null ? ancla.km + n * iv.km : null;
    if (k == null && iv.meses == null) return { ...base, estado: 'SIN_REGISTRO', motivo: 'La ODS ancla no tiene kilometraje y la regla es solo por km: no se puede proyectar.', intervalo: iv, ancla };
    const fKm = k != null ? fechaPorKm(ctx, k) : null;
    const fMes = iv.meses != null ? addMonths(ancla.fecha, n * iv.meses) : null;
    const f = min2(fKm, fMes);
    const criterio = fMes && (!fKm || fMes <= fKm) ? 'tiempo' : 'km';
    const kmVenc = k != null && ctx.km != null && ctx.km >= k, fVenc = fMes != null && fMes <= hoy;
    let estado = n > 1 ? 'CONDICIONAL' : (kmVenc || fVenc ? 'VENCIDO' : 'PROGRAMADO');
    return { ...base, estado, km: k, fecha: f, criterio, intervalo: iv, ancla, ciclo: n,
      detalleVencimiento: estado === 'VENCIDO' ? (kmVenc && fVenc ? 'km y tiempo' : kmVenc ? 'por km' : 'por tiempo') : null };
  };

  const buscarEvidencias = (s, vehiculo, regla, hasta) => {
    const out = [];
    for (const o of s.ServicioVehiculos.consultarHistorial(vehiculo.id)) {
      if (o.estado !== 'ARCHIVADA') continue;
      for (const l of o.lineas) {
        if (!l.activa || l.tipo !== 'SERVICIO') continue;
        const eq = s.NormalizadorServicios.resolverEquivalencia(l.descripcion, l.accion);
        if (!eq.claves.includes(regla.servicioClave)) continue;
        if (accionCumple(regla.accionRequerida, l.accion) !== true) continue;
        out.push({ ordenId: o.id, codigo: o.codigo, lineaId: l.id, km: o.kmIngreso, fecha: o.fecha });
      }
    }
    return out.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.km ?? 0) - (b.km ?? 0));
  };

  // ---------------------------------------------------------------- planes y asignaciones
  const coincide = (ap, v) => {
    const faltantes = [];
    const mA = norm(v.marca) === norm(ap.marca), moA = norm(v.modelo).includes(norm(ap.modelo));
    const motorV = norm(v.codigoMotor), motorA = norm(ap.motor);
    if (!v.marca) faltantes.push('marca'); if (!v.modelo) faltantes.push('modelo'); if (!v.codigoMotor) faltantes.push('codigoMotor');
    if (!(mA && moA)) return { resultado: 'NO', faltantes };
    if (!v.codigoMotor) return { resultado: 'PARCIAL', faltantes, nota: 'Marca y modelo coinciden pero falta el código de motor: plan pendiente de validar.' };
    if (motorV !== motorA) return { resultado: 'NO', faltantes, nota: 'El motor no coincide.' };
    return { resultado: 'SUFICIENTE', faltantes, nota: 'Marca, modelo y motor coinciden. Años/generación no verificados en la ficha demo.' };
  };
  class ServicioPlanes {
    constructor(s) { this.s = s; }
    evaluarAplicabilidad(vehiculoId) {
      const v = this.s.get('vehiculos', vehiculoId), out = [];
      for (const p of this.s.db.planes) for (const ver of p.versiones) {
        const r = coincide(ver.aplicabilidad, v);
        if (r.resultado !== 'NO') out.push({ planId: p.id, versionId: ver.id, plan: p.nombre, ...r });
      }
      return out;
    }
    asignarPlan(vehiculoId, versionId, usuarioId) {
      this.s.exigir(usuarioId, 'asignar_plan');
      const ev = this.evaluarAplicabilidad(vehiculoId).find(e => e.versionId === versionId);
      if (!ev || ev.resultado !== 'SUFICIENTE') throw new Error('Plan pendiente de validar: la aplicabilidad no es suficiente. No se asigna por aproximación.');
      const v = this.s.get('vehiculos', vehiculoId);
      if (!v.perfilUso) throw new Error('Defina el perfil de uso del vehículo antes de asignar el plan.');
      this.s.db.asignaciones.filter(a => a.vehiculoId === vehiculoId && a.activa).forEach(a => a.activa = false);
      const a = { id: this.s.id('asg'), vehiculoId, versionId, asignadoPor: usuarioId, fechaBase: this.s.db.hoy, activa: true, programacion: {}, baseSnapshot: null };
      const ver = this.version(versionId);
      for (const r of ver.reglas) { const evs = buscarEvidencias(this.s, v, r); const u = evs[evs.length - 1]; if (u) a.programacion[r.id] = { ordenId: u.ordenId, codigo: u.codigo, km: u.km, fecha: u.fecha }; }
      this.s.db.asignaciones.push(a);
      const proy = this.s.ServicioLineaTemporal.construir(vehiculoId, null, this.s.db.hoy).proyectados;
      a.baseSnapshot = a.baseSnapshot || {};
      this.congelarBase(a, proy, v);
      this.s.RegistroAuditoria.registrar(usuarioId, 'asignar_plan', 'asignación explícita', null, { vehiculoId, versionId });
      return a;
    }
    congelarBase(a, proyecciones, v) { // Asignacion.congelarBase
      const ctx = contextoKm(this.s, v, this.s.db.hoy);
      a.baseSnapshot = deepFreeze(clone({ fecha: this.s.db.hoy, kmAlCongelar: ctx.km, uso: v.perfilUso, tipoAceite: v.tipoAceite ?? null, programacion: a.programacion, proyecciones: proyecciones.map(p => ({ reglaId: p.regla.id, estado: p.proximo.estado, km: p.proximo.km ?? null, fecha: p.proximo.fecha ?? null })) }));
    }
    version(versionId) { for (const p of this.s.db.planes) { const x = p.versiones.find(v => v.id === versionId); if (x) return x; } throw new Error('Versión inexistente'); }
    asignacionVigente(vehiculoId) { return this.s.db.asignaciones.find(a => a.vehiculoId === vehiculoId && a.activa) || null; }
    publicarVersion(planId, cambios, motivo) {
      const p = this.s.get('planes', planId), ult = p.versiones[p.versiones.length - 1];
      const nv = clone(ult); nv.numero = ult.numero + 1; nv.id = planId + '@v' + nv.numero; nv.estado = 'BORRADOR'; nv.congelada = false; nv.fuente = (cambios && cambios.fuente) || ult.fuente;
      p.versiones.push(nv); this.s.RegistroAuditoria.registrar('sistema', 'publicar_version', motivo, ult.id, nv.id); return nv; // nunca se edita una versión congelada
    }
  }
  const deepFreeze = o => { Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };

  class ServicioLineaTemporal {
    constructor(s) { this.s = s; }
    /** Arriba: proyectados (por regla). Abajo: ODS reales. `modo` = 'dinamico' | 'base'. */
    construir(vehiculoId, kmActual, fechaCorte, modo = 'dinamico') {
      const s = this.s, v = s.get('vehiculos', vehiculoId), hoy = fechaCorte || s.db.hoy;
      const asg = s.ServicioPlanes.asignacionVigente(vehiculoId);
      const ejecutados = s.ServicioVehiculos.consultarHistorial(vehiculoId);
      const ctx = contextoKm(s, v, hoy);
      if (kmActual != null) { ctx.km = kmActual; ctx.esEstimado = false; }
      const res = { vehiculoId, fechaCorte: hoy, kmActual: ctx.km, kmEsEstimado: ctx.esEstimado, tasa: ctx.tasa, tasaSupuesta: ctx.tasaSupuesta, ultimaLectura: ctx.ultima, ejecutados, proyectados: [], advertencias: [], asignacion: asg };
      if (!asg) { res.advertencias.push('Vehículo sin plan asignado: no se genera proyección (plan pendiente de validar).'); return res; }
      const ver = s.ServicioPlanes.version(asg.versionId);
      const snap = modo === 'base' ? asg.baseSnapshot : null;
      const uso = snap ? snap.uso : v.perfilUso, vv = snap ? { ...v, tipoAceite: snap.tipoAceite } : v;
      const prog = snap ? snap.programacion : asg.programacion;
      if (!uso) res.advertencias.push('Defina el perfil de uso (normal/severo): sin él no se calculan intervalos.');
      if (ctx.km == null) res.advertencias.push('Sin lectura de kilometraje: solo se evalúa por tiempo.');
      if (ctx.tasaSupuesta && ctx.km != null) res.advertencias.push(`Tasa de ${ctx.tasa} km/mes SUPUESTA (historial insuficiente): las fechas por km son estimaciones.`);
      for (const r of ver.reglas) {
        const ancla = prog[r.id] || null;
        const proximo = proyectar(r, ancla, uso, vv, ctx, hoy, s.db.config, 1);
        const ciclos = [];
        if (ancla && proximo.estado !== 'SIN_INTERVALO' && proximo.estado !== 'SIN_REGISTRO') for (const n of [2, 3]) ciclos.push(proyectar(r, ancla, uso, vv, ctx, hoy, s.db.config, n));
        const evidencias = buscarEvidencias(s, v, r);
        const pendiente = asg && !snap ? s.db.reajustes.filter(x => x.asignacionId === asg.id && x.reglaId === r.id && x.estado === 'PENDIENTE') : [];
        res.proyectados.push({ regla: r, ancla, proximo, ciclos, evidencias, reajustesPendientes: pendiente.map(x => x.id) });
      }
      return res;
    }
    compararConBase(asignacionId, kmActual, fechaCorte) {
      const s = this.s, asg = s.get('asignaciones', asignacionId);
      const act = this.construir(asg.vehiculoId, kmActual, fechaCorte, 'dinamico'), bas = this.construir(asg.vehiculoId, kmActual, fechaCorte, 'base');
      return act.proyectados.map((p, i) => {
        const b = bas.proyectados[i].proximo, a = p.proximo;
        return { reglaId: p.regla.id, nombre: p.regla.nombre, base: { km: b.km ?? null, fecha: b.fecha ?? null, estado: b.estado }, actual: { km: a.km ?? null, fecha: a.fecha ?? null, estado: a.estado }, cambio: (a.km ?? null) !== (b.km ?? null) || (a.fecha ?? null) !== (b.fecha ?? null) };
      });
    }
  }

  // ---------------------------------------------------------------- reajuste
    class MotorPlanes {
    constructor(s) { this.s = s; }
    proponerReajuste(ordenId, evidenciaId, version) {
      const s = this.s, o = s.get('ordenes', ordenId);
      if (!o) throw new Error('ODS inexistente');
      if (o.estado !== 'ARCHIVADA') throw new Error('Solo una ODS archivada actúa como evidencia de reajuste.');
      const v = s.get('vehiculos', o.vehiculoId), asg = s.ServicioPlanes.asignacionVigente(v.id);
      o.analisisPlan = [];
      if (!asg) { o.analisisPlan.push({ estado: 'SIN_PLAN', detalle: 'El vehículo no tiene plan asignado: nada que reajustar.' }); return []; }
      const ver = s.ServicioPlanes.version(version || asg.versionId);
      const ctx = contextoKm(s, v, s.db.hoy), out = [];
      for (const l of o.lineas) {
        if (!l.activa || l.tipo !== 'SERVICIO' || (evidenciaId && l.id !== evidenciaId)) continue;
        const eq = s.NormalizadorServicios.resolverEquivalencia(l.descripcion, l.accion);
        if (!eq.claves.length) { o.analisisPlan.push({ lineaId: l.id, estado: 'SIN_REGLA', detalle: `«${l.descripcion}»: sin equivalencia en el catálogo; no se reajusta.` }); continue; }
        for (const c of eq.claves) {
          const r = ver.reglas.find(x => x.servicioClave === c);
          if (!r) { o.analisisPlan.push({ lineaId: l.id, estado: 'SIN_REGLA', detalle: `«${l.descripcion}»: el plan no tiene regla para ${CATALOGO[c].nombre}.` }); continue; }
          if (r.acompana && !r.normal && !r.severo) { o.analisisPlan.push({ lineaId: l.id, estado: 'SIN_REGLA', detalle: `${r.nombre}: sin intervalo propio en la fuente; no genera reajuste.` }); continue; }
          const cumple = accionCumple(r.accionRequerida, l.accion);
          const clave = `${ordenId}|${l.id}|${r.id}|${ver.id}`;
          const previo = s.db.reajustes.find(x => x.claveEvento === clave);
          if (previo) { out.push(previo); o.analisisPlan.push({ lineaId: l.id, estado: 'REAJUSTE', detalle: `${r.nombre}: ya propuesto (idempotente).`, reajusteId: previo.id }); continue; }
          const mk = (estado, motivo, extra = {}) => { const x = { id: s.id('rea'), estado, asignacionId: asg.id, reglaId: r.id, reglaNombre: r.nombre, versionId: ver.id, claveEvento: clave, motivo, evidencia: { ordenId, codigo: o.codigo, lineaId: l.id, km: o.kmIngreso, fecha: o.fecha, accionLinea: l.accion, accionInferida: l.accionInferida }, ...extra }; s.db.reajustes.push(x); out.push(x); o.analisisPlan.push({ lineaId: l.id, estado: estado === 'ABSTENIDO' ? 'ABSTENIDO' : 'REAJUSTE', detalle: `${r.nombre}: ${motivo}`, reajusteId: x.id }); return x; };
          if (cumple === false) { o.analisisPlan.push({ lineaId: l.id, estado: 'NO_CUMPLE_ACCION', detalle: `${r.nombre} exige ${r.accionRequerida}; la línea es ${l.accion}. No cuenta como ejecución.` }); continue; }
          if (cumple === null) { mk('ABSTENIDO', 'La acción de la línea no se pudo determinar (DESCONOCIDA): requiere revisión humana.'); continue; }
          if (l.accionInferida && l.accion === 'SERVICIO_GENERAL' && r.accionRequerida === 'SUSTITUCION') { mk('ABSTENIDO', 'Acción inferida del texto no basta para una regla de sustitución: confirmar.'); continue; }
          if (!v.perfilUso) { mk('ABSTENIDO', 'El vehículo no tiene perfil de uso definido.'); continue; }
          const iv = intervaloPara(r, v.perfilUso, v, s.db.config);
          if (!iv) { mk('ABSTENIDO', 'No hay intervalo documentado para este uso/aceite: no se reajusta.'); continue; }
          if (!validISO(o.fecha)) { mk('ABSTENIDO', 'Fecha de ODS inválida.'); continue; }
          if (o.kmIngreso == null && iv.km != null && iv.meses == null) { mk('ABSTENIDO', 'La ODS no tiene kilometraje válido y la regla es solo por km.'); continue; }
          const ancla = asg.programacion[r.id] || null;
          if (ancla && (o.fecha < ancla.fecha || o.id === ancla.ordenId)) { o.analisisPlan.push({ lineaId: l.id, estado: 'ANTERIOR_AL_ANCLA', detalle: `${r.nombre}: la ODS no es posterior al ancla vigente (ODS ${ancla.codigo}); el historial se conserva sin mover el futuro.` }); continue; }
          const antes = proyectar(r, ancla, v.perfilUso, v, ctx, s.db.hoy, s.db.config, 1);
          const nuevaAncla = { ordenId: o.id, codigo: o.codigo, km: o.kmIngreso, fecha: o.fecha };
          const desp = proyectar(r, nuevaAncla, v.perfilUso, v, ctx, s.db.hoy, s.db.config, 1);
          mk('PENDIENTE', `Reiniciar el ciclo desde la ODS ${o.codigo} (${o.fecha}${o.kmIngreso != null ? ', ' + o.kmIngreso + ' km' : ''}).`, { antes: { km: antes.km ?? null, fecha: antes.fecha ?? null, estado: antes.estado }, despues: { km: desp.km ?? null, fecha: desp.fecha ?? null, estado: desp.estado }, nuevaAncla, anclaPrevia: ancla });
        }
      }
      return out;
    }
    aprobarReajuste(reajusteId, usuarioId, motivo) {
      this.s.exigir(usuarioId, 'aprobar_reajuste');
      const x = this.s.get('reajustes', reajusteId);
      if (!x) throw new Error('Reajuste inexistente');
      if (x.estado !== 'PENDIENTE') throw new Error(`El reajuste está ${x.estado}; solo se aprueba un reajuste PENDIENTE.`);
      const asg = this.s.get('asignaciones', x.asignacionId), vigente = asg.programacion[x.reglaId] || null;
      if (vigente && vigente.fecha > x.nuevaAncla.fecha) throw new Error('Reajuste obsoleto: existe un ancla más reciente. Vuelva a proponer.');
      const antes = clone(vigente);
      this.reajustarFuturo(x.evidencia.ordenId, x.evidencia.lineaId, x.versionId, x);
      x.estado = 'APROBADO'; x.aprobadoPor = usuarioId; x.motivoDecision = motivo || null;
      this.s.RegistroAuditoria.registrar(usuarioId, 'aprobar_reajuste', motivo || 'validación humana', { regla: x.reglaNombre, ancla: antes, proximo: x.antes }, { ancla: x.nuevaAncla, proximo: x.despues });
      return x;
    }
    rechazarReajuste(reajusteId, usuarioId, motivo) {
      this.s.exigir(usuarioId, 'aprobar_reajuste');
      const x = this.s.get('reajustes', reajusteId);
      if (x.estado !== 'PENDIENTE') throw new Error(`El reajuste está ${x.estado}; no se puede rechazar.`);
      x.estado = 'RECHAZADO'; x.aprobadoPor = usuarioId; x.motivoDecision = motivo || null;
      this.s.RegistroAuditoria.registrar(usuarioId, 'rechazar_reajuste', motivo, x.antes, null); return x;
    }
    /** privado en UML: solo mueve el FUTURO de la regla afectada; no toca historial ni otras reglas. */
    reajustarFuturo(ordenId, evidenciaId, version, reajuste) {
      const asg = this.s.get('asignaciones', reajuste.asignacionId);
      asg.programacion[reajuste.reglaId] = { ...reajuste.nuevaAncla };
    }
  }

  // ---------------------------------------------------------------- ODS
  const SIGUIENTE = { RECEPCION: 'EN_PROCESO', EN_PROCESO: 'ENTREGA', ENTREGA: 'ARCHIVADA' };
  class ServicioODS {
    constructor(s) { this.s = s; }
    crearODS(vehiculoId, datos, usuarioId) {
      this.s.exigir(usuarioId, 'crear_ods');
      const v = this.s.get('vehiculos', vehiculoId); if (!v) throw new Error('Vehículo inexistente');
      if (!validISO(datos.fecha)) throw new Error('Fecha inválida (use AAAA-MM-DD).');
      const km = datos.km === '' || datos.km == null ? null : Number(datos.km);
      if (km != null && (!Number.isInteger(km) || km < 0)) throw new Error('Kilometraje inválido.');
      const o = { id: this.s.id('ods'), codigo: datos.codigo || ('R8-' + (this.s.db.seq + 1)), vehiculoId, fecha: datos.fecha, kmIngreso: km, estado: 'RECEPCION', decisionCliente: 'PENDIENTE', origenSistema: datos.origenSistema || 'manual', idExterno: datos.idExterno || null, lineas: [], analisisPlan: [] };
      this.s.db.ordenes.push(o);
      for (const l of datos.lineas || []) this._agregar(o, l);
      this.s.RegistroAuditoria.registrar(usuarioId, 'crear_ods', null, null, { ods: o.codigo });
      return o;
    }
    _agregar(o, l) {
      const accion = l.accion || inferirAccion(l.descripcion);
      const x = { id: this.s.id('lin'), tipo: (l.tipo || 'SERVICIO').toUpperCase(), descripcion: String(l.descripcion).trim(), cantidad: l.cantidad ?? 1, activa: true, accion, accionInferida: !l.accion, horasRevisadas: l.horasRevisadas ?? null };
      o.lineas.push(x); return x;
    }
    agregarLinea(ordenId, linea, usuarioId) {
      const o = this.s.get('ordenes', ordenId); if (o.estado === 'ARCHIVADA') throw new Error('ODS archivada: use corregirArchivada o reabrir.');
      const x = this._agregar(o, linea);
      if (o.decisionCliente === 'APROBADA') { o.decisionCliente = 'PENDIENTE'; this.s.RegistroAuditoria.registrar(usuarioId, 'reaprobacion_por_item_nuevo', 'ítem nuevo', 'APROBADA', 'PENDIENTE'); }
      return x;
    }
    retirarLinea(ordenId, lineaId, motivo) {
      const o = this.s.get('ordenes', ordenId), l = o.lineas.find(x => x.id === lineaId);
      if (!motivo) throw new Error('El retiro exige motivo.');
      l.activa = false; l.retiroMotivo = motivo; // conserva la historia (R7 #3)
      this.s.RegistroAuditoria.registrar('sistema', 'retirar_linea', motivo, { descripcion: l.descripcion, cantidad: l.cantidad }, null);
    }
    registrarDecision(ordenId, decision, usuarioId) {
      if (!['PENDIENTE', 'APROBADA', 'NO_APROBADA'].includes(decision)) throw new Error('Decisión inválida');
      const o = this.s.get('ordenes', ordenId), ant = o.decisionCliente; o.decisionCliente = decision;
      this.s.RegistroAuditoria.registrar(usuarioId, 'registrar_decision', null, ant, decision);
    }
    avanzarEstado(ordenId, destino, usuarioId) {
      const o = this.s.get('ordenes', ordenId);
      if (SIGUIENTE[o.estado] !== destino || destino === 'ARCHIVADA') throw new Error(`Transición inválida ${o.estado} → ${destino}.`);
      if (destino === 'EN_PROCESO' && !o.lineas.some(l => l.activa)) throw new Error('No hay trabajo activo: una ODS sin servicios no crea trabajo ficticio.');
      const ant = o.estado; o.estado = destino; this.s.RegistroAuditoria.registrar(usuarioId, 'avanzar_estado', null, ant, destino); return o;
    }
    archivar(ordenId, politicaSalida, claveEvento) {
      const s = this.s, o = s.get('ordenes', ordenId), usuarioId = (politicaSalida && politicaSalida.usuarioId) || 'u-caj';
      s.exigir(usuarioId, 'archivar');
      const clave = 'archivar|' + (claveEvento || ordenId);
      if (s.claveUsada(clave)) return o; // idempotente
      const permitido = o.estado === 'ENTREGA' || (o.decisionCliente === 'NO_APROBADA' && ['RECEPCION', 'EN_PROCESO'].includes(o.estado));
      if (!permitido) throw new Error(`No se puede archivar desde ${o.estado}${o.estado === 'ARCHIVADA' ? ' (ya archivada)' : ''}.`);
      if (!o.lineas.some(l => l.activa && l.tipo === 'SERVICIO') && o.decisionCliente !== 'NO_APROBADA') throw new Error('El cierre exige al menos un servicio real.');
      s.Repositorio.iniciar();
      try {
        const antes = o.estado;
        s.Repositorio.guardar(o); o.estado = 'ARCHIVADA'; o.salida = s.db.hoy;
        const propuestas = s.MotorPlanes.proponerReajuste(ordenId, null, null);
        s.ServicioPosventa.asegurarSeguimiento(ordenId, clave);
        s.RegistroAuditoria.registrar(usuarioId, 'archivar_ods', null, antes, 'ARCHIVADA');
        s.marcarClave(clave); s.Repositorio.confirmar();
        o.ultimasPropuestas = propuestas.map(p => p.id);
      } catch (e) { s.Repositorio.revertir(); throw e; }
      return s.get('ordenes', ordenId);
    }
    corregirArchivada(ordenId, cambios, motivo) {
      const o = this.s.get('ordenes', ordenId), uid = (cambios && cambios.usuarioId) || 'u-adm';
      this.s.exigir(uid, 'corregir_archivada'); if (!motivo) throw new Error('La corrección exige motivo.');
      if (o.estado !== 'ARCHIVADA') throw new Error('Solo aplica a ODS archivada.');
      const ant = { kmIngreso: o.kmIngreso }; if ('km' in cambios) o.kmIngreso = cambios.km === null ? null : Number(cambios.km);
      this.s.RegistroAuditoria.registrar(uid, 'corregir_archivada', motivo, ant, { kmIngreso: o.kmIngreso }); // NO reactiva la ODS
    }
    reabrir(ordenId, motivo, usuarioId = 'u-adm') {
      this.s.exigir(usuarioId, 'reabrir'); if (!motivo) throw new Error('La reapertura exige motivo.');
      const o = this.s.get('ordenes', ordenId); if (o.estado !== 'ARCHIVADA') throw new Error('Solo se reabre una ODS archivada.');
      o.estado = 'EN_PROCESO'; this.s.RegistroAuditoria.registrar(usuarioId, 'reabrir_ods', motivo, 'ARCHIVADA', 'EN_PROCESO');
    }
    crearDesdeCita(citaId, clave) {
      const s = this.s, c = s.get('citas', citaId), k = 'cita-ods|' + (clave || citaId);
      if (c.ordenId) return s.get('ordenes', c.ordenId); // una ODS por cita
      const v = s.get('vehiculos', c.vehiculoId);
      const o = this.crearODS(v.id, { fecha: s.db.hoy, origenSistema: 'cita', idExterno: citaId, lineas: c.lineas.map(l => ({ descripcion: l.descripcion, tipo: 'SERVICIO' })) }, 'u-caj');
      c.ordenId = o.id; s.marcarClave(k, o.id); return o;
    }
  }

  // ---------------------------------------------------------------- posventa, citas, agenda
  class ServicioPosventa {
    constructor(s) { this.s = s; }
    asegurarSeguimiento(ordenId, claveEvento) {
      const s = this.s, k = 'seg|' + claveEvento, ex = s.db.seguimientos.find(x => x.claveEvento === k);
      if (ex) return ex;
      const o = s.get('ordenes', ordenId);
      const x = { id: s.id('seg'), claveEvento: k, ordenId, vehiculoId: o.vehiculoId, estado: 'PENDIENTE', responsableId: 'u-caj', origen: String(claveEvento).startsWith('hito') ? 'hito de plan' : 'ODS archivada', creado: s.db.hoy, vence: addDays(s.db.hoy, s.db.config.diasSeguimiento) };
      s.db.seguimientos.push(x); return x;
    }
    generarEnlaceWhatsApp(seguimientoId) {
      const s = this.s, x = s.get('seguimientos', seguimientoId), v = s.get('vehiculos', x.vehiculoId);
      const tl = s.ServicioLineaTemporal.construir(v.id, null, s.db.hoy);
      const pend = tl.proyectados.filter(p => ['VENCIDO', 'PROGRAMADO'].includes(p.proximo.estado)).slice(0, 4).map(p => `${p.regla.nombre}${p.proximo.estado === 'VENCIDO' ? ' (vencido)' : ''}`);
      const txt = `Hola, le escribimos de R Motriz. Revisando el historial de su vehículo ${v.placa} tenemos pendiente: ${pend.join('; ') || 'una revisión de seguimiento'}. ¿Desea agendar una cita?`;
      const cli = v.clienteId && s.get('clientes', v.clienteId), tel = cli && cli.telefono ? String(cli.telefono).replace(/\D/g, '') : '';
      return { url: `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`, texto: txt, envioAutomatico: false };
    }
    registrarIntento(seguimientoId, canal) {
      const s = this.s, x = s.get('seguimientos', seguimientoId);
      if (!['PENDIENTE', 'INTENTO_REGISTRADO'].includes(x.estado)) throw new Error('El seguimiento ya no admite intentos.');
      const i = { id: s.id('int'), seguimientoId, canal, resultado: null, fechaHora: s.db.hoy + 'T00:00' };
      s.db.intentos.push(i); x.estado = 'INTENTO_REGISTRADO'; return i; // un clic NO acredita envío ni respuesta
    }
    registrarResultado(seguimientoId, resultado) {
      const s = this.s, x = s.get('seguimientos', seguimientoId);
      if (x.estado !== 'INTENTO_REGISTRADO' && x.estado !== 'CONTACTO_DECLARADO') throw new Error('Registre primero un intento de contacto.');
      const MAP = { respondio: 'CONTACTO_DECLARADO', sin_respuesta_2do: 'COMPLETADO_SIN_CITA', no_requiere_cita: 'COMPLETADO_SIN_CITA', nuevo_intento: 'COMPLETADO_CON_SUBTAREA' };
      if (!MAP[resultado]) throw new Error('Resultado inválido');
      if (resultado === 'no_requiere_cita' && x.estado !== 'CONTACTO_DECLARADO') throw new Error('«No requiere cita» solo tras contacto declarado.');
      const ult = s.db.intentos.filter(i => i.seguimientoId === seguimientoId).pop(); if (ult) ult.resultado = resultado;
      x.estado = MAP[resultado]; return x;
    }
  }
  const aMin = hhmm => +hhmm.slice(11, 13) * 60 + +hhmm.slice(14, 16);
  class Planificador {
    constructor(s) { this.s = s; }
    validarCapacidad(tecnicoId, bloques) {
      const h = this.s.db.config.horario, cap = this.s.db.config.capacidadSimultanea;
      const nuevos = [];
      for (const b of bloques) {
        if (!b.inicio || !b.fin || b.inicio.slice(0, 10) !== b.fin.slice(0, 10)) throw new Error('Cada bloque debe iniciar y terminar el mismo día.');
        const a = aMin(b.inicio), z = aMin(b.fin);
        if (a % 15 || z % 15) throw new Error('La agenda trabaja en múltiplos de 15 minutos.');
        if (z <= a) throw new Error('El fin debe ser posterior al inicio.');
        if (a < h.ini * 60 || z > h.fin * 60) throw new Error(`Fuera del horario laboral ${h.ini}:00–${h.fin}:00.`);
        if (a < h.descFin * 60 && z > h.descIni * 60) throw new Error(`El bloque cae en el descanso ${h.descIni}:00–${h.descFin}:00.`);
        if (new Date(b.inicio + ':00Z').getUTCDay() === 0) throw new Error('Domingo: sin jornada (horario inicial lunes a sábado).');
        nuevos.push({ tecnicoId, inicio: b.inicio, fin: b.fin });
      }
      const existentes = this.s.db.bloques.filter(x => x.tecnicoId === tecnicoId && x.estado !== 'CANCELADO');
      for (const n of nuevos) {
        const sol = existentes.concat(nuevos.filter(x => x !== n)).filter(x => x.inicio < n.fin && n.inicio < x.fin).length + 1;
        if (sol > cap) throw new Error(`Supera ${cap} bloques simultáneos por técnico (regla por confirmar: R5 vs R7).`);
      }
      return true;
    }
    enlazarBloques(citaId, ordenId) { this.s.db.bloques.filter(b => b.citaId === citaId).forEach(b => b.ordenId = ordenId); }
    agregarContinuacion(detalleId, inicio, fin, motivo) { throw new Error('No implementado en R8 (DSE-R8-0006): fuera del primer corte.'); }
  }
  class ServicioAvisos {
    constructor(s) { this.s = s; }
    crearReconfirmacion(citaId) {
      const c = this.s.get('citas', citaId), a = { id: this.s.id('avi'), citaId, titulo: 'Reconfirmar cita', cuando: c.inicio, anticipacionHoras: this.s.db.config.anticipacionHoras };
      this.s.db.avisos.push(a); return a;
    }
  }
  class ServicioCitas {
    constructor(s) { this.s = s; }
    programarCita(seguimientoId, lineas, bloques) {
      const s = this.s, x = s.get('seguimientos', seguimientoId);
      if (x.estado !== 'CONTACTO_DECLARADO') throw new Error('Solo se programa cita tras contacto declarado.');
      if (!lineas || !lineas.length) throw new Error('Indique al menos un servicio para la cita.');
      for (const l of lineas) if (!(l.duracionHH > 0) || (l.duracionHH * 100) % 25) throw new Error('La duración debe ser múltiplo de 0.25 H-H.');
      s.Repositorio.iniciar();
      try {
        const tec = lineas[0].tecnicoId;
        for (const l of lineas) s.Planificador.validarCapacidad(l.tecnicoId || tec, bloques);
        const c = { id: s.id('cit'), seguimientoId, vehiculoId: x.vehiculoId, estado: 'RESERVADA', responsableId: 'u-caj', inicio: bloques[0].inicio, lineas: lineas.map(l => ({ ...l })), ordenId: null };
        s.db.citas.push(c);
        bloques.forEach(b => s.db.bloques.push({ id: s.id('blq'), citaId: c.id, tecnicoId: tec, inicio: b.inicio, fin: b.fin, estado: 'RESERVADO' }));
        s.ServicioAvisos.crearReconfirmacion(c.id);
        x.estado = 'COMPLETADO_CON_CITA'; x.citaId = c.id;
        s.Repositorio.confirmar(); return c;
      } catch (e) { s.Repositorio.revertir(); throw e; }
    }
    convertirLlegada(citaId, clave) {
      const s = this.s, c = s.get('citas', citaId);
      if (c.estado === 'LLEGADA_CONVERTIDA') return s.get('ordenes', c.ordenId); // idempotente
      s.Repositorio.iniciar();
      try {
        const o = s.ServicioODS.crearDesdeCita(citaId, clave);
        s.Planificador.enlazarBloques(citaId, o.id); c.estado = 'LLEGADA_CONVERTIDA'; s.Repositorio.confirmar(); return o;
      } catch (e) { s.Repositorio.revertir(); throw e; }
    }
    reprogramar(citaId, bloques, motivo) {
      const s = this.s, c = s.get('citas', citaId);
      if (!motivo) throw new Error('La reprogramación exige motivo.');
      s.db.bloques.filter(b => b.citaId === citaId).forEach(b => b.estado = 'CANCELADO');
      try { s.Planificador.validarCapacidad(c.lineas[0].tecnicoId, bloques); } catch (e) { s.db.bloques.filter(b => b.citaId === citaId).forEach(b => b.estado = 'RESERVADO'); throw e; }
      const tec = c.lineas[0].tecnicoId; bloques.forEach(b => s.db.bloques.push({ id: s.id('blq'), citaId, tecnicoId: tec, inicio: b.inicio, fin: b.fin, estado: 'RESERVADO' }));
      c.inicio = bloques[0].inicio; c.estado = 'REPROGRAMADA'; s.ServicioAvisos.crearReconfirmacion(citaId);
    }
  }

  // ---------------------------------------------------------------- importación (CSV demo; el adaptador XLSX queda pendiente)
  const PERFIL = {
    id: 'DEMO_plano_ods_v1',
    campos: { ods_id: ['ods_id', 'ods', 'orden', 'nro_orden', 'codigo_ods'], fecha: ['fecha', 'fecha_ingreso', 'fecha_ods'], placa: ['placa', 'patente'], km: ['km', 'kilometraje', 'km_ingreso'], tipo_linea: ['tipo_linea', 'tipo', 'tipo_item'], descripcion: ['descripcion', 'detalle', 'item', 'servicio'], cantidad: ['cantidad', 'cant'], marca: ['marca'], modelo: ['modelo'], anio: ['anio', 'año', 'ano'], motor: ['motor', 'codigo_motor'], cliente_id: ['cliente_id', 'id_cliente'] },
    obligatorias: ['ods_id', 'fecha', 'placa', 'tipo_linea', 'descripcion'],
  };
  const parseCSV = txt => {
    txt = String(txt).replace(/^﻿/, '');
    const sep = (txt.split('\n')[0].split(';').length > txt.split('\n')[0].split(',').length) ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (q) { if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cur); if (row.some(x => x.trim() !== '')) rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    row.push(cur); if (row.some(x => x.trim() !== '')) rows.push(row);
    return rows;
  };
  class Importador {
    constructor(s) { this.s = s; }
    reconocerPerfil(encabezados) {
      const H = encabezados.map(norm), mapeo = {};
      for (const [campo, alias] of Object.entries(PERFIL.campos)) { const i = H.findIndex(h => alias.map(norm).includes(h)); if (i >= 0) mapeo[campo] = i; }
      const faltantes = PERFIL.obligatorias.filter(c => !(c in mapeo));
      return { id: faltantes.length ? null : PERFIL.id, mapeo, faltantes, columnasObligatorias: PERFIL.obligatorias };
    }
    /** archivo = {nombre, texto}. Devuelve Lote con filas originales, errores y resumen simulado. */
    cargar(archivo, perfil, modo = 'crear') {
      const s = this.s, filas = parseCSV(archivo.texto);
      if (filas.length < 2) throw new Error('El archivo no tiene filas de datos.');
      const p = perfil && perfil.mapeo ? perfil : this.reconocerPerfil(filas[0]);
      const hash = hashTexto(archivo.texto);
      const lote = { id: s.id('lote'), hash, nombre: archivo.nombre, modo, estado: 'VALIDANDO', encabezados: filas[0], perfil: p, filasOriginales: filas.slice(1).map((f, i) => ({ numero: i + 2, contenido: f, errores: [] })), resultado: null };
      lote.validacion = s.ValidadorLote.validarTodo(lote, p);
      lote.estado = lote.validacion.ok ? 'VALIDO' : 'CON_ERRORES';
      lote.simulacion = lote.validacion.ok ? this._simular(lote, modo) : null;
      return lote;
    }
    _simular(lote, modo) {
      const s = this.s, sim = { odsNuevas: 0, odsExistentes: 0, odsActualizables: 0, vehiculosNuevos: 0, lineas: 0 }, vistas = new Set(), vv = new Set();
      for (const o of lote.validacion.ordenes) {
        const ex = s.ResolvedorIdentidad.resolver('demo', o.idExterno, 'ods', true);
        if (ex) { sim.odsExistentes++; if (modo === 'actualizar') sim.odsActualizables++; } else sim.odsNuevas++;
        if (!s.ResolvedorIdentidad.resolver('demo', normPlaca(o.placa), 'vehiculo', true) && !vv.has(normPlaca(o.placa))) { sim.vehiculosNuevos++; vv.add(normPlaca(o.placa)); }
        sim.lineas += o.lineas.length;
      }
      return sim;
    }
    confirmar(lote, usuarioId) {
      this.s.exigir(usuarioId, 'importar');
      if (lote.estado !== 'VALIDO') throw new Error('Solo se aplica un lote válido: un error implica cero cambios.');
      lote.resultado = this.s.AplicadorLote.aplicarAtomico(lote, lote.modo, usuarioId);
      lote.estado = 'APLICADO'; return lote;
    }
  }
  const hashTexto = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return ('00000000' + (h >>> 0).toString(16)).slice(-8); };
  const parseFecha = f => {
    f = String(f).trim(); let m;
    if ((m = f.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return validISO(f) ? f : null;
    if ((m = f.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) { const r = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return validISO(r) ? r : null; }
    return null;
  };
  const parseKm = k => { k = String(k ?? '').trim(); if (k === '') return { v: null }; if (/^\d{1,3}([.,]\d{3})+$/.test(k)) k = k.replace(/[.,]/g, ''); return /^\d+$/.test(k) ? { v: +k } : { error: true }; };
  class ValidadorLote {
    constructor(s) { this.s = s; }
    validarTodo(lote, perfil) {
      const errores = [], ordenes = new Map();
      for (const c of PERFIL.obligatorias) if (!(c in perfil.mapeo)) errores.push({ fila: 1, campo: c, mensaje: `Falta mapear la columna obligatoria «${c}».` });
      if (errores.length) return { ok: false, errores, ordenes: [] };
      const g = (f, c) => (c in perfil.mapeo ? (f.contenido[perfil.mapeo[c]] ?? '').trim() : '');
      for (const f of lote.filasOriginales) {
        const e = m => { errores.push({ fila: f.numero, ...m }); f.errores.push(m.mensaje); };
        const id = g(f, 'ods_id'), fecha = parseFecha(g(f, 'fecha')), placa = normPlaca(g(f, 'placa')), tipo = norm(g(f, 'tipo_linea')), desc = g(f, 'descripcion'), kmP = parseKm(g(f, 'km')), cant = g(f, 'cantidad') === '' ? 1 : Number(g(f, 'cantidad').replace(',', '.'));
        if (!id) e({ campo: 'ods_id', mensaje: 'ODS sin identificador.' });
        if (!fecha) e({ campo: 'fecha', mensaje: `Fecha inválida «${g(f, 'fecha')}» (use AAAA-MM-DD o DD/MM/AAAA).` });
        if (!/^[A-Z0-9]{5,8}$/.test(placa)) e({ campo: 'placa', mensaje: `Placa inválida «${g(f, 'placa')}».` });
        if (!['servicio', 'producto'].includes(tipo)) e({ campo: 'tipo_linea', mensaje: `Tipo de línea «${g(f, 'tipo_linea')}» no es servicio/producto.` });
        if (!desc) e({ campo: 'descripcion', mensaje: 'Descripción vacía.' });
        if (kmP.error) e({ campo: 'km', mensaje: `Kilometraje no numérico «${g(f, 'km')}».` });
        if (!(cant > 0)) e({ campo: 'cantidad', mensaje: 'Cantidad inválida.' });
        if (id && fecha && placa) {
          let o = ordenes.get(id);
          if (!o) { o = { idExterno: id, fecha, placa: g(f, 'placa'), km: kmP.v ?? null, marca: g(f, 'marca') || null, modelo: g(f, 'modelo') || null, anio: g(f, 'anio') ? +g(f, 'anio') : null, motor: g(f, 'motor') || null, clienteId: g(f, 'cliente_id') || null, lineas: [] }; ordenes.set(id, o); }
          else if (o.fecha !== fecha || normPlaca(o.placa) !== placa || (o.km !== (kmP.v ?? null))) e({ campo: 'ods_id', mensaje: `La ODS ${id} tiene filas con fecha, placa o km distintos: conflicto.` });
          o.lineas.push({ tipo: tipo.toUpperCase(), descripcion: desc, cantidad: cant });
        }
      }
      return { ok: errores.length === 0, errores, ordenes: [...ordenes.values()] };
    }
  }
  class ResolvedorIdentidad {
    constructor(s) { this.s = s; }
    resolver(origen, idExterno, tipo, soloConsulta = false) {
      const k = `${origen}|${tipo}|${idExterno}`, ex = this.s.db.identidades[k];
      if (ex || soloConsulta) return ex ? { origen, tipo, idExterno, idInterno: ex } : null;
      return null;
    }
    registrar(origen, idExterno, tipo, idInterno) { this.s.db.identidades[`${origen}|${tipo}|${idExterno}`] = idInterno; return { origen, tipo, idExterno, idInterno }; }
  }
  class AplicadorLote {
    constructor(s) { this.s = s; }
    aplicarAtomico(lote, modo, usuarioId) {
      const s = this.s, R = s.ResolvedorIdentidad, res = { odsNuevas: 0, odsExistentes: 0, odsActualizadas: 0, vehiculosNuevos: 0, lineas: 0, reajustesPropuestos: 0 };
      if (s.db.lotes.some(l => l.hash === lote.hash && l.estado === 'APLICADO') && modo === 'crear') { /* reimportar es seguro: no duplica */ }
      s.Repositorio.iniciar();
      try {
        for (const o of lote.validacion.ordenes) {
          let vid = R.resolver('demo', normPlaca(o.placa), 'vehiculo', true)?.idInterno, v = vid && s.get('vehiculos', vid);
          if (!v) {
            let cid = null;
            if (o.clienteId) { const c0 = R.resolver('demo', o.clienteId, 'cliente', true); cid = c0 ? c0.idInterno : (() => { const c = { id: s.id('cli'), nombre: null, telefono: null, origenSistema: 'demo', idExterno: o.clienteId }; s.db.clientes.push(c); R.registrar('demo', o.clienteId, 'cliente', c.id); return c.id; })(); }
            v = { id: s.id('veh'), clienteId: cid, placa: o.placa.toUpperCase(), vin: null, marca: o.marca, modelo: o.modelo, anio: o.anio, codigoMotor: o.motor, perfilUso: null, tipoAceite: null, kmDeclarado: null, origenSistema: 'demo', idExterno: normPlaca(o.placa) };
            s.db.vehiculos.push(v); R.registrar('demo', normPlaca(o.placa), 'vehiculo', v.id); res.vehiculosNuevos++;
          }
          const ex = R.resolver('demo', o.idExterno, 'ods', true);
          const lineas = o.lineas.map(l => ({ ...l }));
          if (!ex) {
            const od = s.ServicioODS.crearODS(v.id, { codigo: o.idExterno, fecha: o.fecha, km: o.km, origenSistema: 'importación', idExterno: o.idExterno, lineas: lineas.map(l => ({ ...l, accion: undefined })) }, usuarioId);
            od.estado = 'ARCHIVADA'; od.salida = o.fecha; // histórico ya finalizado en el ERP de origen
            od.lineas.forEach(l => { l.equivalencia = s.NormalizadorServicios.resolverEquivalencia(l.descripcion, l.accion).claves; });
            R.registrar('demo', o.idExterno, 'ods', od.id); res.odsNuevas++; res.lineas += lineas.length;
            res.reajustesPropuestos += s.MotorPlanes.proponerReajuste(od.id, null, null).filter(x => x.estado === 'PENDIENTE').length;
          } else {
            res.odsExistentes++;
            if (modo === 'actualizar') {
              const od = s.get('ordenes', ex.idInterno); od.lineas.forEach(l => { if (l.activa) { l.activa = false; l.retiroMotivo = 'reemplazado por importación ' + lote.id; } });
              lineas.forEach(l => s.ServicioODS._agregar(od, l)); od.kmIngreso = o.km; res.odsActualizadas++; res.lineas += lineas.length;
              s.RegistroAuditoria.registrar(usuarioId, 'importacion_actualiza_ods', lote.id, null, { ods: o.idExterno });
            }
          }
        }
        s.Repositorio.guardar(res);
        s.db.lotes.push({ id: lote.id, hash: lote.hash, estado: 'APLICADO', nombre: lote.nombre, resumen: res });
        s.RegistroAuditoria.registrar(usuarioId, 'importar_lote', lote.nombre, null, res);
        s.Repositorio.confirmar(); return res;
      } catch (e) { s.Repositorio.revertir(); throw e; }
    }
  }

  // ---------------------------------------------------------------- semilla DEMO (datos sintéticos; NO son clientes reales)
  const sembrar = (s) => {
    const U = 'u-caj';
    const cli = (idx) => { const c = { id: s.id('cli'), nombre: null, telefono: null, origenSistema: 'demo', idExterno: 'DEMO-C' + idx }; s.db.clientes.push(c); return c.id; };
    const veh = (o) => { const v = { id: s.id('veh'), vin: null, perfilUso: null, tipoAceite: null, kmDeclarado: null, anio: null, ...o, origenSistema: 'demo', idExterno: normPlaca(o.placa) }; s.db.vehiculos.push(v); s.ResolvedorIdentidad.registrar('demo', normPlaca(o.placa), 'vehiculo', v.id); return v; };
    const ods = (v, cod, fecha, km, lineas) => { const o = s.ServicioODS.crearODS(v.id, { codigo: cod, fecha, km, origenSistema: 'demo', idExterno: cod, lineas }, U); o.estado = 'ARCHIVADA'; o.salida = fecha; s.ResolvedorIdentidad.registrar('demo', cod, 'ods', o.id); return o; };
    const L = (descripcion, accion, tipo = 'SERVICIO') => ({ descripcion, accion, tipo });
    const v1 = veh({ clienteId: cli(1), placa: 'DEM-101', marca: 'Kia', modelo: 'Picanto 1.0', anio: 2018, codigoMotor: 'G3LA', perfilUso: 'NORMAL', tipoAceite: 'Semisintético' });
    ods(v1, 'D-1001', '2026-01-12', 61200, [L('Cambio de aceite de motor', 'SUSTITUCION'), L('Cambio de filtro de aceite', 'SUSTITUCION'), L('Revisión de frenos', 'INSPECCION')]);
    ods(v1, 'D-1002', '2026-02-10', null, [L('Servicio de cabina / ventilación', 'SERVICIO_GENERAL')]);
    ods(v1, 'D-1003', '2026-04-02', 65900, [L('Cambio de aceite de motor', 'SUSTITUCION'), L('Servicio de filtro de aire', 'SERVICIO_GENERAL')]);
    ods(v1, 'D-1004', '2026-07-20', 70400, [L('Cambio de aceite de motor', 'SUSTITUCION'), L('Revisión general preventiva', 'INSPECCION'), L('Cambio de líquido de frenos', 'SUSTITUCION')]);
    const v2 = veh({ clienteId: cli(2), placa: 'DEM-202', marca: 'Hyundai', modelo: 'i10 1.1', anio: 2016, codigoMotor: 'G4HG', perfilUso: 'SEVERO', tipoAceite: 'Sintético' });
    ods(v2, 'D-2001', '2026-02-03', 88000, [L('Cambio de aceite de motor', 'SUSTITUCION'), L('Servicio de frenos', 'SERVICIO_GENERAL')]);
    ods(v2, 'D-2002', '2026-05-15', 90500, [L('Cambio de aceite de motor', 'SUSTITUCION')]);
    const v3 = veh({ clienteId: cli(3), placa: 'DEM-303', marca: 'Toyota', modelo: 'Yaris 1.3 VVT-i', anio: 2019, codigoMotor: '1NR-FE', perfilUso: 'NORMAL', tipoAceite: null });
    ods(v3, 'D-3001', '2026-03-10', 40100, [L('Cambio de aceite de motor', 'SUSTITUCION'), L('Revisión de frenos', 'INSPECCION')]);
    ods(v3, 'D-3002', '2026-09-01', 43300, [L('Cambio de aceite de motor', 'SUSTITUCION')]);
    veh({ clienteId: cli(4), placa: 'DEM-404', marca: 'Chevrolet', modelo: 'Spark 1.0', anio: null, codigoMotor: null, perfilUso: null });
    // asignaciones explícitas por el jefe de taller (la validación técnica sigue PENDIENTE)
    s.ServicioPlanes.asignarPlan(v1.id, 'G2-PIC@v1', 'u-jef');
    s.ServicioPlanes.asignarPlan(v2.id, 'G2-I10@v1', 'u-jef');
    s.ServicioPlanes.asignarPlan(v3.id, 'G3-P2@v1', 'u-jef');
    s.db.auditoria.length = 0; s.db.seq += 0;
    return s;
  };
  const nuevoSistemaDemo = () => sembrar(new Sistema());

  const MUESTRA_VALIDA = 'ods_id,fecha,placa,km,tipo_linea,descripcion,cantidad,marca,modelo,motor,cliente_id\nD-1005,2026-10-10,DEM-101,74100,servicio,Cambio de aceite de motor,1,Kia,Picanto 1.0,G3LA,DEMO-C1\nD-1005,2026-10-10,DEM-101,74100,producto,Aceite semisintético 4L,1,Kia,Picanto 1.0,G3LA,DEMO-C1\nD-5001,2026-10-12,DEM-505,12000,servicio,Revisión general,1,Suzuki,Swift,,DEMO-C5\n';
  const MUESTRA_ERRORES = 'ods_id,fecha,placa,km,tipo_linea,descripcion,cantidad\nD-6001,2026-10-11,DEM-101,74500,servicio,Cambio de aceite de motor,1\nD-6002,31/02/2026,DEM-202,abc,servicio,Servicio de frenos,1\nD-6003,2026-10-11,@@,95000,repuesto,,1\n';

  return { Sistema, nuevoSistemaDemo, CATALOGO, PERFIL, parseCSV, camposFaltantes, inferirAccion, accionCumple, norm, addMonths, addDays, monthsBetween, MUESTRA_VALIDA, MUESTRA_ERRORES, PERMISOS, intervaloPara, contextoKm, buscarEvidencias, coincide };
})();
if (typeof module !== 'undefined') module.exports = Motor;
