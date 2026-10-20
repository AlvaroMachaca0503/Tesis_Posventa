# -*- coding: utf-8 -*-
"""Genera ../fuentes-latex/trazabilidad_r77.tex: matriz de trazabilidad única R7.7 (RF-01 a RF-215) en LaTeX.

Fuentes: ../fuentes-latex/trazabilidad_R76.csv (RF-01..117: clases, prueba y función del prototipo) y
docs/requisitos/MAPEO_R77.csv (nivel de cada RF y RF-118 en adelante). Es una propuesta: la columna
«Cambio R7.7» enlaza con las decisiones DEC-32 a DEC-48. Uso: python herramientas/generar_trazabilidad_tex.py
"""
import csv, io, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTEXTO = os.path.dirname(RAIZ) if os.path.basename(RAIZ) == 'fuentes-proyecto' else RAIZ
LATEX = os.path.join(CONTEXTO, 'fuentes-latex') if os.path.basename(CONTEXTO) == '3_contexto-drive' else os.path.join(RAIZ, 'tesis', 'latex')
T76 = os.path.join(LATEX, 'trazabilidad_R76.csv')
M77 = os.path.join(RAIZ, 'docs', 'requisitos', 'MAPEO_R77.csv')
OUT = os.path.join(LATEX, 'trazabilidad_r77.tex')
NIVEL = {'C': 'Primera versión', 'B': 'Beta', 'Q': 'Quitado'}
CAMBIO = {'RF-55': 'Beta y apagado (DEC-37, DEC-48)', 'RF-82': 'Beta y apagado (DEC-37)', 'RF-58': 'Beta', 'RF-83': 'Todos ven los montos; cuentas por sede (DEC-38)',
          'RF-84': 'Traslado desde Bancos (DEC-38)', 'RF-98': 'Bancos con ingreso y egreso a proveedor (DEC-38)', 'RF-93': 'Filtro por sede; técnicos por servicio (DEC-41)',
          'RF-94': 'Diseño nuevo de cotización (DEC-45)', 'RF-97': 'Solo pendientes (DEC-44)', 'RF-109': 'Series por sede (DEC-39)', 'RF-114': 'Sin capacidad productiva; encuesta con enlace (DEC-42, DEC-43)',
          'RF-95': 'Serie de la sede (DEC-39)'}


def tex(t):
    t = str(t or '')
    for a, b in (('\\', r'\textbackslash{}'), ('&', r'\&'), ('%', r'\%'), ('$', r'\$'), ('#', r'\#'), ('_', r'\_'), ('{', r'\{'), ('}', r'\}'), ('~', r'\textasciitilde{}'), ('^', r'\textasciicircum{}')):
        t = t.replace(a, b)
    return t.replace('⋯', '...').replace('☰', '(menú)').replace('→', r'$\rightarrow$').replace('≥', r'$\geq$').replace('≤', r'$\leq$').replace('R7.6.html', 'R7.x.html')


def corto(t, n):
    t = str(t or '')
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0] + '…'


def main():
    with io.open(T76, encoding='utf-8-sig', newline='') as f:
        t76 = {r['RF']: r for r in csv.DictReader(f)}
    with io.open(M77, encoding='utf-8-sig', newline='') as f:
        m77 = list(csv.DictReader(f))
    out = [r'% Generado por herramientas/generar_trazabilidad_tex.py. No editar a mano.',
           r'\begin{landscape}\footnotesize',
           r'\begin{longtable}{L{1.3cm} L{8.2cm} L{2.3cm} L{4.6cm} L{3.7cm} L{3.7cm}}',
           r'\caption{Trazabilidad única R7.7 (RF-01 a RF-%d)}\\\toprule RF & Requisito & Nivel & Clases o módulo & Prueba o estado & Cambio R7.7\\\midrule\endfirsthead' % len(m77),
           r'\toprule RF & Requisito & Nivel & Clases o módulo & Prueba o estado & Cambio R7.7\\\midrule\endhead']
    for r in m77:
        rf = r['rf']
        if rf in t76:
            t = t76[rf]
            req, cl, pr = t['Requisito / criterio'], t['Clases utilizadas'], t['Prueba / estado']
        else:
            req, cl, pr = r['requisito'], r['modulo'] + ' (' + r['incremento_o_bloque'] + ')', 'Prototipo R7.7 (e2e77)'
        out.append(r'%s & %s & %s & %s & %s & %s\\' % (tex(rf).replace('-', r'-\allowbreak '), tex(corto(req, 170)), NIVEL.get(r['nivel'], r['nivel']), tex(corto(cl, 90)), tex(corto(pr, 70)), tex(CAMBIO.get(rf, r['nota']))))
    out += [r'\bottomrule\end{longtable}\normalsize\end{landscape}', '']
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))
    print('filas', len(m77))


if __name__ == '__main__':
    main()
