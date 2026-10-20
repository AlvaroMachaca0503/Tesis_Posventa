
/* --------------------------------------------------------------------------
   R7.7 · Tablas: columna «Acciones» con menú desplegable, paginación,
   columnas que se ajustan al ancho de la pantalla y arrastre táctil
   -------------------------------------------------------------------------- */
R77.pg={};
/* 1) La columna Acciones pasa a ser un solo botón ⚙ que despliega las acciones */
const r77TableBase=table;
table=function(headers,rows){const html=r77TableBase(headers,rows),tpl=document.createElement('template');tpl.innerHTML=html;const t=tpl.content.querySelector('table.r74-t');if(!t)return html;
  t.querySelectorAll('td.r74-act').forEach(td=>{if(!td.querySelector('button'))return;const src=td.innerHTML;td.innerHTML=`<div class="r77-optw"><button type="button" class="r77-opt" aria-haspopup="menu" aria-label="Acciones" title="Acciones" onclick="r77Menu(event,this)">⚙<small>▾</small></button><div class="r77-src" hidden>${src}</div></div>`});
  return tpl.innerHTML};
function r77MenuClose(){document.getElementById('r77menu')?.remove();document.querySelectorAll('.r77-opt.on').forEach(b=>b.classList.remove('on'))}
function r77Menu(e,btn){e.stopPropagation();const was=btn.classList.contains('on');r77MenuClose();if(was)return;const src=[...btn.parentElement.querySelectorAll('.r77-src button')];if(!src.length)return;
  const m=document.createElement('div');m.id='r77menu';m.className='r77-menu';m.setAttribute('role','menu');
  src.forEach(b=>{const label=(b.title||b.getAttribute('aria-label')||b.textContent||'').trim(),it=document.createElement('button');it.type='button';it.className='r77-mi'+(b.classList.contains('r73-red')?' red':'');it.disabled=b.disabled;it.setAttribute('role','menuitem');it.innerHTML=`<span class="r77-mic">${b.innerHTML}</span><span>${esc(label)}</span>`;it.onclick=ev=>{ev.stopPropagation();r77MenuClose();b.click()};m.appendChild(it)});
  document.body.appendChild(m);btn.classList.add('on');const r=btn.getBoundingClientRect(),mw=m.offsetWidth,mh=m.offsetHeight;let x=Math.min(Math.max(8,r.left),innerWidth-mw-8),y=r.bottom+4;if(y+mh>innerHeight-8)y=Math.max(8,r.top-mh-4);m.style.left=x+'px';m.style.top=y+'px'}
document.addEventListener('pointerdown',e=>{if(!e.target.closest?.('#r77menu,.r77-opt'))r77MenuClose()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')r77MenuClose()});
window.addEventListener('resize',r77MenuClose);document.addEventListener('scroll',r77MenuClose,true);
/* 2) Paginación (estilo del sistema anterior: «1 al 10 de N», tamaño de página y números) */
function r77TableOf(bar){return bar.previousElementSibling?.querySelector?.('table.r74-t')}
function r77Pager(t){if(!t.tBodies[0])return;const sig=t.dataset.sig,st=R77.pg[sig]??={p:1,n:10},rows=[...t.tBodies[0].rows].filter(r=>!r.querySelector('.empty')&&!r.hidden),total=rows.length,pages=Math.max(1,Math.ceil(total/st.n));st.p=Math.min(Math.max(1,st.p),pages);const a=(st.p-1)*st.n;rows.forEach((r,i)=>{r.dataset.pg=i>=a&&i<a+st.n?'1':'0'});
  const host=t.closest('.r74-tw')||t.parentElement;let bar=host.nextElementSibling;if(!bar||!bar.classList.contains('r77-pager')){host.insertAdjacentHTML('afterend','<div class="r77-pager"></div>');bar=host.nextElementSibling}
  const from=total?a+1:0,to=Math.min(total,a+st.n);let s=Math.max(1,st.p-2),e=Math.min(pages,s+4);s=Math.max(1,e-4);const nums=[];for(let i=s;i<=e;i++)nums.push(i);
  bar.innerHTML=`<span class="r77-pc">${from} al ${to} de ${total}</span><select class="r77-ps" aria-label="Filas por página" onchange="r77PgSize(this)">${[10,25,50,100].map(n=>`<option ${n===st.n?'selected':''}>${n}</option>`).join('')}</select><span class="r77-pn" role="navigation" aria-label="Páginas"><button type="button" ${st.p<=1?'disabled':''} onclick="r77Pg(this,1)" aria-label="Primera">⏮</button><button type="button" ${st.p<=1?'disabled':''} onclick="r77Pg(this,${st.p-1})" aria-label="Anterior">‹</button>${nums.map(i=>`<button type="button" class="${i===st.p?'on':''}" onclick="r77Pg(this,${i})">${i}</button>`).join('')}<button type="button" ${st.p>=pages?'disabled':''} onclick="r77Pg(this,${st.p+1})" aria-label="Siguiente">›</button><button type="button" ${st.p>=pages?'disabled':''} onclick="r77Pg(this,${pages})" aria-label="Última">⏭</button></span>`}
function r77PgSize(sel){const t=r77TableOf(sel.closest('.r77-pager'));if(!t)return;R77.pg[t.dataset.sig].n=+sel.value;R77.pg[t.dataset.sig].p=1;r77Pager(t)}
function r77Pg(btn,p){const t=r77TableOf(btn.closest('.r77-pager'));if(!t)return;R77.pg[t.dataset.sig].p=p;r77Pager(t)}
const r77ApplyBase=r74Apply;r74Apply=function(t){r77ApplyBase(t);r77Pager(t)};
/* 3) Ancho: las columnas se reparten el ancho disponible; cada una tiene un mínimo */
const R77_FLOOR=52;
function r77Reflow(t){if(!t.classList.contains('r75-fixed')||!t.tHead)return;const cg=t.querySelector('colgroup'),cols=[...(cg?.children||[])],ths=[...t.tHead.rows[0].cells];if(!cols.length||cols.length!==ths.length)return;
  if(t._cg!==cg||!t._w){t._cg=cg;t._w=cols.map(c=>parseInt(c.style.width)||60)}
  const host=t.closest('.r74-tw')||t.parentElement,room=Math.floor((host?.clientWidth||0)-2);if(room<120)return;
  const flex=ths.map(th=>!(th.classList.contains('r74-nro')||th.classList.contains('r74-act'))),floor=ths.map(th=>th.classList.contains('r74-nro')?46:th.classList.contains('r74-act')?64:R77_FLOOR),sum=a=>a.reduce((x,y)=>x+y,0);
  let w=t._w.slice();
  if(sum(w)<room){const fx=sum(w.filter((_,j)=>flex[j]));if(fx){const extra=room-sum(w);w=w.map((x,j)=>flex[j]?x+extra*x/fx:x)}}
  else if(sum(w)>room){const slack=w.map((x,j)=>flex[j]?Math.max(0,x-floor[j]):0),S=sum(slack),take=Math.min(sum(w)-room,S);if(S)w=w.map((x,j)=>x-take*slack[j]/S)}
  cols.forEach((c,j)=>c.style.width=Math.floor(w[j])+'px');t.style.width=Math.floor(sum(w))+'px'}
function r77TablesPost(root=document){root.querySelectorAll('table.r74-t').forEach(t=>{try{r77Pager(t);r77Reflow(t)}catch(err){console.warn('r77 tablas',err)}})}
const r77RenderTbl=render;render=function(){r77RenderTbl();r77TablesPost(document)};
const r77ShowBase=r72Show;r72Show=function(html,ref){r77ShowBase(html,ref);r77TablesPost($('modalbody'))};
let r77RzT=0;const r77RzAll=()=>{cancelAnimationFrame(r77RzT);r77RzT=requestAnimationFrame(()=>{document.querySelectorAll('table.r74-t.r75-fixed').forEach(r77Reflow)})};
window.addEventListener('resize',r77RzAll);window.addEventListener('orientationchange',r77RzAll);['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(r77RzAll,120)));
if(window.ResizeObserver){const ro=new ResizeObserver(r77RzAll),m=document.querySelector('main');if(m)ro.observe(m)}
/* al soltar el borde de una columna (ratón), ese ancho pasa a ser el «ideal» */
let r77LastRz=null;
document.addEventListener('mousedown',e=>{const h=e.target.closest?.('.r75-rz');if(h)r77LastRz=h.closest('table')},true);
document.addEventListener('mouseup',()=>{const t=r77LastRz;r77LastRz=null;if(!t)return;t._w=[...t.querySelectorAll('col')].map(c=>parseInt(c.style.width)||60);r77Reflow(t)});
/* arrastre de columnas con el dedo */
let r77Drag=null;
document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const h=e.target.closest?.('.r75-rz');if(!h)return;e.preventDefault();e.stopPropagation();const t=h.closest('table'),j=+h.dataset.j,col=t.querySelectorAll('col')[j];r77Drag={t,j,col,x:e.clientX,w:parseInt(col.style.width)||h.parentElement.offsetWidth,id:e.pointerId};try{h.setPointerCapture(e.pointerId)}catch{}},true);
document.addEventListener('pointermove',e=>{if(!r77Drag||e.pointerId!==r77Drag.id)return;const {t,col,x,w}=r77Drag;col.style.width=Math.max(40,w+e.clientX-x)+'px';t.style.width=[...t.querySelectorAll('col')].reduce((a,c)=>a+(parseInt(c.style.width)||0),0)+'px'});
const r77DragEnd=e=>{if(!r77Drag||e.pointerId!==r77Drag.id)return;const {t}=r77Drag;r77Drag=null;const w=[...t.querySelectorAll('col')].map(c=>parseInt(c.style.width));r75CW()[t.dataset.sig]=w;t._w=w;try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}r77Reflow(t)};
document.addEventListener('pointerup',r77DragEnd);document.addEventListener('pointercancel',r77DragEnd);
document.addEventListener('dblclick',e=>{const h=e.target.closest?.('.r75-rz');if(!h)return;const t=h.closest('table');setTimeout(()=>{t._w=null;r77Reflow(t)},0)},true);
/* Al tocar y deslizar el navegador cancela el puntero; el sistema base volvía a pintar todo y la línea temporal regresaba a su sitio */
document.addEventListener('pointercancel',e=>{if(!drag&&!r5Drag)e.stopImmediatePropagation()},true);
