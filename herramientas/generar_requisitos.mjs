// Genera docs/requisitos/CLASIFICACION_RF.csv y docs/requisitos/CATALOGO_RF.md
// a partir de la matriz de trazabilidad R7.6 (../fuentes-latex/trazabilidad_R76.csv).
// Uso:  node herramientas/generar_requisitos.mjs
// Es reproducible: si cambia la matriz, se vuelve a ejecutar. No inventa datos de la matriz.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTEXTO = path.basename(RAIZ) === 'fuentes-proyecto' ? path.dirname(RAIZ) : RAIZ;
const ENTRADA = path.join(CONTEXTO, 'fuentes-latex', 'trazabilidad_R76.csv');
const SALIDA = path.join(RAIZ, 'docs', 'requisitos');

// ---------- 1. Alcance según las FUENTES (docs/contexto/13_CATALOGO_RF_01_84.md y la matriz R7) ----------
const alcanceFuente = (n) => {
  if ([30, 37].includes(n)) return 'Opcional';
  if (n === 22) return 'Núcleo de investigación (alcance de IA por cerrar)';
  if (n === 32) return 'Núcleo solo si hay modelo';
  if (n === 44) return 'Núcleo (regla por confirmar)';
  if (n >= 50 && n <= 52) return 'Extensión';
  if (n >= 53 && n <= 58) return 'Evolución';
  if (n >= 72 && n <= 84) return 'Evolución';
  if (n >= 85) return 'Sin clasificar en las fuentes (añadido en R7.1–R7.6)';
  return 'Núcleo';
};

// ---------- 2. Incremento PROPUESTO (derivación del asistente; requiere confirmación del investigador) ----------
// 'alta' = el bloque T1–T5 de docs/contexto/06_ALCANCE_TOTAL_VS_TESIS.md lo nombra expresamente.
// 'media' = deducido por afinidad temática. 'baja' = ambiguo; se deja PENDIENTE.
const mapa = {};
const poner = (inc, conf, ids) => ids.forEach((n) => { mapa[n] = { inc, conf }; });
poner('INC-01', 'alta', [1, 2, 3, 4, 5, 6, 7, 21, 23, 62, 63, 64, 65]);
poner('INC-01', 'media', [8, 28, 29, 31, 49, 70, 71, 88, 89, 103, 107, 110, 111]);
poner('INC-02', 'alta', [9, 10, 11, 25, 26, 27]);
poner('INC-02', 'media', [30]);
poner('INC-03', 'alta', [42, 43, 45, 46, 47, 48, 61, 66, 67, 68, 69]);
poner('INC-03', 'media', [35, 44, 60, 101, 108]);
poner('INC-04', 'alta', [12, 13, 14, 15, 17]);
poner('INC-04', 'media', [22, 32, 33, 34, 85, 86, 87, 92, 99, 100, 112, 117]);
poner('INC-05', 'alta', [16]);
poner('INC-06', 'alta', [18, 19, 20, 24, 36, 38, 40, 41, 59]);
poner('INC-06', 'media', [37, 39, 90, 104, 105, 106, 115, 116]);
poner('INC-07', 'alta', [50, 51, 52, 72, 73, 74, 75, 76, 77, 78, 79]);
poner('INC-07', 'media', [91]);
poner('EVOLUCION', 'alta', [53, 54, 55, 56, 57, 58, 80, 81, 82, 83, 84]);
poner('EVOLUCION', 'media', [95, 96, 97, 98, 109]);
poner('TRANSVERSAL', 'media', [102, 113]);
poner('PENDIENTE', 'baja', [93, 94, 114]);

const NOTA_PENDIENTE = {
  93: 'Reportes operativos: ¿núcleo o evolución? Depende del corte comercial (decisión abierta).',
  94: 'Cotizaciones generales: R7.3 las ubica en el núcleo; falta decidir si van en INC-01 o INC-06.',
  114: 'Métricas mensuales (fórmulas Tuulapp): ¿núcleo o evolución? Depende del corte de evaluación.',
};

// ---------- 3. Lectura del CSV ----------
const t = fs.readFileSync(ENTRADA, 'utf8').replace(/^﻿/, '');
const filas = []; let fila = [], campo = '', comillas = false;
for (let i = 0; i < t.length; i++) {
  const c = t[i];
  if (comillas) { if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else comillas = false; } else campo += c; }
  else if (c === '"') comillas = true;
  else if (c === ',') { fila.push(campo); campo = ''; }
  else if (c === '\n') { fila.push(campo.replace(/\r$/, '')); filas.push(fila); fila = []; campo = ''; }
  else campo += c;
}
if (campo || fila.length) { fila.push(campo); filas.push(fila); }
const cab = filas[0];
const col = (n) => { const i = cab.indexOf(n); if (i < 0) throw new Error('Falta la columna ' + n); return i; };
const iRF = col('RF'), iReq = col('Requisito / criterio'), iOrig = col('Origen'), iComp = col('Componente / CU'),
  iDatos = col('Datos'), iPrueba = col('Prueba / estado'), iCodigo = col('Código verificado'), iObj = col('Código objetivo'), iClases = col('Clases utilizadas');
const datos = filas.slice(1).filter((r) => /^RF-\d+$/.test(r[iRF]));
if (datos.length !== 117) console.warn('Aviso: se esperaban 117 requisitos y hay', datos.length);

const tablasDe = (s) => { const m = /tablas?:\s*([^;]+)/i.exec(s || ''); return m ? m[1].trim() : ''; };
const estadoPrueba = (s) => {
  const x = s || '';
  const m = /Prueba automatizada ([\w.]+) \(([\d/]+)[^)]*\) PASÓ/.exec(x);
  if (m) return `Prueba automatizada ${m[1]} (${m[2]}) PASÓ; demostración local`;
  if (/Pendiente/.test(x) && !/Demostración/.test(x)) return 'Prueba PR pendiente (según la matriz R7.6)';
  if (/Demostración HTML/.test(x) || /demonstration verified/.test(x)) return 'Demostración local verificada (HTML)';
  return x.slice(0, 80);
};
const csvCampo = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const registros = datos.map((r) => {
  const n = +r[iRF].slice(3);
  const m = mapa[n] || { inc: 'PENDIENTE', conf: 'baja' };
  return {
    rf: r[iRF], n, requisito: r[iReq], origen: r[iOrig], alcance_fuente: alcanceFuente(n),
    incremento_propuesto: m.inc, confianza_mapeo: m.conf, nota: NOTA_PENDIENTE[n] || '',
    estado_prototipo: estadoPrueba(r[iPrueba]), funcion_prototipo: r[iCodigo], objetivo: r[iObj],
    tablas: tablasDe(r[iDatos]), clases: r[iClases],
  };
});

// ---------- 4. Salidas ----------
fs.mkdirSync(SALIDA, { recursive: true });
const cols = ['rf', 'requisito', 'alcance_fuente', 'incremento_propuesto', 'confianza_mapeo', 'estado_prototipo', 'funcion_prototipo', 'tablas', 'clases', 'nota'];
const csv = [cols.join(',')].concat(registros.map((x) => cols.map((c) => csvCampo(x[c])).join(','))).join('\n');
fs.writeFileSync(path.join(SALIDA, 'CLASIFICACION_RF.csv'), '﻿' + csv, 'utf8');

const incs = ['INC-01', 'INC-02', 'INC-03', 'INC-04', 'INC-05', 'INC-06', 'INC-07', 'EVOLUCION', 'TRANSVERSAL', 'PENDIENTE'];
const titulo = {
  'INC-01': 'Base operativa (usuarios, sedes, clientes, vehículos, ODS, bitácora, auditoría, maestros)',
  'INC-02': 'Importación XLSX/CSV (idempotente, atómica, conciliación)',
  'INC-03': 'Servicios, tareas y agenda de técnicos',
  'INC-04': 'Plan preventivo, aplicabilidad y línea temporal',
  'INC-05': 'Reajuste del futuro con evidencia de ODS',
  'INC-06': 'Posventa: seguimiento, contacto, citas, llegada y retorno',
  'INC-07': 'Productos y logística (extensión opcional)',
  EVOLUCION: 'Evolución empresarial (visión futura, no comprometida)',
  TRANSVERSAL: 'Transversales de interfaz',
  PENDIENTE: 'Sin asignar: requiere decisión del investigador',
};
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
let md = `# Catálogo de requisitos RF-01 a RF-117 con incremento propuesto

Generado el ${hoy} por \`herramientas/generar_requisitos.mjs\` desde \`../fuentes-latex/trazabilidad_R76.csv\` (matriz R7.6). **No editar a mano:** vuelve a ejecutar el script.

## Cómo leerlo
- **Alcance (fuente):** lo que dicen los documentos del contexto (\`docs/contexto/13_CATALOGO_RF_01_84.md\` y la matriz). Para RF-85 a RF-117 las fuentes **no** los clasifican (se añadieron en R7.1–R7.6).
- **Incremento propuesto:** asignación **del asistente**, derivada de \`docs/contexto/06_ALCANCE_TOTAL_VS_TESIS.md\`. **No es una decisión del investigador.** Confianza *alta* = el documento nombra la función en ese bloque; *media* = deducido por afinidad; *baja* = ambiguo (queda PENDIENTE).
- **Estado en el prototipo:** lo que dice la matriz sobre R7.6. "Demostración local" **no** es "implementado": el prototipo no tiene servidor ni autenticación real.

## Resumen por incremento propuesto

| Incremento | Descripción | RF | Con prueba automatizada en el prototipo | Prueba PR pendiente |
|---|---|---:|---:|---:|
`;
for (const k of incs) {
  const g = registros.filter((x) => x.incremento_propuesto === k);
  md += `| ${k} | ${titulo[k]} | ${g.length} | ${g.filter((x) => /Prueba automatizada/.test(x.estado_prototipo)).length} | ${g.filter((x) => /^Prueba PR pendiente/.test(x.estado_prototipo)).length} |\n`;
}
for (const k of incs) {
  const g = registros.filter((x) => x.incremento_propuesto === k);
  md += `\n## ${k} — ${titulo[k]}\n\n| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo |\n|---|---|---|---|---|\n`;
  for (const x of g) md += `| ${x.rf} | ${x.requisito.replace(/\|/g, '\\|').slice(0, 220)}${x.nota ? ' **Nota:** ' + x.nota : ''} | ${x.alcance_fuente} | ${x.confianza_mapeo} | ${x.estado_prototipo} |\n`;
}
fs.writeFileSync(path.join(SALIDA, 'CATALOGO_RF.md'), md, 'utf8');

// ---------- 5. Tablas por incremento para las especificaciones ----------
const DIR_SPECS = path.join(RAIZ, 'specs', 'requisitos-por-incremento');
fs.mkdirSync(DIR_SPECS, { recursive: true });
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
for (const k of incs) {
  const g = registros.filter((x) => x.incremento_propuesto === k);
  let t = `# Requisitos de ${k} — ${titulo[k]}\n\nGenerado el ${hoy} por \`herramientas/generar_requisitos.mjs\`. **No editar a mano.** Incremento *propuesto* por el asistente; ver \`docs/requisitos/CATALOGO_RF.md\` para el significado de las columnas.\n\n`;
  t += `| RF | Requisito | Alcance (fuente) | Conf. | Estado en el prototipo | Función del prototipo (R7.6) | Tablas | Clases (UML) |\n|---|---|---|---|---|---|---|---|\n`;
  for (const x of g) t += `| ${x.rf} | ${esc(x.requisito)}${x.nota ? ' **Nota:** ' + esc(x.nota) : ''} | ${esc(x.alcance_fuente)} | ${x.confianza_mapeo} | ${esc(x.estado_prototipo)} | ${esc(x.funcion_prototipo)} | ${esc(x.tablas)} | ${esc(x.clases)} |\n`;
  fs.writeFileSync(path.join(DIR_SPECS, k + '.md'), t, 'utf8');
}

console.log(`Requisitos leídos: ${registros.length}`);
for (const k of incs) console.log(k.padEnd(12), registros.filter((x) => x.incremento_propuesto === k).length);
const sin = registros.filter((x) => !mapa[x.n]);
if (sin.length) console.log('Sin mapa explícito (quedaron PENDIENTE):', sin.map((x) => x.rf).join(', '));
