
/* --------------------------------------------------------------------------
   R7.7 · Funciones BETA (simuladas, se implementan más adelante)
   - Acciones nuevas de las reglas: cambiar prioridad, estado, lista o persona
     de una tarea (reales) y acciones con Gmail, Chat, Calendar, Drive, Docs,
     Sheets, WhatsApp y Gemini (beta: solo se registran en «Actividad simulada»).
   - Explorar con categorías laterales, estilo ClickUp.
   - Páginas beta: Integraciones, Chat del equipo, CRM de posventa y Gemini.
   - Evidencias de contacto (capturas y audios) en las tareas.
   Etiquetas: «tesis» = parte de la tesis · «beta» = simulado · sin etiqueta =
   por implementar.
   -------------------------------------------------------------------------- */
const R77_BETA=new Set(['integraciones','gemini']);
const R77_INTA={gmail:'Enviar correo (Gmail) · beta',chat:'Mensaje en Google Chat · beta',whatsapp:'Mensaje por WhatsApp · beta',drive:'Crear carpeta en Drive · beta',calendar:'Crear evento en Calendar · beta',docs:'Crear documento en Docs · beta',sheets:'Añadir fila en Sheets · beta',gemini:'Resumen con Gemini · beta'};
const R77_TASKACT={asignar:'Reasignar la tarea',prioridad:'Cambiar la prioridad de la tarea',estado:'Cambiar el estado de la tarea',mover:'Mover la tarea a otra lista',crmcerrar:'Cerrar el contacto del CRM (sin respuesta)'};
Object.entries(R77_TASKACT).forEach(([k,v])=>R77_AT.push([k,v]));Object.entries(R77_INTA).forEach(([k,v])=>R77_AT.push([k,v]));
const r77NewActBase3=r77NewAct;
r77NewAct=function(t){const c=r74AutoCfg();if(R77_INTA[t])return {type:t,owner:c.owner,title:''};if(t==='asignar')return {type:t,owner:c.owner,title:'x'};if(t==='prioridad')return {type:t,owner:'-',title:'Alta'};if(t==='estado')return {type:t,owner:'-',title:'En proceso'};if(t==='mover')return {type:t,owner:'-',title:(db.lists[0]||{}).id||'general'};if(t==='crmcerrar')return {type:t,owner:'-',title:'x'};return r77NewActBase3(t)};
/* editor de las acciones nuevas */
const r77EdActBase3=r77EdAct;
r77EdAct=function(i,a){const dr=R77.dr,head=()=>`<div class="r77-bl1"><select class="r77-big" onchange="r77SetActType(${i},this.value)">${R77_AT.map(([k,l])=>`<option value="${k}" ${a.type===k?'selected':''}>${esc(l)}</option>`).join('')}</select>${dr.actions.length>1?`<button type="button" class="r77-trash" title="Quitar acción" onclick="r77DelAct(${i})">🗑</button>`:''}</div>`;
  if(R77_TASKACT[a.type]){const u=db.users.filter(x=>x.active).map(x=>[x.id,x.name+' · '+x.role]),S=(p,items,v)=>`<select onchange="r77Set('actions.${i}.${p}',this.value)">${r72Opt(items,v)}</select>`;
    const f=a.type==='crmcerrar'?'<p class="sub">Marca el contacto como Completada con resultado «Sin respuesta» (no cuenta como conversión).</p>':a.type==='asignar'?`<label>Asignar a ${S('owner',u,a.owner)}</label>`:a.type==='prioridad'?`<label>Nueva prioridad ${S('title',['Baja','Normal','Alta','Urgente'].map(x=>[x,x]),a.title)}</label>`:a.type==='estado'?`<label>Nuevo estado ${S('title',r6States().map(x=>[x,x]),a.title)}</label>`:`<label>Lista destino ${S('title',db.lists.map(l=>[l.id,l.name]),a.title)}</label>`;
    return `<div class="r77-blk">${head()}${f}<div class="r77-note">Solo para sucesos de tareas: cambia la tarea que disparó la regla.</div></div>`}
  if(R77_INTA[a.type]){let h=r77EdActBase3(i,{...a,type:'aviso'});h=h.replace('<option value="aviso" selected>','<option value="aviso">').replace(`<option value="${a.type}">`,`<option value="${a.type}" selected>`).replace('<label>Para','<label>Destinatario').replace('Mensaje *','Texto *');
    return h.replace(/<\/div>$/,`<div class="r77-note"><span class="r77-betapill">beta</span> Simulado: se registra en Integraciones › Actividad simulada. Cuando se conecte la cuenta de la empresa, se enviará de verdad.</div></div>`)}
  return r77EdActBase3(i,a)};
const r77ValBase3=r77Validate;
r77Validate=function(r){const e=r77ValBase3(r);if(e)return e;for(const a of r.actions||[])if(R77_TASKACT[a.type]&&r77Tr(r.trigger)?.[2]!=='task')return 'La acción «'+r77ActLabel(a)+'» solo se puede usar cuando el suceso es una tarea.';return ''};
/* ejecución */
const r77ActBase3=r77Act;
r77Act=function(r,a,e,x,write){
  if(R77_TASKACT[a.type]){const t=e.ent;if(!t||t.deleted)return {txt:'No hay tarea',skip:true};
    if(a.type==='crmcerrar'){if(!t.crm)return {txt:'No es un contacto del CRM',skip:true};if(write){t.state='Completada';t.doneAt=new Date().toISOString();t.crm.outcome='sin_respuesta';(t.crm.msgs??=[]).push({dir:'sys',text:'Cerrado automáticamente: sin respuesta de la persona tras el plazo de la regla.',at:new Date().toISOString()})}return {txt:(write?'Cerró':'Cerraría')+' el contacto «'+t.title+'» (sin respuesta)'}}
    if(a.type==='asignar'){if(write)t.owner=a.owner;return {txt:(write?'Reasignó':'Reasignaría')+' la tarea «'+t.title+'» a '+(db.users.find(u=>u.id===a.owner)?.name||a.owner)}}
    if(a.type==='prioridad'){if(write)t.priority=a.title;return {txt:(write?'Cambió':'Cambiaría')+' la prioridad de «'+t.title+'» a '+a.title}}
    if(a.type==='estado'){if(!r6States().includes(a.title))return {txt:'Estado no válido',skip:true};if(write){t.state=a.title;if(a.title==='Completada')t.doneAt=new Date().toISOString()}return {txt:(write?'Cambió':'Cambiaría')+' el estado de «'+t.title+'» a '+a.title}}
    if(write)t.list=a.title;return {txt:(write?'Movió':'Movería')+' la tarea «'+t.title+'» a la lista '+(db.lists.find(l=>l.id===a.title)?.name||a.title)}}
  if(R77_INTA[a.type]){const d=r77Db(),title=r77Fill(a.title,x),who=db.users.find(u=>u.id===a.owner)?.name||a.owner,on=r77IntOn(a.type);
    if(write){(d.sim??=[]).unshift({id:uid(),at:new Date().toISOString(),ch:a.type,to:who,text:title,rule:r.name,real:false});d.sim=d.sim.slice(0,200)}
    return {txt:(write?'Simuló':'Simularía')+' «'+R77_INTA[a.type].replace(' · beta','')+'» para '+who+': «'+title+'»'+(on?'':' (integración sin conectar: solo queda registrado)')}}
  return r77ActBase3(r,a,e,x,write)};
/* ---------- integraciones ---------- */
const R77_INT=[
 ['gmail','Gmail','✉','personal','Correos individuales y de grupo. Enviar notas de venta, citas y avisos desde el sistema y guardar los correos de cada cliente como contexto.'],
 ['calendar','Google Calendar','📅','personal','Citas y eventos de cada colaborador en su calendario; mover una cita aquí la mueve allá.'],
 ['drive','Google Drive','🗂','personal','Una carpeta por cliente, vehículo y ODS con fotos, documentos y comprobantes.'],
 ['docs','Google Docs','📄','personal','Informes de la ODS, actas y resúmenes como documentos compartidos.'],
 ['sheets','Google Sheets','▦','personal','Exportar reportes y ventas a hojas de cálculo que se actualizan solas.'],
 ['chat','Google Chat','💬','personal','Hablar con el colaborador desde aquí o abrir el Chat; las tareas se avisan por Chat.'],
 ['gemini','Gemini','✦','personal','Cada persona usa su cuenta: resúmenes, análisis de evidencias y recomendaciones de mejora con todo el contexto del sistema.'],
 ['whatsapp','WhatsApp','🟢','empresa','Canal de la empresa: mensajes de clientes al CRM y respuestas desde el sistema.'],
 ['facebook','Facebook','f','empresa','Mensajes y comentarios al embudo del CRM.'],
 ['instagram','Instagram','◎','empresa','Mensajes directos al embudo del CRM.'],
 ['tiktok','TikTok','♪','empresa','Mensajes y comentarios al embudo del CRM.']];
const r77IntDb=()=>{const d=r77Db();d.integ??={};return d.integ};
const r77IntOn=id=>{const i=r77IntDb()[id];if(!i)return false;const m=R77_INT.find(x=>x[0]===id);return m?.[3]==='empresa'?!!i.company:!!(i.users&&i.users[actor])};
function r77IntToggle(id){const m=R77_INT.find(x=>x[0]===id),d=r77IntDb();d[id]??={company:false,users:{}};const i=d[id];
  if(m[3]==='empresa'){i.company=!i.company;i.acc=i.company?(document.getElementById('r77acc-'+id)?.value||'cuenta de la empresa'):''}else{if(i.users[actor])delete i.users[actor];else i.users[actor]=(document.getElementById('r77acc-'+id)?.value||'').trim()||(db.users.find(u=>u.id===actor)?.email||actor)}
  save(r77IntOn(id)?'Integración conectada (simulada)':'Integración desconectada',m[1])}
function betaPill(){return '<span class="r77-betapill">beta</span>'}
const r77LegendHtml=()=>`<p class="r77-legend"><span class="r75-tag">tesis</span> parte de la tesis · ${betaPill()} simulado, se implementa más adelante · <i>sin etiqueta</i> = por implementar en el sistema real.</p>`;
views.integraciones=()=>{const d=r77IntDb(),sim=(r77Db().sim||[]).slice(0,30),mine=db.users.find(u=>u.id===actor);
  const card=m=>{const on=r77IntOn(m[0]),i=d[m[0]]||{},n=Object.keys(i.users||{}).length;
    return `<div class="r77-int ${on?'on':''}"><div class="r77-inth"><span class="r77-ic">${m[2]}</span><b>${esc(m[1])}</b>${betaPill()}<span class="pill ${on?'green':''}">${on?'Conectada (simulada)':'Sin conectar'}</span></div><p class="sub">${esc(m[4])}</p><div class="row">${m[3]==='personal'?`<small class="sub">Cuenta de cada persona · ${n} conectada(s)</small>`:'<small class="sub">Cuenta de la empresa</small>'}</div><div class="row">${on?'':`<input id="r77acc-${m[0]}" placeholder="${m[3]==='personal'?esc(mine?.email||'correo@tudominio.com'):'cuenta de la empresa'}" aria-label="Cuenta">`}${button(on?'Desconectar':'Conectar',`r77IntToggle('${m[0]}')`,!on)}</div></div>`};
  return heading('Integraciones',`Google Workspace, Gemini y redes sociales. ${''}`,'')+r77LegendHtml()+`<div class="r77-note">Beta: aquí no se guardan claves ni tokens. «Conectar» solo simula la conexión para probar las reglas; la conexión real (OAuth de Google y APIs de Meta, WhatsApp y TikTok) se hará más adelante.</div><h2 class="r77-h2">Google Workspace y Gemini</h2><div class="r77-ints">${R77_INT.filter(m=>m[3]==='personal').map(card).join('')}</div><h2 class="r77-h2">Redes sociales y mensajería (CRM)</h2><div class="r77-ints">${R77_INT.filter(m=>m[3]==='empresa').map(card).join('')}</div><h2 class="r77-h2">Actividad simulada</h2>${sim.length?table(['Fecha','Canal','Para','Texto','Regla'],sim.map(s=>[esc(new Date(s.at).toLocaleString('es-PE')),esc(s.ch),esc(s.to),esc(s.text),esc(s.rule)])):'<p class="sub">Todavía no hay actividad. Se llena cuando una regla con acciones de Gmail, Chat, WhatsApp, etc. se ejecuta, o cuando respondes en el CRM.</p>'}`};
/* ---------- evidencias de contacto en las tareas ---------- */
const R77_NOEV=['Evento','Servicio','Producto'];
function r77EvAdd(tid,ev){const t=db.tasks.find(x=>x.id===tid);if(!t)return;(t.evidence??=[]).push({id:uid(),at:new Date().toISOString(),by:actor,...ev});save('Evidencia adjuntada',t.title)}
function r77EvPick(tid,inp){const f=inp.files[0];if(!f)return;const kind=/^audio/.test(f.type)?'audio':'captura',big=f.size>350000,meta={kind,name:f.name,size:f.size,type:f.type};if(big){toast('El archivo es grande: se guarda el nombre, no el contenido (beta).');return r77EvAdd(tid,{...meta,data:null})}const rd=new FileReader();rd.onload=()=>r77EvAdd(tid,{...meta,data:rd.result});rd.readAsDataURL(f)}
let r77Rc=null;
async function r77RecToggle(tid){if(r77Rc){r77Rc.stop();return}try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),mr=new MediaRecorder(st),ch=[];mr.ondataavailable=e=>ch.push(e.data);mr.onstop=()=>{st.getTracks().forEach(x=>x.stop());const b=new Blob(ch,{type:mr.mimeType||'audio/webm'});r77Rc=null;const rd=new FileReader();rd.onload=()=>r77EvAdd(tid,{kind:'audio',name:'Audio '+new Date().toLocaleTimeString('es-PE'),size:b.size,type:b.type,data:b.size>600000?null:rd.result});rd.readAsDataURL(b)};mr.start();r77Rc=mr;render()}catch{toast('No se pudo usar el micrófono. Adjunta un archivo de audio.')}}
function r77EvDel(tid,id){const t=db.tasks.find(x=>x.id===tid);if(!t)return;t.evidence=(t.evidence||[]).filter(x=>x.id!==id);save('Evidencia quitada',t.title)}
function r77ContactSet(tid,f,v){const t=db.tasks.find(x=>x.id===tid);if(!t)return;(t.contact??={})[f]=v;save('Contacto actualizado',t.title)}
const r77PanelBase3=r6TaskPanel;
r6TaskPanel=function(){const h=r77PanelBase3(),t=db.tasks.find(x=>x.id===r6PanelId);if(!h||!t||R77_NOEV.includes(t.type))return h;
  const ev=t.evidence||[],c=t.contact||{},S=(f,items)=>`<select onchange="r77ContactSet('${t.id}','${f}',this.value)"><option value="">—</option>${items.map(x=>`<option ${c[f]===x?'selected':''}>${x}</option>`).join('')}</select>`;
  const box=`<div class="r77-evbox"><b>📎 Evidencias del contacto ${betaPill()}</b><p class="sub">Primero WhatsApp y luego llamada: adjunta la captura del chat o el audio de la llamada. Gemini las usará para analizar el trato y la gestión.</p><div class="row"><label>Canal ${S('channel',['WhatsApp','Llamada','Correo','Presencial'])}</label><label>Resultado ${S('result',['Respondió amable','Respondió cortante','No respondió','Pendiente'])}</label></div><div class="row"><label class="button">📷 Adjuntar captura<input type="file" accept="image/*" hidden onchange="r77EvPick('${t.id}',this)"></label><label class="button">🎧 Adjuntar audio<input type="file" accept="audio/*" hidden onchange="r77EvPick('${t.id}',this)"></label><button type="button" class="${r77Rc?'primary':''}" onclick="r77RecToggle('${t.id}')">${r77Rc?'■ Detener grabación':'● Grabar audio'}</button></div>${ev.length?`<div class="r77-evs">${ev.map(e=>`<div class="r77-ev"><b>${e.kind==='audio'?'🎧':'📷'} ${esc(e.name||e.kind)}</b>${e.data?(e.kind==='audio'?`<audio controls src="${e.data}"></audio>`:`<img alt="captura" src="${e.data}">`):'<small class="sub">sin contenido guardado</small>'}<small class="sub">${esc(new Date(e.at).toLocaleString('es-PE'))} · ${esc(tech(e.by)||e.by||'')}</small><button type="button" class="r77-trash" onclick="r77EvDel('${t.id}','${e.id}')" title="Quitar">🗑</button></div>`).join('')}</div>`:'<p class="sub">Sin evidencias todavía.</p>'}</div>`;
  return h.replace('<div class="tabs">',box+'<div class="tabs">')};
/* ---------- Gemini ---------- */
function r77Stats(){const T=db.tasks.filter(t=>!t.deleted),isC=t=>/posventa|consulta km|confirmar cita|crm|llamar/i.test((t.tags||'')+' '+(t.title||'')),C=T.filter(isC),done=x=>x.state==='Completada',ev=x=>(x.evidence||[]).length>0,pct=(a,b)=>b?Math.round(a/b*100):0,
  L=T.filter(t=>t.r72log),res={};C.forEach(t=>{const r=t.contact?.result;if(r)res[r]=(res[r]||0)+1});const rn=Object.values(res).reduce((a,b)=>a+b,0),ow={};C.forEach(t=>{const o=tech(t.owner)||t.owner||'—';ow[o]??={n:0,ev:0};ow[o].n++;if(ev(t))ow[o].ev++});
  const sv=(db.r74surveys||[]).filter(s=>!s.deleted),nps=sv.map(s=>+s.answers?.nps).filter(n=>isFinite(n));
  return {c:{n:C.length,done:C.filter(done).length,ev:C.filter(ev).length,evPct:pct(C.filter(ev).length,C.length),res,rn,ow},l:{n:L.length,done:L.filter(done).length,ev:L.filter(ev).length,evPct:pct(L.filter(ev).length,L.length)},sv:{n:sv.length,avg:nps.length?Math.round(nps.reduce((a,b)=>a+b,0)/nps.length*10)/10:null},deb:db.clients.filter(c=>r77Debt(c.id)>0).length,crm:db.tasks.filter(t=>t.type==='CRM'&&!t.deleted).length,rules:r77Db().rules.filter(r=>r.active).length}}
function r77GemAdvice(s){const a=[];if(s.c.n&&s.c.evPct<60)a.push(`Solo el ${s.c.evPct} % de las tareas de contacto tiene evidencia. Pide a la cajera adjuntar la captura de WhatsApp y el audio de la llamada.`);if(s.l.n&&s.l.evPct<60)a.push(`Logística: el ${100-s.l.evPct} % de sus tareas no tiene evidencia de compra o entrega. Haz obligatoria la captura de la compra al completar la tarea.`);if(s.c.rn){const bad=((s.c.res['Respondió cortante']||0)+(s.c.res['No respondió']||0));if(bad/s.c.rn>.3)a.push(`El ${Math.round(bad/s.c.rn*100)} % de los contactos fue cortante o no respondió: conviene revisar el guion de llamada y el horario.`)}if(s.sv.n&&s.sv.avg!=null&&s.sv.avg<8)a.push(`La recomendación promedio de las encuestas es ${s.sv.avg}/10: activa la plantilla «Recomendación baja → notificar».`);if(s.deb)a.push(`${s.deb} cliente(s) con deuda pendiente: usa la regla «Cliente con deuda» y revisa Cuentas por cobrar.`);if(!s.crm)a.push('Aún no hay contactos en el CRM: conecta WhatsApp e Instagram para empezar el embudo.');if(s.rules<12)a.push('Activa más reglas de «Explorar» para automatizar avisos y seguimientos.');if(!a.length)a.push('Todo se ve bien con los datos actuales. Sigue registrando evidencias para afinar el análisis.');return a}
R77.gem={q:'',a:''};
function r77GemAsk(){const q=(document.getElementById('r77gem-q')?.value||'').trim();R77.gem.q=q;const s=r77Stats(),l=q.toLowerCase();let a;
  if(/evidenc|captura|audio/.test(l))a=`De ${s.c.n} tareas de contacto, ${s.c.ev} tienen evidencia (${s.c.evPct} %). En logística: ${s.l.ev} de ${s.l.n} (${s.l.evPct} %).`;
  else if(/llam|amable|cortante|trato|cajera/.test(l))a=s.c.rn?`Resultados registrados: ${Object.entries(s.c.res).map(([k,v])=>k+' '+Math.round(v/s.c.rn*100)+' %').join(' · ')}.`:'Aún no hay resultados de contacto registrados. Anótalos en cada tarea (Canal y Resultado).';
  else if(/deuda|cobrar/.test(l))a=`${s.deb} cliente(s) con deuda pendiente.`;
  else if(/encuesta|recomend|nps/.test(l))a=s.sv.n?`${s.sv.n} encuestas, recomendación promedio ${s.sv.avg}/10.`:'Todavía no hay encuestas respondidas.';
  else if(/mejor|falta|recomienda|sugiere/.test(l))a=r77GemAdvice(s).join(' ');
  else a='Pregunta de ejemplo: «¿qué porcentaje de llamadas tiene evidencia?», «¿cómo fue el trato de la cajera?» o «¿qué mejoras faltan?».';
  R77.gem.a=a;render()}
views.gemini=()=>{const s=r77Stats(),on=r77IntOn('gemini'),pc=(n,t)=>t?Math.round(n/t*100):0;
  const stat=(t,v,sub)=>`<div class="r77-use"><small>${t}</small><b>${v}</b><small>${sub}</small></div>`;
  return heading('Asistente Gemini','Analiza todo lo que pasa en el sistema y recomienda mejoras.','')+r77LegendHtml()+`<div class="r77-note">Beta: <b>simulado</b>. Las cifras se calculan con los datos reales del sistema; las respuestas son reglas fijas que imitan lo que haría Gemini. ${on?'Tu cuenta de Gemini está conectada (simulada).':'Conecta tu cuenta de Gemini en Integraciones (cada persona usa la suya).'}</div><div class="r77-cards">${stat('Tareas de contacto con evidencia',s.c.evPct+' %',s.c.ev+' de '+s.c.n)}${stat('Logística con evidencia',s.l.evPct+' %',s.l.ev+' de '+s.l.n)}${stat('Encuestas',s.sv.n,s.sv.avg!=null?'recomendación promedio '+s.sv.avg+'/10':'sin respuestas')}${stat('Clientes con deuda',s.deb,'según Cuentas por cobrar')}${stat('Contactos en el CRM',s.crm,'beta')}${stat('Reglas activas',s.rules,'automatizaciones')}</div>${s.c.rn?`<h2 class="r77-h2">Trato en los contactos</h2><p>${Object.entries(s.c.res).map(([k,v])=>`<span class="pill">${esc(k)} ${pc(v,s.c.rn)} %</span>`).join(' ')}</p>`:''}<h2 class="r77-h2">Evidencia por persona</h2>${Object.keys(s.c.ow).length?table(['Persona','Tareas de contacto','Con evidencia','%'],Object.entries(s.c.ow).map(([k,v])=>[esc(k),v.n,v.ev,pc(v.ev,v.n)+' %'])):'<p class="sub">Sin tareas de contacto.</p>'}<h2 class="r77-h2">Mejoras sugeridas ${betaPill()}</h2><ul>${r77GemAdvice(s).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h2 class="r77-h2">Pregúntale a Gemini ${betaPill()}</h2><div class="row"><input id="r77gem-q" class="r77-gq" placeholder="Ej.: ¿qué porcentaje de llamadas tiene evidencia?" value="${esc(R77.gem.q)}" onkeydown="if(event.key==='Enter')r77GemAsk()"><button class="primary" onclick="r77GemAsk()">Preguntar</button></div>${R77.gem.a?`<div class="r77-note"><b>Respuesta simulada:</b> ${esc(R77.gem.a)}</div>`:''}`};
/* ---------- menú: páginas y etiqueta beta ---------- */
(function(){R75_MODS.integraciones=['⚭','Integraciones'];R75_MODS.gemini=['✦','Asistente Gemini'];
  const cfg=R75_NAV.find(n=>n.sec==='Configuración');
  ['integraciones','gemini'].forEach(i=>{if(cfg&&!cfg.items.includes(i))cfg.items.splice(cfg.items.indexOf('estados')>=0?cfg.items.indexOf('estados')+1:cfg.items.length,0,i)});r75Rebuild()})();
const r77ItemBase3=r75Item;
r75Item=function(id,sub){const h=r77ItemBase3(id,sub);return R77_BETA.has(id)?h.replace(/<\/button>$/,'<span class="r75-tag r77-betatag">beta</span></button>'):h};
/* ---------- Explorar con categorías laterales ---------- */
R77.cat=R77.cat||'todas';
const R77_INTCATS=['Gmail','Google Chat','Google Calendar','Google Drive','Google Docs y Sheets','WhatsApp','Gemini'];
function r77ExploreBody(){const tp=r77Templates(),cats=[...new Set(tp.map(t=>t.cat))],cur=R77.cat,catsN=cats.filter(c=>!R77_INTCATS.includes(c)&&c!=='Popular'),intN=R77_INTCATS.filter(c=>cats.includes(c)),
  it=(id,l,n)=>`<button type="button" class="${cur===id?'on':''}" onclick="R77.cat='${id}';render()">${esc(l)}<small>${n}</small></button>`,cnt=c=>tp.filter(t=>t.cat===c).length;
  const side=`<nav class="r77-xs">${it('todas','Todas',tp.length)}${cats.includes('Popular')?it('Popular','Popular',cnt('Popular')):''}<h4>Categorías</h4>${catsN.map(c=>it(c,c,cnt(c))).join('')}<h4>Integraciones <span class="r77-betapill">beta</span></h4>${intN.map(c=>it(c,c,cnt(c))).join('')}</nav>`;
  const show=cur==='todas'?cats:[cur],main=show.map(cat=>`<h2 class="r77-h2">${esc(cat)}</h2><div class="r77-cards">${tp.map((t,i)=>[t,i]).filter(([t])=>t.cat===cat).map(([t,i])=>`<button type="button" class="r77-card2" onclick="r77Tpl(${i})"><span class="r77-ic">${esc(t.icon)}</span><b>${esc(t.name)}${R77_INTCATS.includes(t.cat)?' '+betaPill():''}</b><small>${esc(t.desc)}</small></button>`).join('')}</div>`).join('');
  return `<div class="r77-xp">${side}<div class="r77-xm">${main}</div></div>`}
/* ---------- plantillas nuevas (tareas reales + integraciones beta) ---------- */
const r77TplBase3=r77Templates;
r77Templates=function(){const caja=r74AutoCfg().owner,jefe=db.users.find(u=>u.role==='Jefe de taller'&&u.active)?.id||caja,T=(cat,icon,name,desc,rule)=>({cat,icon,name,desc,rule}),N=(t,o)=>({...r77NewAct(t),...o}),G=(cat,icon,name,desc,trigger,type,title,conds=[],extra={})=>T(cat,icon,name,desc,{name,trigger,conds,actions:[N(type,{owner:caja,title})],...extra});
  return r77TplBase3().concat([
  T('Tareas','☑ → ⚑','Tarea atrasada → subir a Urgente','Cambia la prioridad de la tarea a Urgente cuando pasa su fecha límite.',{name:'Tarea atrasada → prioridad Urgente',trigger:'tarea_atrasada',conds:[],actions:[N('prioridad',{title:'Urgente'})]}),
  T('Tareas','☑ → ☑','Tarea completada → crear seguimiento','Cuando se completa una tarea, crea la tarea de seguimiento para la cajera.',{name:'Tarea completada → seguimiento',trigger:'tarea_completada',conds:[],actions:[N('tarea',{owner:caja,list:'postventa',dueN:2,title:'Seguimiento de: {tarea}'})]}),
  T('Tareas','☑ → ⚑','Tarea de cita creada → prioridad Alta','Pone prioridad Alta a las tareas de tipo Cita apenas se crean.',{name:'Tarea de cita → prioridad Alta',trigger:'tarea_creada',conds:[{k:'tipotarea',v:'Cita'}],actions:[N('prioridad',{title:'Alta'})]}),
  T('Tareas','☑ → ☻','Tarea creada → asignar al jefe de taller','Asigna al jefe de taller las tareas nuevas creadas a mano.',{name:'Tarea nueva → asignar al jefe de taller',trigger:'tarea_creada',conds:[],actions:[N('asignar',{owner:jefe})]}),
  T('Tareas','☑ → ⇥','Tarea en espera → mover a Posventa','Mueve a la lista Posventa las tareas que pasan a «En espera».',{name:'Tarea en espera → lista Posventa',trigger:'tarea_estado',p:{state:'En espera'},conds:[],actions:[N('mover',{title:'postventa'})]}),
  T('Tareas','⏰ → ◎','Vence hoy → pasar a En proceso','Cuando llega la fecha límite, pasa la tarea a «En proceso».',{name:'Vence hoy → En proceso',trigger:'tarea_vence',conds:[],actions:[N('estado',{title:'En proceso'})]}),
  G('Gmail','▤ → ✉','ODS cerrada → correo de agradecimiento','Envía un correo al cliente cuando se cierra su ODS.','ods_archivada','gmail','Gracias por confiar en nosotros, {cliente.nombre}. Tu ODS {ods.codigo} fue cerrada.'),
  G('Gmail','▧ → ✉','Nota de venta → correo con el comprobante','Envía la nota de venta al correo del cliente.','nota_creada','gmail','Adjuntamos la nota {nota} de {cliente.nombre}.',[{k:'campo',mod:'cliente',f:'correo',op:'tiene',v:''}]),
  G('Gmail','▣ → ✉','Cita creada → correo de confirmación','Confirma la cita por correo al cliente.','cita_creada','gmail','Tu cita {cita.codigo} es el {cita.fecha} a las {cita.hora}.'),
  G('Google Chat','▤ → 💬','ODS creada → mensaje al chat del taller','Avisa en Google Chat al jefe de taller cuando entra una ODS.','ods_creada','chat','Nueva ODS {ods.codigo} ({vehiculo.placa}).'),
  G('Google Chat','☑ → 💬','Tarea atrasada → Chat al responsable','Escribe por Chat cuando una tarea queda atrasada.','tarea_atrasada','chat','Tu tarea «{tarea}» está atrasada.'),
  G('Google Chat','⚙ → 💬','Producto aprobado → Chat al logístico','Avisa por Chat al logístico cuando se aprueba un producto.','producto_aprobado','chat','Aprobaron «{producto}» en la ODS {ods.codigo}.'),
  G('Google Calendar','▣ → 📅','Cita creada → evento en Calendar','Crea el evento de la cita en el calendario del asesor.','cita_creada','calendar','Cita {cita.codigo} · {vehiculo.placa}'),
  G('Google Calendar','▤ → 📅','ODS creada → bloquear tiempo del técnico','Bloquea el tiempo del técnico en su calendario.','ods_creada','calendar','Trabajo en la ODS {ods.codigo}'),
  G('Google Drive','▤ → 🗂','ODS creada → carpeta en Drive','Crea una carpeta de Drive para fotos y documentos de la ODS.','ods_creada','drive','ODS {ods.codigo} · {vehiculo.placa}'),
  G('Google Drive','◇ → 🗂','Vehículo nuevo → carpeta en Drive','Crea la carpeta del vehículo para su historial.','vehiculo_creado','drive','Vehículo {placa}'),
  G('Google Docs y Sheets','▤ → 📄','ODS cerrada → informe en Docs','Genera el informe de la ODS como documento.','ods_archivada','docs','Informe ODS {ods.codigo}'),
  G('Google Docs y Sheets','＄ → ▦','Pago registrado → fila en Sheets','Añade el pago a la hoja de ventas.','pago_registrado','sheets','{ods} · {cliente} · {monto}'),
  G('WhatsApp','▣ → 🟢','Cita creada → recordatorio por WhatsApp','Recordatorio de la cita al celular del cliente.','cita_creada','whatsapp','Hola {cliente.nombre}, te esperamos el {cita.fecha} a las {cita.hora}.',[{k:'celular',v:'si'}]),
  G('WhatsApp','▤ → 🟢','ODS en entrega → avisar por WhatsApp','Avisa al cliente que su vehículo está listo.','ods_estado','whatsapp','Tu vehículo {vehiculo.placa} está listo para entrega.',[{k:'celular',v:'si'}],{p:{state:'Entrega'}}),
  G('WhatsApp','▧ → 🟢','Nota de venta → enviar por WhatsApp','Envía la nota de venta por WhatsApp.','nota_creada','whatsapp','Te enviamos la nota {nota}.',[{k:'celular',v:'si'}]),
  T('Posventa','🎯 → 🔔','Contacto nuevo en el CRM → avisar a la cajera','Avisa a la cajera cuando se crea una tarea de tipo CRM.',{name:'Contacto nuevo en el CRM → avisar',trigger:'tarea_creada',conds:[{k:'tipotarea',v:'CRM'}],actions:[{type:'aviso',owner:caja,title:'Nuevo contacto en el CRM: {tarea}'}]}),
  G('Gemini','▤ → ✦','ODS cerrada → resumen con Gemini','Gemini resume la ODS para la bitácora.','ods_archivada','gemini','Resume la ODS {ods.codigo}: trabajos, costos y observaciones.'),
  G('Gemini','☺ → ✦','Encuesta respondida → análisis con Gemini','Gemini analiza la respuesta de la encuesta.','encuesta','gemini','Analiza la encuesta de {cliente.nombre} (ODS {ods.codigo}).')])};

const r77AddCondBase4=r77AddCond;
r77AddCond=function(){if(!r77CondsFor(R77.dr.trigger).length)return toast('Este suceso no admite condiciones.');return r77AddCondBase4()};
