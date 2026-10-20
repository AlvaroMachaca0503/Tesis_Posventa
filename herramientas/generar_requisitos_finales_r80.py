# -*- coding: utf-8 -*-
"""Genera los 96 RF finales y su trazabilidad compacta R8.0."""
from pathlib import Path
import csv
CONTEXT=Path(__file__).resolve().parents[2]
DOCS=CONTEXT/'fuentes-proyecto'/'docs'/'requisitos'
LATEX=CONTEXT/'fuentes-latex'

raw='''
ID|Autenticar al usuario antes de acceder a información operativa.
ID|Aplicar permisos por rol, local y responsabilidad asignada.
ID|Administrar usuarios activos, roles y acceso a información sensible.
MASTER|Registrar y editar clientes conservando su historial operativo.
MASTER|Registrar y editar vehículos vinculados a su propietario e historial.
MASTER|Buscar clientes y vehículos por placa, documento, VIN o nombre.
MASTER|Conservar kilometraje, fuente, fecha y observación de cada lectura.
MASTER|Administrar proveedores mínimos para cotizar productos solicitados.
MASTER|Mantener catálogo de servicios con horas estándar y categoría técnica.
MASTER|Mantener catálogo de productos solicitables con referencia y unidad.
ODS|Crear una ODS con cliente, vehículo, local, hora de llegada y responsable.
ODS|Editar cabecera y detalle de una ODS mientras la operación lo permita.
ODS|Registrar servicios, responsable técnico, duración estimada y observaciones.
ODS|Distinguir ítems de servicio e ítems de producto en una misma ODS.
ODS|Registrar tipo de atención, garantía y evidencia de ingreso del vehículo.
ODS|Gestionar la ODS en recepción, en proceso, en entrega y cerrada.
ODS|Cerrar una ODS dejando la información consultable y auditable.
ODS|Solicitar y autorizar correcciones de una ODS cerrada sin borrar historial.
ODS|Mostrar una vista técnica de ODS sin precios ni costos cuando no exista permiso.
IMPORT|Reconocer perfiles de importación Excel o CSV y sus encabezados versionados.
IMPORT|Previsualizar lote, filas válidas, advertencias y errores antes de aplicar.
IMPORT|Importar clientes, vehículos, servicios y ODS de forma atómica.
IMPORT|Evitar duplicidad mediante identificadores externos e importación idempotente.
IMPORT|Conservar fila original, fuente, usuario y resultado de cada importación.
IMPORT|Normalizar descripciones de servicio sin perder el texto de origen.
IMPORT|Permitir revisar y confirmar equivalencias ambiguas antes de afectar planes.
IMPORT|Exportar resultado de importación y conciliación para revisión operativa.
PLAN|Crear plantillas de mantenimiento por grupo o compatibilidad de vehículo.
PLAN|Versionar planes y reglas sin reescribir servicios o proyecciones históricas.
PLAN|Definir reglas por kilometraje, tiempo, perfil de uso y servicio.
PLAN|Evaluar si una regla es aplicable al vehículo antes de generar propuesta.
PLAN|Asignar explícitamente un plan vigente a cada vehículo cuando corresponda.
PLAN|Mostrar línea de tiempo con historial real, proyecciones y evidencias.
PLAN|Reajustar únicamente proyecciones futuras después de un servicio confirmado.
PLAN|Conservar fuente y fecha de cada evento que modifica el plan.
PLAN|Generar recomendaciones con fundamento visible y decisión humana obligatoria.
PLAN|Registrar aceptación, postergación o rechazo de una recomendación.
PLAN|Mantener tareas preventivas autónomas vinculadas a plan y vehículo.
TASK|Crear tareas técnicas desde servicios o necesidades de la ODS.
TASK|Asignar tarea a técnico, jefe de taller o responsable definido.
TASK|Usar estados de tarea Pendiente, En proceso y Completada.
TASK|Registrar fecha, hora, duración estimada y duración real de la tarea.
TASK|Reprogramar una tarea sin alterar la fecha de llegada de la ODS.
TASK|Dividir una tarea iniciada y conservar vínculo entre sus bloques de tiempo.
TASK|Continuar una tarea dividida en otro día u horario.
TASK|Extender una tarea y registrar motivo opcional cuando supera lo planificado.
TASK|Redistribuir duración de servicios en intervalos de 0.25 H-H.
TASK|Recalcular horas de servicios cuando cambia el tiempo real de la ODS.
TASK|Permitir al técnico declarar avance, pausa o postergación con pocos pasos.
TASK|Bloquear edición de jornada cuando el jefe de taller la consolida.
TASK|Permitir a jefe de taller corregir jornada bloqueada con registro de cambio.
TASK|Distinguir tiempo de servicio de huecos no asignados para reporte operativo.
TASK|Mantener subtareas o bloques relacionados bajo la misma ODS.
TASK|Notificar al responsable ante asignación, cambio relevante o comentario mencionado.
AGENDA|Crear citas vinculadas a cliente, vehículo y responsable.
AGENDA|Registrar llegada y convertir la atención en una ODS cuando corresponda.
AGENDA|Visualizar agenda de técnicos por día y franjas horarias.
AGENDA|Validar capacidad y advertir empalmes antes de programar trabajo.
AGENDA|Mover, redimensionar o dividir bloques de agenda en pasos de 15 minutos.
AGENDA|Mostrar almuerzo y horario no disponible sin contabilizarlos como servicio.
BIT|Crear comentarios de bitácora vinculados a ODS, tarea o producto.
BIT|Registrar actor, fecha, cambio anterior, cambio nuevo y motivo cuando aplique.
BIT|Adjuntar foto o archivo como evidencia de una acción autorizada.
BIT|Mencionar usuarios y enlazar una bitácora con tarea, ODS o producto.
BIT|Mostrar historial cronológico de ODS, vehículo y tareas relacionadas.
BIT|Permitir consulta y exportación legible de bitácora sin exponer códigos internos innecesarios.
BIT|Registrar automáticamente eventos relevantes sin impedir comentarios humanos.
REPORT|Reportar horas estimadas, reales, extendidas y huecos por técnico.
REPORT|Reportar ODS por estado, local, responsable y periodo.
REPORT|Reportar cumplimiento y pendientes de planes preventivos.
REPORT|Filtrar reportes por local, fecha, técnico, vehículo y estado.
REPORT|Exportar resultados operativos para revisión administrativa.
REPORT|Diferenciar indicadores de operación de información comercial restringida.
CONFIG|Configurar organización, locales y alcance de usuarios por local.
CONFIG|Configurar horarios, almuerzo, intervalos y capacidad de agenda.
CONFIG|Configurar catálogo, tiempos estándar, tipos de atención y estados permitidos.
CONFIG|Configurar visibilidad de precios de la ODS técnica mediante autorización administrativa.
LOG|Solicitar un producto desde una ODS y vincularlo al ítem requerido.
LOG|Crear una única tarea logística de productos para la solicitud aprobable.
LOG|Agrupar en la tarea logística los productos pendientes de cotización de la ODS.
LOG|Registrar cotización editable con proveedor, alternativa, costo, venta y margen referencial.
LOG|Agregar producto nuevo o alternativa a la cotización sin borrar versiones anteriores.
LOG|Remitir la cotización para revisión de cajera con enlace desde bitácora.
LOG|Cambiar la decisión de cliente a pendiente de aprobación solo al agregar ítems nuevos.
LOG|Aprobar o no aprobar la ODS a nivel de orden, conservando los ítems aprobados.
LOG|Notificar al logístico los productos aprobados que deben comprarse.
LOG|Registrar compra de producto con comprobante y vínculo a ítem de ODS.
LOG|Adjuntar una evidencia de compra y una evidencia de entrega por producto o de forma general.
LOG|Registrar entrega al técnico y mantener la tarea abierta hasta su conformidad.
LOG|Permitir al técnico confirmar todos los productos o confirmarlos uno por uno.
LOG|Marcar producto observado o por cambiar y reabrir la misma tarea logística.
LOG|Completar la tarea logística solo cuando el técnico da conformidad o se resuelve la observación.
LOG|Medir el tiempo desde aprobación de compra hasta entrega y conformidad técnica.
TASK|Permitir al técnico editar la duración prevista de cada servicio asignado.
TASK|Permitir registrar un comentario breve cuando no se detalle la distribución real de horas.
TASK|Asociar retraso de repuesto o logística como causa reportable sin alterar el historial.
TASK|Mantener la tarea técnica abierta mientras existan productos pendientes de conformidad.
TASK|Mostrar al técnico únicamente los productos requeridos, su estado y evidencia autorizada.
TASK|Restringir costos, márgenes y precios a la vista comercial autorizada.
TASK|Permitir arrastrar una tarea no iniciada hacia otra franja sin registrar avance ficticio.
TASK|Mantener la trazabilidad de cada cambio manual de agenda, servicio, producto o tarea.
'''
omit={'Mostrar una vista técnica de ODS sin precios ni costos cuando no exista permiso.','Permitir revisar y confirmar equivalencias ambiguas antes de afectar planes.','Permitir consulta y exportación legible de bitácora sin exponer códigos internos innecesarios.','Configurar visibilidad de precios de la ODS técnica mediante autorización administrativa.','Permitir registrar un comentario breve cuando no se detalle la distribución real de horas.'}
rows=[]
for line in raw.strip().splitlines():
    group,text=line.split('|',1)
    if text not in omit:
        rows.append({'RF':f'RF-{len(rows)+1:03d}','Grupo':group,'Requisito':text})
assert len(rows)==96, len(rows)

# Referencias compactas; las descripciones extensas se centralizan en ANOTACIONES.
meta={
'ID':('A-01','C-01','CU-01','Usuario, Rol, Permiso','D-01','F-01','FE-01','','','','','DP-01'),
'MASTER':('A-01','C-02','CU-02','Cliente, Vehiculo, Proveedor, Kilometraje, Catalogo','D-02','F-02','FE-02','','','','','DP-01'),
'ODS':('A-02','C-03','CU-03','OrdenServicio, DetalleODS, ServicioODS, Evidencia','D-03','F-03','FE-03','','E-01','S-01','AC-01','DP-01'),
'IMPORT':('A-03','C-04','CU-04','Lote, FilaImportacion, IdentidadExterna, ValidadorLote','D-04','F-04','FE-04','','E-02','S-02','AC-02','DP-01'),
'PLAN':('A-04','C-05','CU-05','Plan, VersionPlan, Regla, Aplicabilidad, Asignacion, Proyeccion','D-05','F-05','FE-05','','E-03','S-03','AC-03','DP-01'),
'TASK':('A-05','C-06','CU-06','Tarea, BloqueTiempo, ServicioODS, Usuario','D-06','F-06','FE-06','','E-04','S-04','AC-04','DP-01'),
'AGENDA':('A-05','C-07','CU-07','Cita, AgendaTecnico, BloqueTiempo, OrdenServicio','D-06','F-06','FE-07','','E-04','S-05','AC-05','DP-01'),
'BIT':('A-06','C-08','CU-08','Bitacora, Evidencia, Mencion, Auditoria','D-07','F-07','FE-08','','','S-06','AC-06','DP-01'),
'REPORT':('A-07','C-09','CU-09','ReporteOperativo, Indicador, Filtro','D-08','F-08','FE-09','','','','','DP-01'),
'CONFIG':('A-01','C-10','CU-10','Organizacion, Local, Parametro, Politica','D-01','F-09','FE-10','','','','','DP-01'),
'LOG':('A-08','C-11','CU-11','SolicitudProducto, CotizacionProducto, CompraProducto, EntregaProducto, ConformidadTecnica','D-09','F-10','FE-11','','E-05','S-07','AC-07','DP-01')}
headers=['RF','Arquitectura','Componente','Caso de uso','Clases','Base de datos','Archivo','Código frontend','Código backend','Estados','Secuencia','Actividades','Despliegue']
trace=[]
for r in rows:
    vals=meta[r['Grupo']]
    trace.append(dict(zip(headers,[r['RF'],*vals])))

annotations=[
('A-01','Arquitectura','Identidad, maestros y configuración: interfaz React/TypeScript, API modular NestJS y PostgreSQL propuestos; DAS-0001 y DAF-R78-0001.'),
('A-02','Arquitectura','ODS y evidencia: módulo canónico de orden y control de acceso; DAS-0001.'),
('A-03','Arquitectura','Importación: adaptador Excel/CSV, validador, aplicador transaccional e identidad externa; DAS-0001.'),
('A-04','Arquitectura','Mantenimiento: planes versionados, proyecciones y recomendación revisable; DAS-0001.'),
('A-05','Arquitectura','Ejecución: tareas, bloques y agenda técnica; DCM-R77-0001.'),
('A-06','Arquitectura','Bitácora y auditoría: eventos, comentarios, menciones y evidencias; DAS-0001.'),
('A-07','Arquitectura','Reportes operativos derivados del modelo canónico; DAF-R78-0001.'),
('A-08','Arquitectura','Logística reducida: una tarea de productos enlazada a ODS; no incluye inventario, caja ni compras financieras.'),
('C-01','Componente','Identidad y permisos.'),('C-02','Componente','Maestros de clientes, vehículos, proveedores y catálogo.'),('C-03','Componente','ODS, detalle, estados y evidencia.'),('C-04','Componente','Importador, validador y conciliación.'),('C-05','Componente','Planes, reglas, proyecciones y recomendaciones.'),('C-06','Componente','Tareas y bloques de tiempo.'),('C-07','Componente','Citas, agenda y capacidad.'),('C-08','Componente','Bitácora, evidencias, menciones y auditoría.'),('C-09','Componente','Reportes operativos.'),('C-10','Componente','Organización, locales y parámetros.'),('C-11','Componente','Solicitud, cotización, compra, entrega y conformidad de producto.'),
('CU-01','Caso de uso','Autenticar y administrar acceso.'),('CU-02','Caso de uso','Gestionar maestros y catálogo.'),('CU-03','Caso de uso','Gestionar ODS.'),('CU-04','Caso de uso','Importar y conciliar datos.'),('CU-05','Caso de uso','Gestionar mantenimiento preventivo.'),('CU-06','Caso de uso','Gestionar tarea técnica.'),('CU-07','Caso de uso','Gestionar cita y agenda.'),('CU-08','Caso de uso','Registrar y consultar bitácora.'),('CU-09','Caso de uso','Consultar reporte operativo.'),('CU-10','Caso de uso','Configurar operación.'),('CU-11','Caso de uso','Gestionar tarea logística de productos.'),
('D-01','Datos','usuarios, roles, permisos, organizaciones, locales, parámetros.'),('D-02','Datos','clientes, vehículos, proveedores, kilometrajes, catálogo.'),('D-03','Datos','ODS, detalles, servicios, evidencias y garantías.'),('D-04','Datos','lotes, filas de importación, identidades externas y resultados.'),('D-05','Datos','planes, versiones, reglas, aplicabilidades, asignaciones, proyecciones y recomendaciones.'),('D-06','Datos','tareas, bloques, citas, agenda, jornada y asignaciones.'),('D-07','Datos','bitácoras, menciones, evidencias y auditorías.'),('D-08','Datos','vistas o consultas derivadas de ODS, tareas y planes.'),('D-09','Datos','solicitudes, cotizaciones, alternativas, compras, entregas y conformidades.'),
('F-01','Archivo','Configuración de autenticación y permisos.'),('F-02','Archivo','Pantallas y formularios de maestros.'),('F-03','Archivo','Vista técnica y comercial de ODS.'),('F-04','Archivo','Plantillas Excel/CSV y bitácora de lote.'),('F-05','Archivo','Reglas versionadas y evidencia de plan.'),('F-06','Archivo','Vista de tareas y agenda.'),('F-07','Archivo','Adjuntos de bitácora y evidencia.'),('F-08','Archivo','Exportaciones CSV/PDF de reporte.'),('F-09','Archivo','Parámetros de organización y agenda.'),('F-10','Archivo','Comprobante de compra y evidencias de compra/entrega.'),
('FE-01','Frontend','Pantalla de acceso y gestión de usuarios.'),('FE-02','Frontend','Clientes, vehículos, proveedores y catálogo.'),('FE-03','Frontend','Formulario, detalle, estados y vista técnica de ODS.'),('FE-04','Frontend','Asistente de carga y previsualización.'),('FE-05','Frontend','Planes, línea de tiempo y recomendación.'),('FE-06','Frontend','Tareas, bloques, pausas y jornada.'),('FE-07','Frontend','Agenda técnica y citas.'),('FE-08','Frontend','Bitácora, menciones y evidencias.'),('FE-09','Frontend','Filtros y exportación de reportes.'),('FE-10','Frontend','Parámetros, locales y políticas.'),('FE-11','Frontend','Tarea logística y conformidad técnica.'),
('E-01','Estados','ODS: recepción, en proceso, en entrega y cerrada.'),('E-02','Estados','Lote: borrador, validado, aplicado o rechazado.'),('E-03','Estados','Plan/recomendación: vigente, propuesta, aceptada, postergada o rechazada.'),('E-04','Estados','Tarea: pendiente, en proceso y completada; jornada bloqueada o abierta.'),('E-05','Estados','Producto: solicitado, cotizado, pendiente de aprobación, por comprar, entregado, observado o conforme.'),
('S-01','Secuencia','Crear/editar/cerrar ODS y registrar auditoría.'),('S-02','Secuencia','Cargar, validar, aplicar o revertir lote.'),('S-03','Secuencia','Evento real, reajuste futuro y decisión humana.'),('S-04','Secuencia','Asignar, iniciar, dividir, continuar y completar tarea.'),('S-05','Secuencia','Cita, llegada, ODS y reserva de capacidad.'),('S-06','Secuencia','Evento o comentario, evidencia, mención y notificación.'),('S-07','Secuencia','Solicitud, cotización, aprobación, compra, entrega y conformidad.'),
('AC-01','Actividad','Gestionar ciclo de ODS.'),('AC-02','Actividad','Importar y conciliar lote.'),('AC-03','Actividad','Actualizar plan preventivo.'),('AC-04','Actividad','Gestionar jornada técnica.'),('AC-05','Actividad','Programar atención.'),('AC-06','Actividad','Registrar bitácora.'),('AC-07','Actividad','Gestionar producto solicitado.'),
('DP-01','Despliegue','Navegador web, API modular, base PostgreSQL, almacenamiento de evidencia y servicios de respaldo; DAF-R78-0001.')]

def tex(s):
    s=str(s)
    for a,b in [('\\',r'\textbackslash{}'),('&',r'\&'),('%',r'\%'),('$',r'\$'),('#',r'\#'),('_',r'\_'),('{',r'\{'),('}',r'\}')]: s=s.replace(a,b)
    return s.replace('→',r'$\rightarrow$')

def write_csv(path, data, fields):
    with path.open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(data)

DOCS.mkdir(parents=True,exist_ok=True)
write_csv(DOCS/'REQUISITOS_FUNCIONALES_FINALES_R80.csv',rows,['RF','Requisito'])
write_csv(DOCS/'MATRIZ_TRAZABILIDAD_R80.csv',trace,headers)
write_csv(DOCS/'ANOTACIONES_TRAZABILIDAD_R80.csv',[{'ID':a,'Tipo':b,'Descripción':c} for a,b,c in annotations],['ID','Tipo','Descripción'])
with (DOCS/'REQUISITOS_FUNCIONALES_FINALES_R80.md').open('w',encoding='utf-8') as f:
    f.write('# Requisitos funcionales finales R8.0\n\n96 RF para la tesis. Compras se limitan a la tarea logística de productos; quedan fuera inventario, caja, bancos, facturación e integración tributaria.\n\n')
    for r in rows: f.write(f"- **{r['RF']}** {r['Requisito']}\n")
with (DOCS/'MATRIZ_TRAZABILIDAD_R80.md').open('w',encoding='utf-8') as f:
    f.write('# Matriz de trazabilidad R8.0\n\nLa definición de cada RF está en `REQUISITOS_FUNCIONALES_FINALES_R80.csv`. Celdas vacías indican artefacto no aplicable o aún no definido. Las claves se resuelven en `ANOTACIONES_TRAZABILIDAD_R80.csv`.\n\n')
    f.write('| '+' | '.join(headers)+' |\n|'+ '|'.join(['---']*len(headers))+'|\n')
    for r in trace: f.write('| '+' | '.join(r[h] for h in headers)+' |\n')

reqtex=[r'\section{Requisitos funcionales finales R8.0}\label{sec:rf-r80}',r'La tesis implementa los siguientes 96 requisitos funcionales. La gestión logística se delimita a una tarea de productos vinculada a ODS: solicitud, cotización, aprobación, compra, entrega y conformidad técnica. Inventario, caja, bancos, facturación electrónica, CRM ampliado e integraciones permanecen fuera de esta entrega.',r'\begin{landscape}\scriptsize\setlength{\tabcolsep}{2pt}',r'\begin{longtable}{p{1.15cm}p{22.8cm}}',r'\caption{Requisitos funcionales finales}\\\toprule \textbf{RF} & \textbf{Requisito funcional}\\\midrule\endfirsthead',r'\toprule \textbf{RF} & \textbf{Requisito funcional}\\\midrule\endhead']
for r in rows:reqtex.append(f"{r['RF']} & {tex(r['Requisito'])}\\\\")
reqtex += [r'\bottomrule\end{longtable}\normalsize\end{landscape}', '']
(LATEX/'requisitos_funcionales_finales_r80.tex').write_text('\n'.join(reqtex),encoding='utf-8')

ann=[r'\clearpage\section{Anotaciones de trazabilidad R8.0}\label{sec:anotaciones-r80}',r'Las claves reducen repetición en la matriz. Una celda vacía indica que el artefacto no aplica o no se ha definido; no afirma implementación.',r'\begin{landscape}\scriptsize\setlength{\tabcolsep}{2pt}',r'\begin{longtable}{p{1.3cm}p{2.4cm}p{20.2cm}}',r'\caption{Anotaciones reutilizables}\\\toprule \textbf{ID} & \textbf{Tipo} & \textbf{Significado / artefacto}\\\midrule\endfirsthead',r'\toprule \textbf{ID} & \textbf{Tipo} & \textbf{Significado / artefacto}\\\midrule\endhead']
for a,b,c in annotations:ann.append(f'{a} & {tex(b)} & {tex(c)}\\\\')
ann += [r'\bottomrule\end{longtable}\normalsize\end{landscape}', '']
(LATEX/'anotaciones_trazabilidad_r80.tex').write_text('\n'.join(ann),encoding='utf-8')

# Dos continuaciones compactas: estructura y comportamiento. No se repite la columna Requisito.
tr=[r'\clearpage\section{Matriz de trazabilidad R8.0}\label{sec:trazabilidad-r80}',r'Cada RF se define en la tabla anterior. Las referencias breves se resuelven en la tabla de anotaciones; las celdas vacías no aplican o quedan por definir.',r'\begin{landscape}\tiny\setlength{\tabcolsep}{1.25pt}',r'\begin{longtable}{p{1.0cm}p{1.3cm}p{1.3cm}p{1.25cm}p{5.4cm}p{1.3cm}p{1.3cm}}',r'\caption{Trazabilidad estructural}\\\toprule RF & Arq. & Comp. & CU & Clases & BD & Archivo\\\midrule\endfirsthead',r'\toprule RF & Arq. & Comp. & CU & Clases & BD & Archivo\\\midrule\endhead']
for r in trace:tr.append(' & '.join(tex(r[h]) for h in ['RF','Arquitectura','Componente','Caso de uso','Clases','Base de datos','Archivo'])+r'\\')
tr += [r'\bottomrule\end{longtable}',r'\begin{longtable}{p{1.0cm}p{1.5cm}p{1.5cm}p{1.2cm}p{1.2cm}p{1.2cm}p{1.2cm}p{1.2cm}}',r'\caption{Trazabilidad de construcción y comportamiento (continuación)}\\\toprule RF & Front. & Back. & Estados & Sec. & Act. & Despl. & Prueba\\\midrule\endfirsthead',r'\toprule RF & Front. & Back. & Estados & Sec. & Act. & Despl. & Prueba\\\midrule\endhead']
for r in trace:tr.append(' & '.join(tex(r[h]) for h in ['RF','Código frontend','Código backend','Estados','Secuencia','Actividades','Despliegue'])+r' & \\')
tr += [r'\bottomrule\end{longtable}\normalsize\end{landscape}', '']
(LATEX/'trazabilidad_r80.tex').write_text('\n'.join(tr),encoding='utf-8')
print('RF finales:',len(rows),'trazas:',len(trace),'anotaciones:',len(annotations))