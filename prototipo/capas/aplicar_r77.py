import sys,os
src,dst=sys.argv[1],sys.argv[2]
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'r77')
s=open(src,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old);assert n==count,(old[:80],n);s=s.replace(old,new)
rep("</style></head>",open(os.path.join(d,'estilos.css'),encoding='utf-8').read()+"</style></head>")
layer='\n'.join(open(os.path.join(d,f),encoding='utf-8').read() for f in ['a_motor.js','b_ui.js','c_shell.js','d_tables.js','e_nav.js','f_menu.js','g_caja.js','h_ods.js','i_cal.js','j_corr.js','k_mov.js','l_sale.js','m_ods.js','n_ods_list.js','o_logistica.js','r_deuda.js','t_ext.js','u_rent.js','v_auto2.js','p_ws.js','q_tree.js','q_tree2.js','w_beta.js','x_inv.js','y_crm.js','z_precios.js','aa_solape.js','ab_placa.js','ae_doc.js','af_paquetes.js','ag_rsa_data.js','ag_carga.js','ah_flujo.js','aj_flujo_xlsx.js','ak_reglas_dinero.js','al_alcance.js','am_cotiz.js','an_encuesta.js','ao_ods_import.js','aq_logos.js','ap_ajustes2.js','ar_ajustes3.js','ai_precios2.js','ac_permisos_data.js','ac_permisos.js','ad_login.js','zz_modal.js','s_texts.js','h_init.js'])
i=s.rindex("\nrender();\n</script>");s=s[:i]+"\n"+layer+s[i:]
rep("if(['En espera','En seguimiento'].includes(t.state))t.state='En proceso'","if(['En seguimiento'].includes(t.state))t.state='En proceso'")
rep("lock=o.state==='Archivada',","lock=o.state==='Archivada'&&!o.editGrant,")
rep("if(o.state==='Archivada')return toast('Reabre la ODS antes de editar.')","if(o.state==='Archivada'&&!o.editGrant)return toast('Reabre la ODS antes de editar.')",3)
rep("['Avance punto de equilibrio',be.toFixed(2)+'%','Ventas '+R75_FMT.money(s.sales)+' de '+R75_FMT.money(cfg.breakeven)],","")
rep("+field('breakeven','Punto de equilibrio mensual (S/ en ventas)',c.breakeven,'number','min=\"0\" step=\"1\" required')","")
rep(",breakeven:+d.breakeven","")
rep("const agendaTechs=()=>db.users.filter(u=>u.active&&['Técnico','Jefe de taller'].includes(u.role))","const agendaTechs=()=>db.users.filter(u=>u.active&&!u.external&&['Técnico','Jefe de taller'].includes(u.role))")
rep('${com?`<td class="r72-r ${profit==null?\'\':profit<0?\'r7-error\':\'r7-ok\'}">${profit==null?\'—\':money(profit)+(pct!=null?\' · \'+pct+\'%\':\'\')}</td>`:\'\'}','${com?`<td class="r72-r ${profit==null?\'\':profit<0?\'r7-error\':\'r7-ok\'}">${profit==null?\'—\':(locked||priceLocked||!canCost?(pct!=null?pct+\'%\':\'—\'):`<span class="r77-rentw"><input type="number" step="0.1" class="r72-num r77-rent" value="${pct??\'\'}" onchange="r77RentSet(\'${k}\',\'${l.id}\',this.value)" aria-label="Rentabilidad en porcentaje">%</span>`)}</td>`:\'\'}')
import re
for pat in [r'<label style="grid-column:1/-1">Motivo de ingreso<textarea name="reason".*?</textarea></label>',r'<label class="r72-wide">Motivo de ingreso<input \$\{dis\}.*?</label>']:
    s,k=re.subn(pat,'',s,flags=re.S)
    assert k>=1,(pat,k)
rep("${isO?'Motivo de ingreso':'Nota de la cita'}","${isO?'Tipo de atención':'Nota de la cita'}",2)
rep("(isO?box.reason:a?.note)?","(isO?null:a?.note)?",2)
rep('db.r74groups=Array.from({length:8}','db.r74groups=Array.from({length:5}')
rep('Cada grupo (G1…G8)','Cada grupo (G1…G5)')
rep('Ventas de repuestos e insumos','Ventas de productos')
rep('Utilidad de repuestos e insumos','Utilidad de productos')
rep('Rentabilidad de repuestos e insumos','Rentabilidad de productos')
rep('Ventas totales','Total de ventas (productos y servicios)')
rep("R_Motriz R7.6 · demo local","R_Motriz R7.7 · demo local")
rep("<title>R Motriz · Espacio de trabajo R7.6</title>","<title>R Motriz · Espacio de trabajo R7.7</title>")
open(dst,'w',encoding='utf-8').write(s);print('OK',len(s))
