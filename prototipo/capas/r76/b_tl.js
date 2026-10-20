
/* --------------------------------------------------------------------------
   Línea temporal compacta: botones pequeños arriba y un resumen de km
   plegable (contraído al entrar). Al expandirlo se ve en filas delgadas.
   -------------------------------------------------------------------------- */
const r76TlBase=views.timeline;
function r76TlTog(){R76.tlOpen=!R76.tlOpen;r72Store('tlOpen',R76.tlOpen);render()}
views.timeline=()=>{const h=r76TlBase(),i0=h.indexOf('<div class="panel r74-kmread">'),i1=h.indexOf('<p class="banner">Aceite');if(i0<0||i1<0)return h;const i2=h.indexOf('</p>',i1)+4,aceite=h.slice(i1,i2).replace(/^<p class="banner">|<\/p>$/g,'');
  const m=timelineModel(),v=m.v,rd=r74LastRead(v),ri=m.rateInfo,cur=simKm??m.estimate,n=x=>x==null||isNaN(x)?'—':Math.round(x).toLocaleString('es-PE'),o=R76.tlOpen;
  const chips=`<span class="r76-chip" title="Último ingreso con km">Últ. ingreso <b>${m.last?.km?n(m.last.km)+' km':'sin lectura'}</b>${m.last?.date?' · '+esc(m.last.date):''}</span><span class="r76-chip" title="Hoy estimado, no es lectura real">Hoy ≈ <b>${n(m.estimate)} km</b>${m.rate?' · '+n(m.rate)+' km/mes':''}</span><span class="r76-chip" title="Última consulta de km (sin visita)">Últ. consulta <b>${rd?n(rd.km)+' km':'sin consultas'}</b>${rd?' · '+esc(rd.date):''}</span><span class="r76-chip">Plan <b>${esc(m.plan?.id||'sin plan')}</b></span>${simKm!=null?`<span class="r76-chip on">Simulando <b>${n(cur)} km</b></span>`:''}`;
  const rows=o?`<div class="r76-kmd">
    <div><span>Último ingreso</span><b>${m.last?.km?n(m.last.km)+' km':'Sin lectura'}</b><small>${esc(m.last?.date||'')}${m.last?.code?' · ODS '+esc(m.last.code):''}</small></div>
    <div><span title="No es lectura real">Hoy estimado</span><b>${n(m.estimate)} km</b><small>${m.rate?n(m.rate)+' km/mes · según las últimas '+(ri?.pts?.length||0)+' visitas con km':'Se necesitan al menos 2 visitas con km'}</small></div>
    <div><span title="Consulta de km sin visita">Última consulta</span><b>${rd?n(rd.km)+' km':'Sin consultas'}</b><small>${rd?esc(rd.date)+' '+esc(rd.time||'')+' · '+esc(rd.channel||''):'Registra el km que informa el cliente.'}</small></div>
    <div><span>Simulación</span><b>${n(cur)} km</b><small class="r76-sim"><input aria-label="Simular kilometraje" type="range" min="${m.bins[0]}" max="${m.bins.at(-1)}" step="500" value="${cur}" onchange="simKm=+this.value;render()"><button type="button" class="r76-mini" onclick="simKm=null;render()">Restablecer</button></small></div>
    <div><span>Plan explícito</span><b>${esc(m.plan?.id||'Sin plan')}</b><small>Reglas no aprobadas técnicamente</small></div>
    <div class="r76-wide"><span>Aceite</span><small>${aceite}</small></div></div>`:'';
  const head=`<div class="r76-tlh"><h1>Línea temporal</h1><div class="r76-sbtn"><button type="button" class="r76-mini ${o?'on':''}" aria-expanded="${o}" onclick="r76TlTog()">${o?'▾':'▸'} Km y proyección</button><button type="button" class="r76-mini" onclick="r74KmConsult('${v.id}')">⏱ Consulta de km</button><button type="button" class="r76-mini" onclick="r73TlRules()">⚙ Reglas</button><button type="button" class="r76-mini" onclick="window.print()">Imprimir / PDF</button></div></div>`;
  return head+`<div class="r76-km ${o?'open':''}"><div class="r76-chips" onclick="r76TlTog()" title="Clic para ${o?'contraer':'expandir'}">${chips}</div>${rows}</div>`+h.slice(i2)};
