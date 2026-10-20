
/* --------------------------------------------------------------------------
   R7.7 · Permisos por rol (matriz en docs/requisitos/MATRIZ_PERMISOS_R77.md)
   Niveles: A ver, editar y acciones sensibles · E ver y editar · V solo ver ·
   - sin acceso (el módulo ni aparece). Es de demostración: no hay autenticación
   ni autorización en servidor.
   -------------------------------------------------------------------------- */
const R77_RK=['Administrador','Jefe de taller','Cajera','Técnico','Logístico','Externo','Finanzas'];
const R77_RN={Administrador:'Superusuario','Jefe de taller':'Jefe de taller',Cajera:'Cajera','Técnico':'Técnico','Logístico':'Logístico',Externo:'Técnico externo',Finanzas:'Asistente administrativo de finanzas'};
function r77RoleKey(){const u=db.users.find(x=>x.id===actor);if(!u)return 'Administrador';return u.external?'Externo':(R77_RK.includes(u.role)?u.role:'Técnico')}
const r77Lv=id=>{const row=R77_PERM_DATA.rows.find(r=>r.id===id);if(!row)return 'A';return row.lv[R77_RK.indexOf(r77RoleKey())]||'-'};
const r77CanDo=aid=>{const a=R77_PERM_DATA.actions.find(x=>x.id===aid);return !a||a.who.includes('AJCTLXF'[R77_RK.indexOf(r77RoleKey())])};
const r77PermLabel=id=>(R77_PERM_DATA.rows.find(r=>r.id===id)||{}).label||id;
/* el menú solo muestra lo que el rol puede ver */
const r77ItemPerm=r75Item;
r75Item=function(id,sub){return r77Lv(id)==='-'?'':r77ItemPerm(id,sub)};
const r77NavPerm=r75Nav;
r75Nav=function(){r77NavPerm();document.querySelectorAll('#nav .r75-sec').forEach(s=>{if(!s.querySelector('.r75-sub'))s.remove()})};
/* acceso denegado: cada módulo valida el nivel del rol (Bancos conserva su propio aviso) */
function r77Deny(k){const home=['inicio','ods','tareas'].find(x=>r77Lv(x)!=='-')||'tareas';return heading('Sin acceso','')+`<div class="panel"><p>Tu rol (<b>${esc(R77_RN[r77RoleKey()])}</b>) no tiene acceso a «${esc(r77PermLabel(k))}». Si lo necesitas, pídeselo al superusuario.</p>${button('Ir al inicio',`go('${home}')`,true)}</div>`}
Object.keys(views).forEach(k=>{const b=views[k];if(typeof b!=='function'||b.__perm||k==='bancos')return;const f=function(){if(r77Lv(k)==='-')return r77Deny(k);return b.apply(this,arguments)};f.__perm=1;views[k]=f});
/* solo lectura: se ocultan los botones de crear y de editar */
const r77RenderPerm=render;
let r77LastRole=null;
render=function(){r77RenderPerm();try{const rk=actor+'|'+r77RoleKey();if(rk!==r77LastRole){r77LastRole=rk;r75Nav()}document.body.classList.toggle('r77-ro',r77Lv(page)==='V');if(r77Lv(page)==='V')document.querySelectorAll('#view>.heading .row button,#view>.heading .row label.button').forEach(b=>{if(/^[+＋]|nuev|agreg|crear|emitir|registr|cargar|import|ingres|editar|guardar|apertur|simular/i.test(b.textContent.trim()))b.classList.add('r77-hide-ro')});document.body.dataset.rol=r77RoleKey();document.querySelectorAll('header button[onclick="openLogin()"]').forEach(b=>{b.textContent='Cambiar usuario'})}catch(err){console.warn('r77 permisos',err)}};
const r77MenuPerm=r77Menu;
r77Menu=function(e,btn){r77MenuPerm(e,btn);try{if(document.body.classList.contains('r77-ro')){const m=document.getElementById('r77menu');if(m){m.querySelectorAll('.r77-mi').forEach(i=>{if(!/ver|abrir|imprimir|detalle|bit[aá]cora|historial|descargar/i.test(i.textContent))i.remove()});if(!m.querySelector('.r77-mi'))r77MenuClose()}}}catch{}};
