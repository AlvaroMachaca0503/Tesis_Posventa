# -*- coding: utf-8 -*-
"""Genera la matriz detallada R7.8 (RF-01..215) para revisión académica.
No editar las salidas a mano: editar este generador y volver a ejecutar.
"""
import csv, io, os

RAIZ=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTX=os.path.dirname(RAIZ)
LATEX=os.path.join(CTX,'fuentes-latex')
T76=os.path.join(LATEX,'trazabilidad_R76.csv')
M77=os.path.join(RAIZ,'docs','requisitos','MAPEO_R77.csv')
CSVOUT=os.path.join(RAIZ,'docs','requisitos','MATRIZ_TRAZABILIDAD_DETALLADA_R78.csv')
MDOUT=os.path.join(RAIZ,'docs','requisitos','MATRIZ_TRAZABILIDAD_DETALLADA_R78.md')
TEXOUT=os.path.join(LATEX,'trazabilidad_detallada_r78.tex')
NIVEL={'C':'Primera versión','B':'Beta','Q':'Quitado'}
VACIO='—'

# Cada perfil refiere exclusivamente clases e IDs existentes en los diagramas vigentes.
P={
 'Automatizaciones':('DAS-0001; DAF-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0001: MotorReglas, Tarea, OrdenServicio, ItemOrden, Repositorio','DES-R77-0001','DSE-R77-0001','DAC-0006','reglas, ejecuciones, tareas, bitácora','CU-R77: configurar/ejecutar automatización','prototipo/capas/r77/a_motor.js: r77Process(), r77Tick(), r77Act(); diseño API: AutomationService'),
 'Espacio de trabajo':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-0009: Tarea, Lista, Carpeta, BloqueTecnico, Cita','DES-0004','DSE-0004; DSE-0005','—','tareas, listas, carpetas, bloques técnicos','CU-R77: gestionar tareas/agenda','prototipo/R_Motriz_R7.7.html y capas/r77; diseño API: WorkspaceService'),
 'Órdenes de servicio':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0001: OrdenServicio, ItemOrden, Vehiculo, Cliente, Tarea; DCL-0010: OrdenServicio, DetalleODS, Tarea','DES-R77-0001','DSE-0007; DSE-0010','DAC-0005','ODS, ítems, fotos, etiquetas, garantía, bitácora','CU-R77: gestionar ODS','prototipo/capas/r77; diseño API: OdsService'),
 'Ventas y caja':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0002: NotaVenta, SerieComprobante, CuentaBancaria, MovimientoCuenta, Cliente, Proveedor','DES-R77-0001','DSE-R77-0004; DSE-0009','—','notas, cotizaciones, abonos, cuentas','CU-R77: cotizar / emitir comprobante','prototipo/capas/r77; diseño API: SalesService'),
 'Impuestos':('DAS-0001','DCM-R77-0001','DCU-R77-0001','— (sin diagrama de clases específico; se relaciona con DCL-R77-0002: NotaVenta, ConfiguracionSistema)','—','DSE-R77-0004','—','ítems, impuesto, detracción, nota de venta','CU-R77: emitir comprobante / consultar reporte','prototipo/capas/r77; diseño API: TaxService'),
 'Inventario':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0003: Almacen, Requerimiento, LineaRequerimiento, MovimientoInventario, Producto, FacturaCompra, Notificacion','—','DSE-R77-0005','DAC-0003','almacenes, stock, kardex, requerimientos, movimientos','CU-R77: administrar inventario / requerir','prototipo/capas/r77; diseño API: InventoryService'),
 'CRM de posventa':('DAS-0001','DCM-R77-0001','DCU-R77-0001','— (sin diagrama de clases específico; tareas en DCL-0009)','DES-0004','DSE-0010; DSE-R77-0002','DAC-0006','contactos, tareas, citas, ODS, encuesta','CU-R77: gestionar CRM/seguimiento','prototipo/capas/r77; diseño API: CrmService'),
 'Interfaz':('DAS-0001','DCM-R77-0001','DCU-R77-0001','— (requisito de interfaz transversal)','—','—','—','sin entidad propia','CU-R77: transversal','prototipo/R_Motriz_R7.7.html; diseño: Web UI'),
 'Beta':('DAS-R78-0001','DCM-R77-0001','DCU-R77-0001','— (beta; no clase implementada)','—','—','—','según integración propuesta','CU-R77: módulo beta','prototipo/capas/r77 (simulado); diseño API: IntegrationService'),
 'Bancos':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0002: CuentaBancaria, MovimientoCuenta, ServicioMovimiento, ServicioTraslado, Usuario, Proveedor','—','DSE-R77-0003','—','cuentas, movimientos, traslados, comprobantes','CU-R77: administrar bancos','prototipo/capas/r77; diseño API: BankService'),
 'Reportes':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0002: ReporteOperativo; DCL-0014: ServicioMetricas, ServicioReportes, ReportePosventa','—','DSE-0012; DSE-0013','—','ODS, ítems, encuestas, métricas','CU-R77: consultar reportes','prototipo/capas/r75 y r77; diseño API: ReportService'),
 'Métricas':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-0014: ServicioMetricas, ReportePosventa, Grafico','—','DSE-0012; DSE-0013','—','ODS, encuestas, métricas','CU-R77: consultar métricas','prototipo/capas/r75; diseño API: MetricsService'),
 'Configuración':('DAS-0001; DAS-R78-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0002: ConfiguracionSistema, Usuario, SerieComprobante; DCL-R77-0001: CargaMasiva, LectorArchivo, PlanCarga, Repositorio','—','DSE-R77-0001','DAC-0001','configuración, usuarios, cargas, catálogos','CU-R77: configurar sistema/cargar datos','prototipo/capas/r77; diseño API: ConfigurationService, ImportService'),
 'Maestros':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0001: Cliente, Vehiculo; DCL-R77-0002: Proveedor, SerieComprobante','—','—','—','maestros y parámetros','CU-R77: administrar maestros','prototipo/capas/r77; diseño API: MasterDataService'),
 'Finanzas':('DAS-0001','DCM-R77-0001','DCU-R77-0001','DCL-R77-0002: CuentaBancaria, MovimientoCuenta, ReporteOperativo','—','DSE-R77-0003','—','cuentas y reportes financieros','CU-R77: consultar finanzas','prototipo/capas/r77 (beta); diseño API: FinanceService'),
 'Quitado':('—','—','—','— (requisito retirado)','—','—','—','—','—','— (no debe implementarse)'),
}

def prof(r):
    m=r.get('modulo','')
    if m in P: return P[m]
    if m=='Integración': return P['Beta']
    if m=='Evolución': return P['Beta']
    if m=='Cotizaciones' or m=='Cobro': return P['Ventas y caja']
    if m=='T5 posventa': return P['CRM de posventa']
    if m=='INC-07': return P['Inventario']
    return P['Configuración']

def tex(x):
    x=str(x or VACIO)
    for a,b in [('\\',r'\textbackslash{}'),('&',r'\&'),('%',r'\%'),('$',r'\$'),('#',r'\#'),('_',r'\_'),('{',r'\{'),('}',r'\}')]: x=x.replace(a,b)
    return x.replace('—','--').replace('→',r'$\rightarrow$')

def row_base(r,t=None):
    if t:
        return {'RF':r['rf'],'Requisito':t['Requisito / criterio'],'Nivel':NIVEL.get(r['nivel'],r['nivel']),'Componente / caso de uso':t['Componente / CU'] or VACIO,'Arquitectura':t['Arquitectura'] or VACIO,'Componentes':t['Componentes'] or VACIO,'Diagrama de clases (clases)':t['Clases utilizadas'] or VACIO,'Estados':t['Actividades / estados'] or VACIO,'Secuencias':t['Secuencias'] or VACIO,'Actividades':t['Actividades / estados'] or VACIO,'Datos / archivo':t['Datos'] or VACIO,'Caso de uso / método':t['Casos de uso / método'] or VACIO,'Prueba / estado':t['Prueba / estado'] or VACIO,'Código prototipo':t['Código verificado'] or VACIO,'Código objetivo':t['Código objetivo'] or VACIO}
    a,c,u,cl,es,se,ac,da,cu,co=prof(r)
    estado='Beta: maqueta/simulación; no implementado' if r['nivel']=='B' else ('Quitado: no implementar' if r['nivel']=='Q' else 'Prototipo local R7.7; no sistema productivo')
    return {'RF':r['rf'],'Requisito':r['requisito'],'Nivel':NIVEL.get(r['nivel'],r['nivel']),'Componente / caso de uso':cu,'Arquitectura':a,'Componentes':c,'Diagrama de clases (clases)':cl,'Estados':es,'Secuencias':se,'Actividades':ac,'Datos / archivo':da,'Caso de uso / método':cu,'Prueba / estado':estado,'Código prototipo':co,'Código objetivo':'Propuesto: módulo NestJS homónimo; entidad Prisma/PostgreSQL; sin código de aplicación hasta aceptar ADR-001'}

def main():
    with io.open(T76,encoding='utf-8-sig',newline='') as f: old={x['RF']:x for x in csv.DictReader(f)}
    with io.open(M77,encoding='utf-8-sig',newline='') as f: base=list(csv.DictReader(f))
    rows=[row_base(r,old.get(r['rf'])) for r in base]
    fields=list(rows[0])
    with io.open(CSVOUT,'w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
    with io.open(MDOUT,'w',encoding='utf-8',newline='') as f:
        f.write('# Matriz detallada de trazabilidad R7.8 (RF-01 a RF-215)\n\n')
        f.write('Generada por `herramientas/generar_trazabilidad_detallada_r78.py`. Una fila por RF. `—` significa que no existe relación en el diagrama o código disponible, no que se haya omitido la revisión. Para lectura y filtrado usar el CSV; el PDF contiene la misma matriz en dos tablas continuadas.\n\n')
        f.write('| RF | Requisito | Nivel | Clases | Código prototipo | Estado |\n|---|---|---|---|---|---|\n')
        for x in rows: f.write('| {RF} | {Requisito} | {Nivel} | {Diagrama de clases (clases)} | {Código prototipo} | {Prueba / estado} |\n'.format(**{k:str(v).replace('|','/') for k,v in x.items()}))
    # Dos tablas conservan todas las columnas, pero evitan una tipografía ilegible de 15 columnas en una sola hoja.
    out=[r'% Generado automáticamente. Matriz detallada R7.8; no editar a mano.',r'\clearpage\section{Matriz detallada de trazabilidad R7.8}\label{sec:trazabilidad-r78}',r'Cada fila corresponde a un RF. La matriz conserva los IDs y las clases exactas cuando existe diagrama de clases; ``--'' indica que no existe relación documentada. Las referencias a código son del prototipo local o del diseño objetivo y no prueban una aplicación productiva.',r'\begin{landscape}\tiny\setlength{\tabcolsep}{1.2pt}',r'\begin{longtable}{p{.7cm}p{3.3cm}p{1.2cm}p{2.3cm}p{2.3cm}p{2.3cm}p{5.0cm}p{3.0cm}}',r'\caption{Trazabilidad detallada: arquitectura, casos de uso y clases (RF-01 a RF-215)}\\\toprule RF & Requisito & Nivel & Arquitectura & Componentes & Caso de uso & Diagrama de clases (clases) & Datos/archivo\\\midrule\endfirsthead',r'\toprule RF & Requisito & Nivel & Arquitectura & Componentes & Caso de uso & Diagrama de clases (clases) & Datos/archivo\\\midrule\endhead']
    for x in rows: out.append('%s & %s & %s & %s & %s & %s & %s & %s\\\\' % tuple(tex(x[k]) for k in ['RF','Requisito','Nivel','Arquitectura','Componentes','Caso de uso / método','Diagrama de clases (clases)','Datos / archivo']))
    out += [r'\bottomrule\end{longtable}',r'\begin{longtable}{p{.7cm}p{3.1cm}p{2.5cm}p{2.5cm}p{2.5cm}p{2.5cm}p{4.0cm}p{4.0cm}}',r'\caption{Trazabilidad detallada: comportamiento, evidencia y código (continuación)}\\\toprule RF & Requisito & Estados & Secuencias & Actividades & Prueba/estado & Código prototipo & Código objetivo\\\midrule\endfirsthead',r'\toprule RF & Requisito & Estados & Secuencias & Actividades & Prueba/estado & Código prototipo & Código objetivo\\\midrule\endhead']
    for x in rows: out.append('%s & %s & %s & %s & %s & %s & %s & %s\\\\' % tuple(tex(x[k]) for k in ['RF','Requisito','Estados','Secuencias','Actividades','Prueba / estado','Código prototipo','Código objetivo']))
    out += [r'\bottomrule\end{longtable}\normalsize\end{landscape}','']
    with io.open(TEXOUT,'w',encoding='utf-8',newline='') as f:f.write('\n'.join(out))
    print('filas',len(rows))
if __name__=='__main__': main()
