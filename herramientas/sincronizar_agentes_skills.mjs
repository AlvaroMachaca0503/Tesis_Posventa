// Genera los agentes de Codex y de Claude Code desde UNA sola fuente y copia las skills.
//   Fuente de agentes : agentes/definiciones/<nombre>.md  (frontmatter: name, description, claude_tools)
//   Fuente de skills  : .agents/skills/<nombre>/SKILL.md  (la lee Codex tal cual)
//   Salida            : .codex/agents/<nombre>.toml
//                       .claude/agents/<nombre-con-guiones>.md
//                       .claude/skills/<nombre>/SKILL.md  (copia idéntica)
// Uso:  node herramientas/sincronizar_agentes_skills.mjs        (escribe)
//       node herramientas/sincronizar_agentes_skills.mjs --solo-comprobar   (no escribe; falla si hay diferencias)
// Edita SIEMPRE las fuentes; las salidas se regeneran.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOLO_COMPROBAR = process.argv.includes('--solo-comprobar');
let diferencias = 0;

function escribir(ruta, contenido) {
  const actual = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null;
  if (actual === contenido) return 'igual';
  diferencias++;
  if (!SOLO_COMPROBAR) { fs.mkdirSync(path.dirname(ruta), { recursive: true }); fs.writeFileSync(ruta, contenido, 'utf8'); }
  return actual === null ? 'nuevo' : 'cambiado';
}

function leerAgente(ruta) {
  const t = fs.readFileSync(ruta, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(t);
  if (!m) throw new Error('Falta el frontmatter en ' + ruta);
  const fm = {};
  for (const l of m[1].split('\n')) { const k = /^([a-z_]+):\s*(.*)$/.exec(l); if (k) fm[k[1]] = k[2].trim(); }
  for (const k of ['name', 'description']) if (!fm[k]) throw new Error(`Falta "${k}" en ${ruta}`);
  return { ...fm, cuerpo: m[2].trim() };
}

const dirDef = path.join(RAIZ, 'agentes', 'definiciones');
const defs = fs.readdirSync(dirDef).filter((f) => f.endsWith('.md')).sort();
console.log('Agentes definidos:', defs.length);
for (const f of defs) {
  const a = leerAgente(path.join(dirDef, f));
  // Codex: TOML. JSON.stringify produce una cadena válida de TOML (\n, \", \\ y \uXXXX).
  const toml = `name = ${JSON.stringify(a.name)}\ndescription = ${JSON.stringify(a.description)}\ndeveloper_instructions = ${JSON.stringify(a.cuerpo)}\n`;
  const r1 = escribir(path.join(RAIZ, '.codex', 'agents', a.name + '.toml'), toml);
  // Claude Code: markdown con frontmatter; el nombre usa guiones.
  const nombreClaude = a.name.replace(/_/g, '-');
  const tools = a.claude_tools ? `tools: ${a.claude_tools}\n` : '';
  const md = `---\nname: ${nombreClaude}\ndescription: ${a.description}\n${tools}---\n${a.cuerpo}\n`;
  const r2 = escribir(path.join(RAIZ, '.claude', 'agents', nombreClaude + '.md'), md);
  console.log(`  ${a.name.padEnd(28)} codex: ${r1.padEnd(8)} claude: ${r2}`);
}

// Skills: .agents/skills -> .claude/skills (copia idéntica)
const dirSk = path.join(RAIZ, '.agents', 'skills');
const skills = fs.readdirSync(dirSk, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
console.log('Skills:', skills.length);
for (const s of skills) {
  const orig = path.join(dirSk, s, 'SKILL.md');
  if (!fs.existsSync(orig)) { console.log(`  ${s}: SIN SKILL.md`); diferencias++; continue; }
  const r = escribir(path.join(RAIZ, '.claude', 'skills', s, 'SKILL.md'), fs.readFileSync(orig, 'utf8'));
  console.log(`  ${s.padEnd(34)} claude: ${r}`);
}

// Avisos de sobrantes (no se borra nada)
const sobrantes = [];
const cod = path.join(RAIZ, '.codex', 'agents');
if (fs.existsSync(cod)) for (const f of fs.readdirSync(cod)) if (f.endsWith('.toml') && !defs.includes(f.replace(/\.toml$/, '.md'))) sobrantes.push('.codex/agents/' + f);
const cla = path.join(RAIZ, '.claude', 'agents');
if (fs.existsSync(cla)) for (const f of fs.readdirSync(cla)) if (f.endsWith('.md') && !defs.includes(f.replace(/-/g, '_'))) sobrantes.push('.claude/agents/' + f);
if (sobrantes.length) console.log('Archivos sin fuente (revisar a mano, no se borran):', sobrantes.join(', '));

console.log(diferencias ? (SOLO_COMPROBAR ? `HAY ${diferencias} DIFERENCIA(S): ejecuta sin --solo-comprobar` : `Hecho: ${diferencias} archivo(s) escritos o cambiados.`) : 'Todo sincronizado.');
process.exit(SOLO_COMPROBAR && diferencias ? 1 : 0);
