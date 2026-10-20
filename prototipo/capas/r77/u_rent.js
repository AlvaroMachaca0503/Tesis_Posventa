
/* --------------------------------------------------------------------------
   R7.7 · Rentabilidad editable (solo porcentaje): al cambiar el % se recalcula
   el precio final a partir del costo; al cambiar el precio se recalcula el %.
   Vale para productos y servicios. Rentabilidad = (total − costo) / total.
   -------------------------------------------------------------------------- */
function r77RentSet(k,id,v){const l=r72Line(k,id);if(!l)return;const r=parseFloat(v);if(!isFinite(r)||r>=100){toast('Escribe una rentabilidad menor que 100 %.');return r72Refresh()}
  const C=r72LineCost(l);if(C==null||!(C>0)){toast('Primero escribe el costo: sin costo no se puede calcular el precio.');return r72Refresh()}
  const T=r2(C/(1-r/100)),S=T+(+l.discount||0),price=l.type==='servicio'?r2(S):r2(S/(+l.qty||1));r72Set(k,id,'price',String(price))}
