# -*- coding: utf-8 -*-
"""Genera ../fuentes-latex/rf_r77.tex (requisitos RF-118 a RF-215 de R7.7) desde docs/requisitos/MAPEO_R77.csv.

Primero ejecuta herramientas/generar_mapeo_r77.py. Los RF-118 en adelante son PROVISIONALES.
Uso: python herramientas/generar_rf_r77_tex.py
"""
import csv, io, os, collections

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTEXTO = os.path.dirname(RAIZ) if os.path.basename(RAIZ) == 'fuentes-proyecto' else RAIZ
LATEX = os.path.join(CONTEXTO, 'fuentes-latex') if os.path.basename(CONTEXTO) == '3_contexto-drive' else os.path.join(RAIZ, 'tesis', 'latex')
CSV = os.path.join(RAIZ, 'docs', 'requisitos', 'MAPEO_R77.csv')
SALIDA = os.path.join(LATEX, 'rf_r77.tex')
NIVEL = {'C': 'Primera versión', 'B': 'Beta', 'Q': 'Quitado'}


def tex(t):
    t = str(t or '')
    for a, b in (('\\', r'\textbackslash{}'), ('&', r'\&'), ('%', r'\%'), ('$', r'\$'), ('#', r'\#'), ('_', r'\_'),
                 ('{', r'\{'), ('}', r'\}'), ('~', r'\textasciitilde{}'), ('^', r'\textasciicircum{}')):
        t = t.replace(a, b)
    return t.replace('⋯', '...').replace('☰', '(menú)').replace('→', r'$\rightarrow$').replace('≥', r'$\geq$').replace('≤', r'$\leq$')


def main():
    with io.open(CSV, encoding='utf-8-sig', newline='') as f:
        filas = [r for r in csv.DictReader(f) if r['origen'] == 'R7.7']
    cuenta = collections.Counter(r['nivel'] for r in filas)
    out = []
    w = out.append
    w('% Generado por herramientas/generar_rf_r77.py desde docs/requisitos/MAPEO_R77.csv. No editar a mano.')
    w(r'\section{Requisitos incorporados en R7.7}\label{sec:rf-r77}')
    w('Los RF-118 a RF-%d formalizan lo que el prototipo R7.7 añadió después de R7.6 y la delimitación del 19 de octubre de 2026. '
      'Su numeración es \\textbf{provisional} (se renumerará al congelar el catálogo) y su criterio describe el comportamiento del prototipo local '
      'verificado con pruebas automatizadas; no equivale a aceptación del experto ni a implementación con servidor. '
      'Del total, %d son de primera versión, %d son beta y %d quedaron quitados. La clasificación es decisión del investigador (DEC-34 a DEC-36).'
      % (117 + len(filas), cuenta['C'], cuenta['B'], cuenta['Q']))
    w('')
    w(r'\small\begin{longtable}{L{1.3cm} L{3.2cm} L{6.4cm} L{2.0cm}}')
    w(r'\caption{Requisitos RF-118 a RF-%d (provisionales)}\\\toprule RF & Módulo & Requisito & Nivel\\\midrule\endfirsthead' % (117 + len(filas)))
    w(r'\toprule RF & Módulo & Requisito & Nivel\\\midrule\endhead')
    for r in filas:
        w(r'%s & %s & %s & %s\\' % (tex(r['rf']).replace('-', r'-\allowbreak '), tex(r['modulo']), tex(r['requisito']), NIVEL.get(r['nivel'], r['nivel'])))
    w(r'\bottomrule\end{longtable}\normalsize')
    w('')
    with io.open(SALIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))
    print('filas', len(filas), dict(cuenta))


if __name__ == '__main__':
    main()
