
/* --------------------------------------------------------------------------
   Migración y arranque R7.5
   -------------------------------------------------------------------------- */
function r75Ensure(){
  r75Rebuild();
  r75MetCfg();db.r75cw??={};db.r75sent??=[];
  if(db.r74cats&&!db.r74cats.some(c=>/extern/i.test(c.name)))db.r74cats.push({id:'cat-ext',name:'Servicios externos',system:'General',description:'Trabajos hechos por terceros (para las métricas de ventas)',active:true});
}
const r75RenderBase=render;
render=function(){r75RenderBase();try{r75Nav();const item=modules.find(m=>m[0]===page);if(item)$('crumb').textContent=item[2];r75Fit(document)}catch(e){console.warn('r75 render',e)}};
r75Ensure();
