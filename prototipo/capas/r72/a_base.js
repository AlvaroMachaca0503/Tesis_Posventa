
/* ==========================================================================
   R7.2 · capa de mejoras solicitadas por el tesista (comentarios del 16/10/2026)
   Se agrega al final del script, igual que las capas R5/R6/R7. Cada bloque
   reemplaza funciones existentes por su nombre; nada del histórico se borra.
   ========================================================================== */
const R72={open:null,returnTo:null,sel:{},focus:null,collapsed:new Set(),reportTab:'ventas',rf:{}};
function r72Store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('rm72-'+k));localStorage.setItem('rm72-'+k,JSON.stringify(v))}catch{return null}}
const r72Role=()=>actorUser()?.role||'';
const r72IsTech=()=>['Técnico'].includes(r72Role());
const r72CanCost=()=>['Logístico','Administrador'].includes(r72Role());
const r72Commercial=()=>!r72IsTech();
const r72CanApprove=()=>['Cajera','Jefe de taller','Administrador'].includes(r72Role());
const r2=x=>Math.round((+x||0)*100)/100;
const q4=x=>Math.round((+x||0)*4)/4;
const r72Logistics=()=>db.users.filter(u=>u.active&&u.role==='Logístico');
const r72Advisors=()=>db.users.filter(u=>u.active&&['Cajera','Administrador','Jefe de taller'].includes(u.role));
function r72Now(){const d=new Date();return {date:d.toLocaleDateString('en-CA'),time:timeText(d.getHours()*60+d.getMinutes())}}
function r72Opt(items,value,empty){return (empty!=null?`<option value="">${esc(empty)}</option>`:'')+items.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(value??'')?'selected':''}>${esc(t)}</option>`).join('')}
function r72End(date,start,hours){if(!(hours>0))return start;const e=blockEnd({start,hours:q4(hours)||0.25,date});return e>start?e:start+hours*60}
const R72_TRASH='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h2v-8h-2z"/></svg>';

/* --- importes: en servicios la cantidad es H-H y NO multiplica el precio; en productos sí --- */
function r72LineSubtotal(l){if(l.price==null||l.price==='')return null;return l.type==='servicio'?r2(l.price):r2((+l.qty||0)*l.price)}
function r72LineTotal(l){const s=r72LineSubtotal(l);return s==null?null:r2(s-(+l.discount||0))}
function r72LineCost(l){if(l.cost==null||l.cost==='')return null;return l.type==='servicio'?r2(l.cost):r2((+l.qty||0)*l.cost)}
function r72LineProfit(l){const t=r72LineTotal(l),c=r72LineCost(l);return t==null||c==null?null:r2(t-c)}
function r72OrderTotal(o){const ls=o?.lines||[];if(!ls.length)return 0;return ls.every(l=>l.price!=null&&l.price!=='')?r2(ls.reduce((s,l)=>s+r72LineTotal(l),0)):null}
lineAmount=function(l){return r72LineTotal(l)};
function r72Hours(box){return q4((box.lines||[]).filter(l=>l.type==='servicio').reduce((a,l)=>a+(+l.hours||0),0))}
function r72Duration(box){const h=r72Hours(box);return h>0?h:(+box.durationH||1)}

/* --- catálogo con código de referencia (datos de demostración, precios referenciales) --- */
const R72_CATALOG=[
 ['S0101','Cambio de aceite de motor','servicio',30,0.5],['S0102','Cambio de filtro de aire','servicio',15,0.25],['S0103','Revisión general preventiva','servicio',50,1],
 ['S0104','Cambio de líquido de frenos','servicio',60,1],['S0105','Cambio de refrigerante','servicio',50,1],['S0106','Cambio de bujías','servicio',40,0.75],
 ['S0107','Servicio de cabina / ventilación','servicio',25,0.5],['S0108','Cambio de pastillas de freno delanteras','servicio',60,1],['S0109','Afinamiento de motor','servicio',120,2],
 ['S0110','Diagnóstico con escáner','servicio',40,0.5],['S0111','Cambio de palier delantero','servicio',80,1.5],['S0112','Cambio de aceite de caja manual','servicio',40,0.75],
 ['P0201','Aceite de motor 20W-50 · litro','producto',20,null,14],['P0202','Filtro de aceite','producto',20,null,12],['P0203','Filtro de aire','producto',30,null,18],
 ['P0204','Líquido de frenos DOT4 · 500 ml','producto',22,null,14],['P0205','Refrigerante · galón','producto',40,null,28],['P0206','Bujía de iridio','producto',35,null,22],
 ['P0207','Pastillas de freno delanteras','producto',110,null,70],['P0208','Filtro de cabina','producto',35,null,20],['P0209','Aceite de caja GL-4 80W-90 · litro','producto',25,null,16],
 ['P0210','Huaipe · paquete','producto',2,null,1.5],['P0211','Abrazadera','producto',3.5,null,2.5],['P0212','Silicona negra','producto',12,null,8]];
function r72CatLabel(c){return (c.code?c.code+' - ':'')+c.name}
function r72LineLabel(l){return (l.code?l.code+' - ':'')+(l.name||'')}

/* --- contenedores: «o:<id>» = ODS, «q:<id>» = cotización de una cita --- */
function r72Box(k){if(!k)return null;const [t,id]=k.split(':');return t==='o'?db.orders.find(o=>o.id===id):db.r72quotes.find(q=>q.id===id)}
function r72Cita(k){const b=r72Box(k);return k?.startsWith('q:')?db.appointments.find(a=>a.id===b?.appointment):db.appointments.find(a=>a.id===b?.appointment)}
function r72BoxVehicle(k){const b=r72Box(k);if(!b)return {};if(k.startsWith('o:'))return vehicle(b.vehicle);return vehicle(r72Cita(k)?.vehicle)}
function r72BoxLabel(k){const b=r72Box(k);if(!b)return '—';if(k.startsWith('o:'))return 'ODS '+b.code+' · '+(vehicle(b.vehicle).plate||'sin placa');const a=r72Cita(k);return b.code+' (cita '+(vehicle(a?.vehicle).plate||client(a?.client).name||'sin vehículo')+')'}
function r72BoxSched(k){const b=r72Box(k);if(!b)return null;if(k.startsWith('o:'))return {date:b.date,start:minutes(b.time||'08:00')};const a=r72Cita(k);return a?{date:a.date,start:minutes(a.time||'08:00')}:null}
function r72BoxLocked(k){const b=r72Box(k);if(!b)return true;if(k.startsWith('o:'))return b.state==='Archivada';const a=r72Cita(k);return !!b.usedBy||['Completada','Cancelada','No asistió'].includes(a?.state)&&!!a?.order}
function r72Log(k,kind,text){if(k?.startsWith('o:'))r7Log(k.slice(2),kind,text);else{const a=r72Cita(k);if(a){a.log??=[];a.log.push({date:new Date().toISOString(),actor,kind,text})}}}

/* --- refresco de modales: el modal abierto se vuelve a pintar tras cada cambio --- */
function r72Show(html,ref){const m=$('modal'),b=$('modalbody'),st=m.scrollTop;b.innerHTML=html;R72.open=ref||null;if(!m.open)m.showModal();m.scrollTop=st;if(R72.focus){const el=b.querySelector(`[data-focus="${R72.focus}"]`);R72.focus=null;if(el){el.focus();r72Suggest(el)}}}
function r72Reopen(ref=R72.open){if(!ref)return;if(ref.kind==='ods')r72OpenOrder(ref.id);else if(ref.kind==='cita')r72OpenCita(ref.id)}
function r72Commit(action,detail){const ref=R72.open,wasOpen=$('modal').open;save(action,detail);if(ref&&wasOpen)r72Reopen(ref)}
function r72Refresh(){if(R72.open&&$('modal').open)r72Reopen();else render()}
function r72Sub(kind,id,fn,...args){R72.returnTo={kind,id};window[fn](...args)}
const r72SaveBase=save;
save=function(action,detail){const back=R72.returnTo;R72.returnTo=null;r72SaveBase(action,detail);if(back)setTimeout(()=>{if(!$('modal').open)r72Reopen(back)},0)};
const r72CloseBase=closeModal;
closeModal=function(){R72.returnTo=null;R72.open=null;r72CloseBase()};
