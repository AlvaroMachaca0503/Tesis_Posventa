
/* --------------------------------------------------------------------------
   R7.7 · Carga masiva DIARIA de órdenes de servicio (Excel o CSV) y página de
   API (beta).
   - Cada fila es un ítem de una ODS (formato plano, como el reporte de
     operaciones del sistema anterior); las filas con el mismo codigo_ods forman
     una orden. Se crean la orden, sus ítems y, si no existen, el cliente y el
     vehículo. La orden nueva abierta crea su tarea de evento y dispara las
     automatizaciones (la creación se detecta como cualquier ODS nueva).
   - Modos: solo agregar · agregar y actualizar · agregar y completar vacíos.
   - Mientras no exista la API, esta es la vía de entrada de los datos del
     otro sistema (ver docs/api/CONTRATO_API_R77.md).
   -------------------------------------------------------------------------- */
const r77OdDate=v=>{if(typeof v==='number')return r77FxDate(v);const s=String(v??'').trim(),m=/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/.exec(s);if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');const i=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);return i?i[0]:''};
const r77OdPlate=v=>r77Up(v).replace(/[\s-]+/g,'');
const r77OdState=s=>{const n=normal(s);if(/cerrad|finaliz|archiv|entregad/.test(n))return 'Archivada';if(/entrega/.test(n))return 'Entrega';if(/proceso|taller/.test(n))return 'En proceso';return 'Recepción'};
const r77OdUser=n=>{const k=normal(n);if(!k)return null;const u=db.users.find(x=>x.active&&(normal(x.name)===k||normal(x.name).includes(k)));return u?u.id:null};
R77_IMP.ordenes={label:'Órdenes de servicio (carga diaria)',sheets:'Ordenes',
  cols:['codigo_ods','fecha','hora','placa','kilometraje','estado','tipo_atencion','motivo','sede','tecnico_orden','asesor','tipo_item','codigo_item','item','cantidad','precio_unitario','costo','descuento','tecnico_servicio','documento_cliente','nombre_cliente','marca','modelo','anio'],
  ej:['100001','2026-10-01','09:30','AAA-000',50000,'En proceso','Mantenimiento','Cambio de aceite y filtros','union','','','servicio','ACE','CAMBIO DE ACEITE DE MOTOR',0.75,30,'',0,'','00000000','NOMBRE DE EJEMPLO','KIA','PICANTO',2019],
  plan(S,mode){const P={ops:[]},rows=r77Sheet(S,'ordenes'),G={};
    rows.forEach((r,i)=>{const code=r77Str(r.codigo_ods);if(!code)return r77PlanOp(P,'err','Fila '+(i+2)+': falta codigo_ods',()=>{});(G[code]??={code,rows:[],line:i+2}).rows.push({r,line:i+2})});
    Object.values(G).forEach(g=>{const h=g.rows[0].r,plate=r77OdPlate(h.placa),date=r77OdDate(h.fecha),lbl='ODS '+g.code+' · '+(r77Str(h.placa)||'sin placa'),items=g.rows.filter(x=>r77Str(x.r.item)||r77Str(x.r.codigo_item));
      if(!plate)return r77PlanOp(P,'err',lbl+': falta la placa',()=>{});if(!date)return r77PlanOp(P,'err',lbl+': falta una fecha válida (AAAA-MM-DD o DD/MM/AAAA)',()=>{});
      const cur=db.orders.find(o=>!o.deleted&&String(o.externalId||o.code)===g.code),sede=/prohogar/.test(normal(h.sede))?'prohogar':'union',state=r77OdState(h.estado),km=r77Num(h.kilometraje);
      const head={state,km:km==null?'':km,branch:sede,attentionType:r77Str(h.tipo_atencion),reason:r77Str(h.motivo)};
      if(cur){if(mode==='add')return r77PlanOp(P,'same',lbl+' (ya existe)',()=>{});const t=structuredClone(cur);return r77Merge(t,head,mode)?r77PlanOp(P,'upd',lbl+' · '+state,()=>{r77Merge(cur,head,mode);if(!(cur.lines||[]).length&&items.length)cur.lines=r77OdLines(items,h)}):r77PlanOp(P,'same',lbl+' (sin cambios)',()=>{})}
      if(!items.length)return r77PlanOp(P,'err',lbl+': no tiene ítems (item o codigo_item)',()=>{});
      r77PlanOp(P,'add',lbl+' · '+state+' · '+items.length+' ítems',()=>{
        let v=db.vehicles.find(x=>!x.deleted&&r77OdPlate(x.plate)===plate);
        if(!v){const doc=r77Str(h.documento_cliente);let c=doc&&db.clients.find(x=>!x.deleted&&String(x.doc)===doc);if(!c){c={id:uid(),name:r77Up(h.nombre_cliente)||'CLIENTE SIN NOMBRE',doc,docType:doc.length===11?'RUC':'DNI',phone:'',email:'',credit:'Sin historial'};db.clients.push(c)}
          v={id:uid(),plate:r77Up(h.placa),client:c.id,brand:r77Up(h.marca),model:r77Up(h.modelo),year:r77Num(h.anio)||'',km:null,use:'P'};db.vehicles.push(v)}
        const o={id:uid(),code:g.code,externalId:g.code,vehicle:v.id,tech:r77OdUser(h.tecnico_orden),advisor:r77OdUser(h.asesor),logistic:null,km:km,state,date,time:r77Str(h.hora),createdAt:date+'T'+(r77Str(h.hora)||'09:00')+':00',origin:'importación',billing:'No facturado',attentionType:head.attentionType||'Mantenimiento',odsType:'Express',reason:head.reason,reception:null,approval:'Aprobada',branch:sede,appointment:null,quote:null,lines:r77OdLines(items,h),rootTaskState:state==='Archivada'?'Completada':'Pendiente',productStage:'Solicitud',archived:state==='Archivada'};
        if(state==='Archivada')o.closed=date+'T18:00:00';if(km!=null)v.km=Math.max(+v.km||0,km);
        db.orders.unshift(o);r7Log(o.id,'ODS importada','Carga masiva · '+items.length+' ítems');
        if(state!=='Archivada'){const k='o:'+o.id;try{r72SyncEvent(k);r72SyncBlocks(k)}catch(e){console.warn('r77 ods import',e)}}})});
    P.after=()=>{db.vehicles.filter(v=>!v.deleted).forEach(v=>r74AssignGroup(v))};return P}};
function r77OdLines(items,h){const ot=r77OdUser(h.tecnico_orden);return items.map(({r})=>{const cat=db.catalog.find(c=>!c.deleted&&c.code===r77Str(r.codigo_item)),type=/producto|repuesto|insumo/.test(normal(r.tipo_item))?'producto':(cat&&!r.tipo_item?cat.type:'servicio'),q=r77Num(r.cantidad)??1,pr=r77Num(r.precio_unitario);
  return {id:uid(),type,code:r77Str(r.codigo_item),name:r77Str(r.item)||cat?.name||r77Str(r.codigo_item),qty:type==='servicio'?q:Math.max(1,q),hours:type==='servicio'?q:null,price:pr??(cat?cat.price:null)??null,cost:r77Num(r.costo)??(cat?cat.cost:null)??null,discount:r77Num(r.descuento)||0,tech:type==='servicio'?(r77OdUser(r.tecnico_servicio)||ot):null,logistic:null,approved:true,announced:true,catalog:cat?cat.id:null,external:!cat,createdBy:actor,createdAt:new Date().toISOString(),logisticTag:type==='producto'?'Entregado':null}})}
/* ---------- página de API (beta): contrato previsto y vía actual ---------- */
const R77_API=[['POST','/api/v1/ordenes','Crea o actualiza una orden de servicio con sus ítems (idempotente por codigo_ods).','Hoy: Carga masiva › Órdenes de servicio'],['GET','/api/v1/ordenes/{codigo}','Devuelve la orden con sus ítems, estado y tareas.','Beta'],['POST','/api/v1/clientes','Crea o actualiza un cliente (llave: documento).','Hoy: Carga masiva › Clientes'],['POST','/api/v1/vehiculos','Crea o actualiza un vehículo (llave: placa).','Hoy: Carga masiva › Vehículos'],['GET','/api/v1/tareas?estado=','Lista tareas y su estado para el otro sistema.','Beta'],['POST','/api/v1/encuestas/{token}','Recibe la respuesta de la encuesta del cliente.','Hoy: enlace #encuesta (prototipo)'],['POST','/api/v1/webhooks','Registra una URL que recibe avisos (ODS cerrada, tarea creada).','Beta']];
views.api=()=>heading('API de integración','Cómo el otro sistema entregará y recibirá datos. Mientras la API no exista, las órdenes entran cada día por la carga masiva (Excel o CSV).',button('Ir a la carga masiva de órdenes',"R77IMP.ent='ordenes';R77IMP.plan=null;go('importar')",true))+`<div class="r77-note">Beta: es el contrato previsto, no hay servidor. Detalle completo en <code>docs/api/CONTRATO_API_R77.md</code> de la carpeta del proyecto.</div><div class="panel">${table(['Método','Ruta','Qué hace','Hoy'],R77_API.map(a=>[`<b>${a[0]}</b>`,`<code>${esc(a[1])}</code>`,esc(a[2]),esc(a[3])]))}</div>`;
R77_BETA.add('api');R75_MODS.api=['⇄','API de integración'];(function(){const b=R75_NAV.find(n=>n.sec==='Beta');if(b&&!b.items.includes('api'))b.items.push('api');r75Rebuild()})();
