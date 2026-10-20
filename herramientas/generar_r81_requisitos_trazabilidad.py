# -*- coding: utf-8 -*-
from pathlib import Path
import csv
C=Path(__file__).resolve().parents[2]; DOC=C/'fuentes-proyecto'/'docs'/'requisitos'; LAT=C/'fuentes-latex'
src=DOC/'REQUISITOS_FUNCIONALES_FINALES_R80.csv'
drop={
'Crear una única tarea logística de productos para la solicitud aprobable.',
'Agrupar en la tarea logística los productos pendientes de cotización de la ODS.',
'Agregar producto nuevo o alternativa a la cotización sin borrar versiones anteriores.',
'Remitir la cotización para revisión de cajera con enlace desde bitácora.',
'Notificar al logístico los productos aprobados que deben comprarse.',
'Adjuntar una evidencia de compra y una evidencia de entrega por producto o de forma general.',
'Permitir al técnico confirmar todos los productos o confirmarlos uno por uno.',
'Marcar producto observado o por cambiar y reabrir la misma tarea logística.',
'Mantener la tarea técnica abierta mientras existan productos pendientes de conformidad.',
'Mostrar al técnico únicamente los productos requeridos, su estado y evidencia autorizada.',
'Restringir costos, márgenes y precios a la vista comercial autorizada.',
'Permitir arrastrar una tarea no iniciada hacia otra franja sin registrar avance ficticio.',
'Mantener la trazabilidad de cada cambio manual de agenda, servicio, producto o tarea.'}
with src.open(encoding='utf-8-sig') as f: old=[r['Requisito'] for r in csv.DictReader(f)]
items=[x for x in old if x not in drop]
assert len(items)==83, len(items)
items += [
'El sistema permite gestionar el rol Asistente administrativo de finanzas y sus permisos por módulo.',
'El sistema permite configurar empresa, locales, dos logotipos y formatos de documento.',
'El sistema permite asignar series de comprobantes por local.',
'El sistema permite emitir una cotización desde ODS con kilometraje, ítems, impuesto, descuento, observaciones y registro en bitácora.',
'El sistema permite emitir nota de venta interna con PDF o ticket y referencia a la ODS.',
'El sistema permite registrar pagos, abonos y saldo pendiente de una nota de venta.',
'El sistema permite consultar cuentas por cobrar y por pagar pendientes.',
'El sistema permite registrar movimientos, ingresos, egresos y traslados entre cuentas bancarias por local.',
'El sistema permite registrar requerimientos, consumo y traslado de inventario entre locales.',
'El sistema permite ejecutar automatizaciones de ODS, cita, kilometraje, seguimiento y tareas con historial de ejecución.',
'El sistema permite registrar consulta de kilometraje y recalcular proyecciones futuras.',
'El sistema permite enviar encuesta con enlace y registrar respuestas para NPS y satisfacción.',
'El sistema permite consultar métricas de venta de servicios, satisfacción y NPS con filtro por local.' ]
assert len(items)==96

def group(x):
 x=x.lower()
 if any(k in x for k in ['cotización','nota de venta','pago','abono','cuentas por cobrar','cuentas por pagar','series de comprobantes']): return 'COM'
 if any(k in x for k in ['bancari','inventario','requerimiento','traslado de inventario']): return 'FININV'
 if any(k in x for k in ['automatiz','kilometraje y recalcular','encuesta','métricas']): return 'POST'
 if any(k in x for k in ['solicitar un producto','cotización editable','decisión de cliente','aprobar o no aprobar','compra de producto','entrega al técnico','tarea logística','conformidad técnica']): return 'LOG'
 if any(k in x for k in ['plan','proyección','recomendación','línea de tiempo','evento que modifica']): return 'PLAN'
 if any(k in x for k in ['tarea','jornada','duración','huecos','servicio asignado','retraso de repuesto']): return 'TASK'
 if any(k in x for k in ['cita','agenda','capacidad','almuerzo']): return 'AGENDA'
 if any(k in x for k in ['bitácora','auditor','comentario','mencionar','historial cronológico']): return 'BIT'
 if any(k in x for k in ['import','lote','equivalencia','conciliación','exportar resultado']): return 'IMP'
 if any(k in x for k in ['reporte','indicadores','filtro','exportar resultados']): return 'REP'
 if any(k in x for k in ['usuario','permisos','empresa','locales','parámetros','catálogo']): return 'CFG'
 if any(k in x for k in ['cliente','vehículo','proveedor','placa','vin']): return 'MASTER'
 return 'ODS'
# DAS debe contener bloque específico; los códigos de otros diagramas se conservan directos.
M={
'MASTER':('Maestros e identidad','DCM-R77-0001','DCU-R77-0001','Cliente, Vehiculo, Proveedor, Kilometraje (DCL-0001)','DMD-0001','—','—','—','prototipo/carga_masiva/02_clientes.xlsx; 03_vehiculos.xlsx','—','Prototipo: R_Motriz_R7.7.html: Clientes/Vehículos','e2e77.mjs'),
'CFG':('Identidad y configuración','DCM-R77-0001','DCU-R77-0001','Usuario, Rol, Permiso, Organizacion, Local (DCL-R77-0002)','DMD-0004','—','—','—','docs/requisitos/MATRIZ_PERMISOS_R77.md','—','Prototipo: R_Motriz_R7.7.html: Configuración/Usuarios','e2e77.mjs'),
'ODS':('ODS y auditoría','DCM-R77-0001','DCU-R77-0001','OrdenServicio, DetalleODS, ServicioODS, Evidencia (DCL-0001)','DMD-0001','DSE-0010','DES-R77-0001','DAC-0005','prototipo/carga_masiva/09_plantilla_ordenes_de_servicio.xlsx','—','Prototipo: R_Motriz_R7.7.html: Órdenes de servicio','e2e77.mjs'),
'IMP':('Importación y conciliación','DCM-R77-0001','DCU-0004','Lote, FilaOriginal, IdentidadExterna, Importador (DCL-0003)','DMD-0002','DSE-R77-0001','—','DAC-0001','prototipo/carga_masiva/*.xlsx; CSV sintético de prueba','—','Prototipo: R_Motriz_R7.7.html: Carga masiva','e2e77.mjs'),
'PLAN':('Planes y reajuste','DCM-R77-0001','DCU-0003','Plan, VersionPlan, Regla, Aplicabilidad, Asignacion, Proyeccion (DCL-0004)','DMD-0002','DSE-0002','—','DAC-0007','plantillas de planes y reglas versionadas','—','Prototipo: R_Motriz_R7.7.html: Planes/Línea temporal','e2e77.mjs'),
'TASK':('Tareas y ejecución técnica','DCM-R77-0001','DCU-0002','Tarea, BloqueTiempo, ServicioODS, Usuario (DCL-0009)','DMD-0003','DSE-0004','DES-0004','—','prototipo/R_Motriz_R7.7.html','—','Prototipo: R_Motriz_R7.7.html: Espacio de trabajo','e2e77.mjs'),
'AGENDA':('Citas y capacidad','DCM-R77-0001','DCU-0002','Cita, AgendaTecnico, BloqueTiempo (DCL-0005)','DMD-0003','DSE-0003','DES-0005','—','prototipo/R_Motriz_R7.7.html','—','Prototipo: R_Motriz_R7.7.html: Agenda técnicos','e2e77.mjs'),
'BIT':('Bitácora y auditoría','DCM-R77-0001','DCU-0001','Bitacora, Evidencia, Mencion, Auditoria (DCL-0002)','DMD-0001','DSE-0010','—','DAC-0005','adjuntos de evidencia autorizados','—','Prototipo: R_Motriz_R7.7.html: Bitácora','e2e77.mjs'),
'REP':('Reportes operativos','DCM-R77-0001','DCU-0005','ReporteOperativo, Indicador, Filtro (DCL-0014)','DMD-0004','DSE-0012','—','—','exportaciones CSV de reportes','—','Prototipo: R_Motriz_R7.7.html: Reportes','e2e77.mjs'),
'LOG':('Tarea logística de productos','DCM-R77-0001','DCU-R77-0001','Tarea, SolicitudProducto, CotizacionProducto, CompraProducto, ConformidadTecnica (DCL-0011)','DMD-0004','DSE-0008','DES-0003','DAC-0003','comprobantes y evidencias de compra/entrega','—','Prototipo: R_Motriz_R7.7.html: tarea logística','e2e77.mjs'),
'COM':('Documentos comerciales internos','DCM-R77-0001','DCU-R77-0001','Cotizacion, NotaVenta, Pago, SerieComprobante (DCL-0006; DCL-R77-0002)','DMD-0004','DSE-R77-0004','—','DAC-0004','PDF/ticket; comprobantes internos; series por local','—','Prototipo: R_Motriz_R7.7.html: Cotización/Emitir comprobante','e2e77.mjs'),
'FININV':('Bancos, compras e inventario','DCM-R77-0001','DCU-R77-0001','CuentaBancaria, Movimiento, Requerimiento, MovimientoInventario (DCL-R77-0002; DCL-R77-0003)','DMD-0004','DSE-R77-0003; DSE-R77-0005','—','DAC-0003','comprobantes de compra; kardex; requerimientos','—','Prototipo: R_Motriz_R7.7.html: Bancos/Inventario','e2e77.mjs'),
'POST':('Seguimiento y automatizaciones','DCM-R77-0001','DCU-R77-0001','Automatizacion, ConsultaKm, Encuesta, Metrica (DCL-0013; DCL-0014)','DMD-0004','DSE-0011; DSE-R77-0002; DSE-0013','DES-0002','DAC-0006','plantilla de encuesta; historial de automatizaciones','—','Prototipo: R_Motriz_R7.7.html: Seguimiento/Métricas','e2e77.mjs')}
rows=[]
for i,text in enumerate(items,1):
 g=group(text); vals=M[g]; rows.append({'RF':f'RF-{i:03d}','Requisito':'El sistema permite '+text[0].lower()+text[1:] if not text.startswith('El sistema permite') else text,'Estado':'Pendiente','DAS':vals[0],'DCM':vals[1],'CU':vals[2],'DCL':vals[3],'DMD':vals[4],'DSE':vals[5],'DES':vals[6],'DAC':vals[7],'BD / Archivos':vals[8],'Backend':vals[9],'Front':vals[10],'Prueba':vals[11]})
fields=list(rows[0])
def write(path, data, fs):
 with path.open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fs,extrasaction='ignore');w.writeheader();w.writerows(data)
write(DOC/'REQUISITOS_FUNCIONALES_FINALES_R81.csv',rows,['RF','Requisito'])
write(DOC/'MATRIZ_TRAZABILIDAD_R81.csv',rows,['RF','Estado','DAS','DCM','CU','DCL','DMD','DSE','DES','DAC','BD / Archivos','Backend','Front','Prueba'])
with (DOC/'REQUISITOS_FUNCIONALES_FINALES_R81.md').open('w',encoding='utf-8') as f:
 f.write('# Requisitos funcionales finales R8.1\n\n96 requisitos de primera versión R7.7. Beta y requisitos quitados se conservan fuera de la tesis.\n\n');[f.write(f"- **{r['RF']}** {r['Requisito']}\n") for r in rows]
def tx(s): return str(s).replace('&',r'\&').replace('_',r'\_').replace('%',r'\%')
rt=[r'\section{Requisitos funcionales finales R8.1}\label{sec:rf-r81}',r'La tesis incluye 96 requisitos funcionales de primera versión R7.7. Los módulos beta y requisitos quitados se preservan solo en el contexto histórico. La logística se mantiene como una tarea de productos vinculada a ODS.',r'\begin{landscape}\scriptsize\setlength{\tabcolsep}{2pt}',r'\begin{longtable}{p{1.25cm}p{22.5cm}}',r'\caption{Requisitos funcionales finales}\\\toprule \textbf{RF} & \textbf{Requisito funcional}\\\midrule\endfirsthead',r'\toprule \textbf{RF} & \textbf{Requisito funcional}\\\midrule\endhead']
for r in rows:rt.append(f"{r['RF']} & {tx(r['Requisito'])}\\\\")
rt += [r'\bottomrule\end{longtable}\normalsize\end{landscape}','']; (LAT/'requisitos_funcionales_finales_r81.tex').write_text('\n'.join(rt),encoding='utf-8')
A=['RF','Estado','DAS','DCM','CU','DCL','DMD','DSE','DES','DAC']; B=['RF','BD / Archivos','Backend','Front','Prueba']
def table(cols,title,widths):
 o=[r'\begin{landscape}\tiny\setlength{\tabcolsep}{1.15pt}',r'\begin{longtable}{'+''.join('p{'+w+'}' for w in widths)+r'}',r'\caption{'+title+r'}\\\toprule '+' & '.join(cols)+r'\\\midrule\endfirsthead',r'\toprule '+' & '.join(cols)+r'\\\midrule\endhead']
 for r in rows:o.append(' & '.join(tx(r[c]) if r[c] else '—' for c in cols)+r'\\')
 return o+[r'\bottomrule\end{longtable}\normalsize\end{landscape}']
tr=[r'\clearpage\section{Matriz de trazabilidad R8.1}\label{sec:trazabilidad-r81}',r'La definición de cada RF aparece una sola vez en la tabla anterior. Estado ``Pendiente' declara que no existe código de aplicación; el prefijo ``Prototipo:' en Front identifica una demostración HTML local. Backend ``—' es un hueco de implementación declarado.']+table(A,'Trazabilidad de diseño',['1cm','1.3cm','2.4cm','2cm','2.3cm','5.4cm','2cm','2cm','2cm','2cm'])+table(B,'Trazabilidad de código y prueba (continuación)',['1.1cm','8.5cm','4cm','7cm','3cm'])
(LAT/'trazabilidad_r81.tex').write_text('\n'.join(tr),encoding='utf-8')
print('RF',len(rows))