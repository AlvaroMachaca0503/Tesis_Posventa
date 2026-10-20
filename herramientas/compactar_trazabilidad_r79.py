# -*- coding: utf-8 -*-
"""Deriva la matriz compacta-detallada R7.9 desde la matriz RF R7.8.
Mantiene una fila por RF y agrupa las columnas en dos tablas LaTeX legibles.
"""
import csv, io, os, re
RAIZ=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTX=os.path.dirname(RAIZ); LATEX=os.path.join(CTX,'fuentes-latex')
SRC=os.path.join(RAIZ,'docs','requisitos','MATRIZ_TRAZABILIDAD_DETALLADA_R78.csv')
CSVOUT=os.path.join(RAIZ,'docs','requisitos','MATRIZ_TRAZABILIDAD_DETALLADA_R79.csv')
MDOUT=os.path.join(RAIZ,'docs','requisitos','MATRIZ_TRAZABILIDAD_DETALLADA_R79.md')
TEXOUT=os.path.join(LATEX,'trazabilidad_detallada_r79.tex')

def pending(s):
    s=(s or '').strip()
    return 'Pendiente' if not s or s.startswith('—') else s

def classes(s):
    s=pending(s)
    ids=set(re.findall(r'DCL(?:-R77)?-\d+',s))
    # Si se trata de un solo diagrama, sus clases bastan; se omite el ID para ahorrar texto.
    if len(ids)==1: s=re.sub(r'DCL(?:-R77)?-\d+:\s*','',s)
    return s

def front(s):
    s=pending(s)
    return s.split('; diseño API:')[0].strip()

def back(s, target):
    extra=''
    if '; diseño API:' in (s or ''): extra=s.split('; diseño API:',1)[1].strip()
    target=(target or '').replace('Propuesto: ','').replace('sin código de aplicación hasta aceptar ADR-001','pendiente de aceptación de ADR-001')
    target=pending(target)
    result=('Pendiente: '+extra+'; '+target) if extra else target
    return clean(result)

def clean(s):
    s=pending(s).replace('no implementado','pendiente').replace('No implementado','Pendiente').replace('no sistema productivo','pendiente de validación operativa')
    s=re.sub(r'[A-Z]{3}(?:-R\d+)?-\d+:\s*--;?\s*', '', s)
    return pending(s.strip(' ;'))

def tex(s):
    s=str(s)
    for a,b in [("\\",r"\textbackslash{}"),("&",r"\&"),("%",r"\%"),("$",r"\$"),("#",r"\#"),("_",r"\_"),("{",r"\{"),("}",r"\}")]:s=s.replace(a,b)
    s=s.replace('—','--').replace('→',r'$\rightarrow$')
    # Los identificadores técnicos y las listas pueden partirse dentro de una
    # celda sin alterar su contenido semántico.
    s=re.sub(r'(?<=[a-záéíóúñ])(?=[A-ZÁÉÍÓÚÑ])', r'\\allowbreak ', s)
    s=s.replace(', ', r',\allowbreak ').replace('; ', r';\allowbreak ').replace('/', r'/\allowbreak ')
    return s

def main():
    with io.open(SRC,encoding='utf-8-sig',newline='') as f: src=list(csv.DictReader(f))
    rows=[]
    for x in src:
        rows.append({'RF':x['RF'],'Requisito':x['Requisito'],'Nivel':x['Nivel'],'Arquitectura':clean(x['Arquitectura']),'Componentes':clean(x['Componentes']),'Caso(s) de uso':clean(x['Caso de uso / método']),'Clases':classes(x['Diagrama de clases (clases)']),'Estados':clean(x['Estados']),'Secuencias':clean(x['Secuencias']),'Actividades':clean(x['Actividades']),'Base de datos / archivos':clean(x['Datos / archivo']),'Código frontend':front(x['Código prototipo']),'Código backend':back(x['Código prototipo'],x['Código objetivo']),'Prueba / pendiente':clean(x['Prueba / estado'])})
    fields=list(rows[0])
    with io.open(CSVOUT,'w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
    with io.open(MDOUT,'w',encoding='utf-8',newline='') as f:
        f.write('# Matriz de trazabilidad compacta y detallada R7.9\n\n')
        f.write('Generada desde R7.8. Una fila por RF; `Pendiente` señala un artefacto previsto. Las columnas se dividen en dos tablas LaTeX para preservar lectura. La matriz CSV conserva todos los campos para filtro académico.\n\n')
        f.write('| RF | Requisito | Componentes / CU | Clases | BD / archivos | Frontend | Backend |\n|---|---|---|---|---|---|---|\n')
        for r in rows:f.write('| {RF} | {Requisito} | {Componentes} / {Caso(s) de uso} | {Clases} | {Base de datos / archivos} | {Código frontend} | {Código backend} |\n'.format(**{k:str(v).replace('|','/') for k,v in r.items()}))
    out=[r'% Generado por compactar_trazabilidad_r79.py. No editar a mano.',r'\clearpage\section{Matriz de trazabilidad compacta y detallada R7.9}\label{sec:trazabilidad-r79}',r'Cada fila corresponde a un requisito funcional. Para mantener lectura en papel, el mismo RF aparece en dos continuaciones: la primera relaciona arquitectura, componentes, casos de uso, clases y datos; la segunda comportamiento, código y evidencia. ``Pendiente'' identifica el artefacto previsto sin atribuir implementación.',r'\begin{landscape}\tiny\setlength{\tabcolsep}{1.2pt}',r'\begin{longtable}{p{.7cm}p{3.2cm}p{1.1cm}p{2.5cm}p{2.5cm}p{3.3cm}p{5.2cm}p{3.5cm}}',r'\caption{Trazabilidad: arquitectura, componentes, casos de uso, clases y datos (RF-01 a RF-215)}\\\toprule RF & Requisito & Nivel & Arquitectura & Componentes & Caso(s) de uso & Clases & Base de datos/archivos\\\midrule\endfirsthead',r'\toprule RF & Requisito & Nivel & Arquitectura & Componentes & Caso(s) de uso & Clases & Base de datos/archivos\\\midrule\endhead']
    for r in rows:out.append('%s & %s & %s & %s & %s & %s & %s & %s\\\\' % tuple(tex(r[k]) for k in ['RF','Requisito','Nivel','Arquitectura','Componentes','Caso(s) de uso','Clases','Base de datos / archivos']))
    out += [r'\bottomrule\end{longtable}',r'\begin{longtable}{p{.7cm}p{3.2cm}p{3.0cm}p{3.0cm}p{3.0cm}p{4.2cm}p{4.2cm}p{3.0cm}}',r'\caption{Trazabilidad: comportamiento, código frontend/backend y evidencia (continuación)}\\\toprule RF & Requisito & Estados & Secuencias & Actividades & Código frontend & Código backend & Prueba/pendiente\\\midrule\endfirsthead',r'\toprule RF & Requisito & Estados & Secuencias & Actividades & Código frontend & Código backend & Prueba/pendiente\\\midrule\endhead']
    for r in rows:out.append('%s & %s & %s & %s & %s & %s & %s & %s\\\\' % tuple(tex(r[k]) for k in ['RF','Requisito','Estados','Secuencias','Actividades','Código frontend','Código backend','Prueba / pendiente']))
    out += [r'\bottomrule\end{longtable}\normalsize\end{landscape}','']
    with io.open(TEXOUT,'w',encoding='utf-8',newline='') as f:f.write('\n'.join(out))
    print('filas',len(rows))
if __name__=='__main__':main()
def main():
    with io.open(SRC,encoding='utf-8-sig',newline='') as f: src=list(csv.DictReader(f))
    rows=[]
    for x in src:
        rows.append({'RF':x['RF'],'Requisito':x['Requisito'],'Nivel':x['Nivel'],'Arquitectura':clean(x['Arquitectura']),'Componentes':clean(x['Componentes']),'Caso(s) de uso':clean(x['Caso de uso / método']),'Clases':classes(x['Diagrama de clases (clases)']),'Estados':clean(x['Estados']),'Secuencias':clean(x['Secuencias']),'Actividades':clean(x['Actividades']),'Base de datos / archivos':clean(x['Datos / archivo']),'Código frontend':front(x['Código prototipo']),'Código backend':back(x['Código prototipo'],x['Código objetivo']),'Prueba / pendiente':clean(x['Prueba / estado'])})
    fields=list(rows[0])
    with io.open(CSVOUT,'w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
    with io.open(MDOUT,'w',encoding='utf-8',newline='') as f:
        f.write('# Matriz de trazabilidad compacta y detallada R7.9\n\n')
        f.write('Generada desde R7.8. Una fila por RF; `Pendiente` señala un artefacto previsto. Las columnas se dividen en dos tablas LaTeX para preservar lectura. La matriz CSV conserva todos los campos para filtro académico.\n\n')
        f.write('| RF | Requisito | Componentes / CU | Clases | BD / archivos | Frontend | Backend |\n|---|---|---|---|---|---|---|\n')
        for r in rows:f.write('| {RF} | {Requisito} | {Componentes} / {Caso(s) de uso} | {Clases} | {Base de datos / archivos} | {Código frontend} | {Código backend} |\n'.format(**{k:str(v).replace('|','/') for k,v in r.items()}))
    out=[r'% Generado por compactar_trazabilidad_r79.py. No editar a mano.',r'\clearpage\section{Matriz de trazabilidad compacta y detallada R7.9}\label{sec:trazabilidad-r79}',r'Cada fila corresponde a un requisito funcional. Para mantener lectura en papel, el mismo RF aparece en dos continuaciones: la primera relaciona arquitectura, componentes, casos de uso, clases y datos; la segunda comportamiento, código y evidencia. ``Pendiente'' identifica el artefacto previsto sin atribuir implementación.',r'\begin{landscape}\tiny\setlength{\tabcolsep}{1.2pt}',r'\begin{longtable}{p{.7cm}p{3.2cm}p{1.1cm}p{2.5cm}p{2.5cm}p{3.3cm}p{5.2cm}p{3.5cm}}',r'\caption{Trazabilidad: arquitectura, componentes, casos de uso, clases y datos (RF-01 a RF-215)}\\\toprule RF & Requisito & Nivel & Arquitectura & Componentes & Caso(s) de uso & Clases & Base de datos/archivos\\\midrule\endfirsthead',r'\toprule RF & Requisito & Nivel & Arquitectura & Componentes & Caso(s) de uso & Clases & Base de datos/archivos\\\midrule\endhead']
    for r in rows:out.append('%s & %s & %s & %s & %s & %s & %s & %s\\\\' % tuple(tex(r[k]) for k in ['RF','Requisito','Nivel','Arquitectura','Componentes','Caso(s) de uso','Clases','Base de datos / archivos']))
    out += [r'\bottomrule\end{longtable}',r'\begin{longtable}{p{.7cm}p{3.2cm}p{3.0cm}p{3.0cm}p{3.0cm}p{4.2cm}p{4.2cm}p{3.0cm}}',r'\caption{Trazabilidad: comportamiento, código frontend/backend y evidencia (continuación)}\\\toprule RF & Requisito & Estados & Secuencias & Actividades & Código frontend & Código backend & Prueba/pendiente\\\midrule\endfirsthead',r'\toprule RF & Requisito & Estados & Secuencias & Actividades & Código frontend & Código backend & Prueba/pendiente\\\midrule\endhead']
    for r in rows:out.append('%s & %s & %s & %s & %s & %s & %s & %s\\\\' % tuple(tex(r[k]) for k in ['RF','Requisito','Estados','Secuencias','Actividades','Código frontend','Código backend','Prueba / pendiente']))
    out += [r'\bottomrule\end{longtable}\normalsize\end{landscape}','']
    with io.open(TEXOUT,'w',encoding='utf-8',newline='') as f:f.write('\n'.join(out))
    print('filas',len(rows))
if __name__=='__main__':main()
