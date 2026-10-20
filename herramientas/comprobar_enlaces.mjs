// Comprueba que las rutas citadas en los documentos propios existan.
// Revisa: enlaces markdown [txt](ruta) y rutas entre comillas invertidas que empiezan por una carpeta conocida.
// Uso:  node herramientas/comprobar_enlaces.mjs            (sale con código 1 si falta alguna)
// No revisa docs/contexto, docs/historial ni RMotriz_tesis_contexto (son copias/originales con sus propias rutas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTEXTO = path.basename(RAIZ) === 'fuentes-proyecto' ? path.dirname(RAIZ) : RAIZ;
const CARPETAS = ['docs', 'specs', 'herramientas', 'tesis', 'prototipo', 'nucleo-referencia', 'diagramas', 'agentes', 'src', 'tests', 'archivo', 'entregables', 'tmp', 'avance_implementacion', 'RMotriz_tesis_contexto'];
const ARCHIVOS_RAIZ = ['AGENTS.md', 'CLAUDE.md', 'README.md'];  // REGISTRO_CAMBIOS.md y docs/PROPUESTA_* son históricos: citan rutas que ya cambiaron

const revisar = [];
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = path.relative(RAIZ, p).replace(/\\/g, '/');
    if (e.isDirectory()) {
      if (/^(docs\/(contexto|historial|referencias|evidencias)|tesis|prototipo|nucleo-referencia|diagramas|entregables|tmp|avance_implementacion|RMotriz_tesis_contexto|archivo|herramientas\/bin|\.estado|\.git|node_modules)(\/|$)/.test(rel)) continue;
      recorrer(p);
    } else if (e.name.endsWith('.md') && !/^PROPUESTA_/.test(e.name)) revisar.push(p);
  }
};
for (const f of ARCHIVOS_RAIZ) if (fs.existsSync(path.join(RAIZ, f))) revisar.push(path.join(RAIZ, f));
for (const d of ['docs', 'specs', 'agentes', '.agents']) if (fs.existsSync(path.join(RAIZ, d))) recorrer(path.join(RAIZ, d));
// docs/contexto/PROCEDENCIA.md y docs/plan se incluyen (la regla de arriba excluye contexto entero; se añade a mano)
revisar.push(path.join(RAIZ, 'docs', 'contexto', 'PROCEDENCIA.md'));

const falta = [];
let total = 0;
const existe = (ruta) => {
  const limpia = ruta.replace(/[#?].*$/, '').replace(/\/+$/, '').replace(/^\.\//, '');
  if (!limpia) return true;
  if (/[*{}<>$]/.test(limpia) || /\s/.test(limpia) && !fs.existsSync(path.join(RAIZ, limpia))) return null; // patrón, plantilla o texto
  if (fs.existsSync(path.join(RAIZ, limpia))) return true;
  const remapeos = [
    ['tesis/latex/', path.join(CONTEXTO, 'fuentes-latex') + path.sep],
    ['tesis/uml_R76/', path.join(CONTEXTO, 'archivo', 'tesis-restante', 'uml_R76') + path.sep],
    ['tesis/historial/', path.join(CONTEXTO, 'archivo', 'tesis-restante', 'historial') + path.sep],
    ['RMotriz_tesis_contexto/', path.join(CONTEXTO, 'RMotriz_tesis_contexto') + path.sep],
    ['avance_implementacion/', path.join(CONTEXTO, 'archivo', 'avance_implementacion') + path.sep],
    ['entregables/', path.join(CONTEXTO, 'archivo', 'entregables') + path.sep],
    ['tmp/', path.join(CONTEXTO, 'archivo', 'tmp') + path.sep],
    ['archivo/', path.join(CONTEXTO, 'archivo') + path.sep],
  ];
  for (const [prefijo, destino] of remapeos) {
    if (limpia === prefijo.slice(0, -1)) return fs.existsSync(destino.slice(0, -1));
    if (limpia.startsWith(prefijo)) return fs.existsSync(path.join(destino, limpia.slice(prefijo.length)));
  }
  return false;
};

for (const f of [...new Set(revisar)]) {
  if (!fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  const dirF = path.dirname(f);
  // 1) enlaces markdown
  for (const m of t.matchAll(/\]\(([^)\s]+)\)/g)) {
    const r = m[1];
    if (/^(https?:|mailto:|#)/.test(r)) continue;
    total++;
    const abs = path.resolve(dirF, r.replace(/[#?].*$/, ''));
    if (!fs.existsSync(abs)) falta.push(`${path.relative(RAIZ, f)} → enlace roto: ${r}`);
  }
  // 2) rutas entre comillas invertidas
  for (const m of t.matchAll(/`([^`\n]+)`/g)) {
    const r = m[1].trim();
    const primera = r.split('/')[0];
    const esRaiz = ARCHIVOS_RAIZ.includes(r);
    if (!(CARPETAS.includes(primera) && r.includes('/')) && !esRaiz) continue;
    if (/^(node|powershell|python|py|java|npm|npx|cd|git)\b/.test(r)) continue;
    const e = existe(r);
    if (e === null) continue;
    total++;
    if (!e) falta.push(`${path.relative(RAIZ, f)} → ruta inexistente: ${r}`);
  }
}
console.log(`Referencias comprobadas: ${total} en ${new Set(revisar).size} documentos.`);
if (falta.length) { console.log(`FALTAN ${falta.length}:`); [...new Set(falta)].forEach((x) => console.log('  ' + x)); process.exit(1); }
console.log('Todas existen.');
