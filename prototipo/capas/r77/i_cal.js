
/* --------------------------------------------------------------------------
   R7.7 · Calendario: los eventos se mueven con el ratón o con el dedo
   (mantener pulsado). Regla de la ODS: el primer cambio de día fija la fecha
   y la hora de ingreso; después, mover el evento ya no las cambia.
   -------------------------------------------------------------------------- */
/* el evento de una ODS puede tener su propia programación sin tocar la hora de llegada */
const r77SchedBase=r72BoxSched;
r72BoxSched=function(k){const s=r77SchedBase(k);if(s&&k.startsWith('o:')){const b=r72Box(k);if(b?.ev?.date)return {date:b.ev.date,start:minutes(b.ev.time||b.time||'08:00')}}return s};
/* fechas en las columnas y celdas del calendario */
const r77CalBase=r74Cal;
r74Cal=function(ctx,items){let h=r77CalBase(ctx,items);const c=R74.cal[ctx]??={mode:'Semana',date:today()},d=new Date(c.date+'T12:00:00'),iso=x=>x.toLocaleDateString('en-CA');let dates=[];
  if(c.mode==='Mes'){const y=d.getFullYear(),m=d.getMonth(),off=new Date(y,m,1).getDay();for(let i=0;i<42;i++)dates.push(iso(new Date(y,m,1-off+i)));let i=0;return h.replace(/<div class="r74-mday/g,()=>`<div data-date="${dates[i++]}" class="r74-mday`)}
  const n={'Día':1,'4 días':4,'Semana':7}[c.mode],start=new Date(d);if(c.mode==='Semana')start.setDate(d.getDate()-d.getDay());for(let i=0;i<n;i++){const x=new Date(start);x.setDate(start.getDate()+i);dates.push(iso(x))}
  let i=0;return h.replace(/<div class="r74-dcol">/g,()=>`<div class="r74-dcol" data-date="${dates[i++]}">`)};
/* marca los eventos que se pueden mover */
function r77CalPrep(){document.querySelectorAll('.r74-ev').forEach(b=>{if(b.dataset.mv)return;const on=b.getAttribute('onclick')||'',t=/openTaskPanel\('([^']+)'\)/.exec(on),c=/r72OpenCita\('([^']+)'\)/.exec(on);if(t){b.dataset.mv='t';b.dataset.id=t[1]}else if(c){b.dataset.mv='c';b.dataset.id=c[1]}})}
const r77CalRender=render;render=function(){r77CalRender();try{r77CalPrep()}catch{}};
/* mover un evento */
function r77MoveEv(kind,id,date,time){const hm=m=>timeText(Math.max(0,Math.min(23*60+45,Math.round(m/15)*15)));
  if(kind==='c'){const a=db.appointments.find(x=>x.id===id);if(!a)return;if(a.order||['Completada','Cancelada','No asistió'].includes(a.state))return toast('Esta cita ya no se puede mover.');const dur=a.endTime&&(!a.endDate||a.endDate===a.date)?minutes(a.endTime)-minutes(a.time):null;const prevA={date:a.date,time:a.time,endTime:a.endTime,endDate:a.endDate};
    a.date=date;if(time){a.time=time;if(dur!=null&&dur>0){a.endTime=timeText(minutes(time)+dur);a.endDate=date}}else if(a.endDate)a.endDate=date;if(a.quote){try{r72SyncEvent('q:'+a.quote);r72SyncBlocks('q:'+a.quote)}catch{}}if(a.quote&&db.blocks.filter(b=>b.r72k==='q:'+a.quote).some(bb=>!validSlot(bb.tech,bb.date,bb.start,bb.hours,bb.id))){Object.assign(a,prevA);try{r72SyncEvent('q:'+a.quote);r72SyncBlocks('q:'+a.quote)}catch{}render();return toast('Horario sin capacidad: el técnico ya tiene dos eventos a esa hora (un tercero no se permite).')}R73.lastText='Cita '+(a.code||'')+' movida al '+date+(time?' '+time:'');return save('Cita movida',a.code||'')}
  const t=db.tasks.find(x=>x.id===id);if(!t)return;
  if(t.r72k?.startsWith('o:')){const k=t.r72k,o=r72Box(k);if(!o)return;if(r72BoxLocked(k))return toast('La ODS cerrada no se puede mover.');const old={date:o.ev?.date||o.date,time:o.ev?.time||o.time||'08:00'},nt=time||old.time;const keep={ev:o.ev?{...o.ev}:undefined,date:o.date,time:o.time,lock:o.arrivalLocked};o.ev={date,time:nt};let txt='Evento de la ODS '+o.code+' movido al '+date+' '+nt;
    if(date!==old.date&&!o.arrivalLocked){o.date=date;o.time=nt;o.arrivalLocked=true;txt+=' · primer cambio de día: la fecha y hora de ingreso quedan en '+date+' '+nt;r7Log(o.id,'Ingreso reprogramado','Primer cambio de día: fecha y hora de ingreso '+date+' '+nt)}
    else if(date!==old.date)r7Log(o.id,'Evento movido','Nuevo día '+date+' (la fecha y hora de ingreso ya estaban fijadas)');
    r72SyncEvent(k);r72SyncBlocks(k);
    if(db.blocks.filter(b=>b.r72k===k).some(b=>!validSlot(b.tech,b.date,b.start,b.hours,b.id))){o.ev=keep.ev;o.date=keep.date;o.time=keep.time;o.arrivalLocked=keep.lock;r72SyncEvent(k);r72SyncBlocks(k);render();return toast('Horario sin capacidad: el técnico ya tiene dos eventos a esa hora (un tercero no se permite) o el día no es laborable.')}
    R73.lastText=txt;return save('Evento movido',o.code)}
  if(t.r72k?.startsWith('q:')){const a=r72Cita(t.r72k);if(a)return r77MoveEv('c',a.id,date,time)}
  const dd=Math.round((new Date(date+'T12:00:00')-new Date((t.start||t.due||date)+'T12:00:00'))/864e5),sh=x=>x?new Date(new Date(x+'T12:00:00').getTime()+dd*864e5).toLocaleDateString('en-CA'):x;
  const dur=t.endTime&&t.startTime&&(t.end||t.due)===(t.start||t.due)?minutes(t.endTime)-minutes(t.startTime):null;
  t.start=date;t.end=sh(t.end)||date;t.due=sh(t.due)||date;if(time){t.startTime=time;if(dur!=null&&dur>0)t.endTime=timeText(minutes(time)+dur)}
  R73.lastText='Tarea «'+t.title+'» movida al '+date+(time?' '+time:'');save('Tarea movida',t.title)}
/* arrastre con ratón (al mover 6 px) o con el dedo (mantener pulsado) */
let r77Mv=null,r77NoClick=false;
function r77MvClear(){if(!r77Mv)return;clearTimeout(r77Mv.timer);r77Mv.ghost?.remove();r77Mv.el.classList.remove('r77-lift');document.querySelectorAll('.r77-drop').forEach(x=>x.classList.remove('r77-drop'));document.body.classList.remove('r77-dragging');r77Mv=null}
function r77MvTarget(x,y){const el=document.elementFromPoint(x,y),col=el?.closest?.('[data-date]');if(!col)return null;const body=col.querySelector?.('.r74-dbody');let time=null;if(body&&el.closest('.r74-dbody')){const r=body.getBoundingClientRect(),ph=44,H0=7;time=timeText(Math.round(((y-r.top)/ph+H0)*4)/4*60)}return {col,date:col.dataset.date,time}}
document.addEventListener('pointerdown',e=>{if(e.button>0)return;const el=e.target.closest?.('.r74-ev[data-mv]');if(!el)return;r77MvClear();const touch=e.pointerType!=='mouse';
  r77Mv={el,x:e.clientX,y:e.clientY,id:e.pointerId,touch,started:false};if(touch)r77Mv.timer=setTimeout(()=>{if(r77Mv&&!r77Mv.moved){r77Mv.started=true;el.classList.add('r77-lift');document.body.classList.add('r77-dragging');try{navigator.vibrate?.(15)}catch{}}},380)},true);
document.addEventListener('pointermove',e=>{const m=r77Mv;if(!m||e.pointerId!==m.id)return;const dx=e.clientX-m.x,dy=e.clientY-m.y,far=Math.hypot(dx,dy);
  if(!m.started){if(m.touch){if(far>9){m.moved=true;clearTimeout(m.timer)}return}if(far>6){m.started=true;m.el.classList.add('r77-lift');document.body.classList.add('r77-dragging')}else return}
  if(!m.ghost){const g=document.createElement('div');g.className='r77-ghost';g.textContent=m.el.textContent.trim().slice(0,60);document.body.appendChild(g);m.ghost=g}
  m.ghost.style.left=(e.clientX+10)+'px';m.ghost.style.top=(e.clientY+10)+'px';document.querySelectorAll('.r77-drop').forEach(x=>x.classList.remove('r77-drop'));const t=r77MvTarget(e.clientX,e.clientY);if(t){t.col.classList.add('r77-drop');m.ghost.dataset.when=t.date+(t.time?' '+t.time:'');m.ghost.textContent=m.el.textContent.trim().slice(0,40)+' → '+t.date+(t.time?' '+t.time:'')}},true);
document.addEventListener('touchmove',e=>{if(r77Mv?.started)e.preventDefault()},{passive:false});
const r77MvEnd=e=>{const m=r77Mv;if(!m||e.pointerId!==m.id)return;const was=m.started,t=was&&e.type==='pointerup'?r77MvTarget(e.clientX,e.clientY):null,kind=m.el.dataset.mv,id=m.el.dataset.id;r77MvClear();if(was){r77NoClick=true;setTimeout(()=>r77NoClick=false,350);if(t)r77MoveEv(kind,id,t.date,t.time)}};
document.addEventListener('pointerup',r77MvEnd,true);document.addEventListener('pointercancel',r77MvEnd,true);
document.addEventListener('click',e=>{if(r77NoClick&&e.target.closest?.('.r74-ev')){e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{if(r77Mv?.started||r77Mv?.touch&&e.target.closest?.('.r74-ev'))e.preventDefault()});
