
/* --------------------------------------------------------------------------
   Arranque R7.7: los sucesos se detectan tras cada guardado y cada minuto
   -------------------------------------------------------------------------- */
const r77SaveBase=save;
save=function(action,detail){try{r77ReasonMigrate()}catch{}r77SaveBase(action,detail);try{const n=r77Tick();if(n){R74.notify=(R74.notify||0)+n;render()}}catch(err){console.warn('r77',err)}};
const r77SyncBase=syncR5Automations;
syncR5Automations=function(){r77SyncBase();try{const n=r77Tick();if(n)R74.notify=(R74.notify||0)+n}catch(err){console.warn('r77',err)}};
r77Db();r77EnsureSys();r77EnsureSeeds();r77EnsureSeeds2();r77ExtEnsure();r77EnsureSeeds3();r77EnsureSeeds4();r77EnsureSeeds5();r77EnsureSeeds6();r77EnsureSeeds7();r77EnsureSeeds8();r77Events();if(r74AutoCfg().sim){r77SetClock(r74AutoCfg().sim);r77ClockSync()}
['marcasv','marcasp','categorias','catalogo','series','cajasm'].forEach(k=>R75_TESIS.add(k));
r77DraftClean();$('modal').addEventListener('close',()=>{try{r77DraftClean()}catch{}});
const r77CotBase=views.cotizaciones;views.cotizaciones=()=>{const all=db.r72quotes;db.r72quotes=all.filter(q=>!q.draft);try{return r77CotBase()}finally{db.r72quotes=all}};
