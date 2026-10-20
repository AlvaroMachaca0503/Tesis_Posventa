# -*- coding: utf-8 -*-
"""Genera ../fuentes-latex/capturas_r77.tex desde ../fuentes-latex/capturas_r77/INDICE_CAPTURAS.md.

Las capturas las produce prototipo/pruebas/capturas_r77.mjs (datos sintéticos). Cada figura declara que es una
captura del prototipo HTML local, no del sistema real.
Uso: python herramientas/generar_capturas_tex.py
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTEXTO = os.path.dirname(RAIZ) if os.path.basename(RAIZ) == 'fuentes-proyecto' else RAIZ
LATEX = os.path.join(CONTEXTO, 'fuentes-latex') if os.path.basename(CONTEXTO) == '3_contexto-drive' else os.path.join(RAIZ, 'tesis', 'latex')
CARPETA = os.path.join(LATEX, 'capturas_r77')
SALIDA = os.path.join(LATEX, 'capturas_r77.tex')
# Se incluyen en la tesis las vistas principales; el resto queda en la carpeta como material de apoyo.
INCLUIR = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '13', '14', '18', '19', '20', '21', '22', '23', '26', '27', '28', '30', '31',
           '32', '33', '34', '36', '37', '39']


def tex(t):
    for a, b in (('\\', r'\textbackslash{}'), ('&', r'\&'), ('%', r'\%'), ('$', r'\$'), ('#', r'\#'), ('_', r'\_'), ('{', r'\{'), ('}', r'\}')):
        t = t.replace(a, b)
    return t


def main():
    filas = []
    for l in io.open(os.path.join(CARPETA, 'INDICE_CAPTURAS.md'), encoding='utf-8'):
        m = re.match(r'\| (\d\d)_([^|]*?)\.png \| (.*?) \| (.*?) \|', l)
        if m:
            filas.append((m.group(1), m.group(1) + '_' + m.group(2).strip(), m.group(3).strip(), m.group(4).strip()))
    out = []
    w = out.append
    w('% Generado por herramientas/generar_capturas_tex.py. No editar a mano.')
    w(r'\clearpage\section{Capturas del prototipo R7.7}\label{sec:capturas-r77}')
    w('Las figuras siguientes son capturas de pantalla del prototipo HTML R7.7 (\\texttt{prototipo/R\\_Motriz\\_R7.7.html}) tomadas el 19 de octubre de 2026 '
      'con el script \\texttt{prototipo/pruebas/capturas\\_r77.mjs}. Son una \\textbf{demostración local con datos sintéticos} (placas DEM, «Cliente demo», '
      'valores inventados): no son capturas del sistema real, que todavía no existe, ni acreditan su aceptación por usuarios. '
      'La carpeta de fuentes \\texttt{capturas\\_r77/} conserva las %d capturas y su índice; aquí se incluyen las vistas principales.' % len(filas))
    w('')
    for n, arch, titulo, rol in filas:
        if n not in INCLUIR:
            continue
        w(r'\begin{figure}[H]\centering\includegraphics[width=0.94\textwidth,height=0.42\textheight,keepaspectratio]{capturas_r77/%s.png}\caption{%s (captura del prototipo R7.7; rol: %s)}\end{figure}' % (arch, tex(titulo), tex(rol)))
    w('')
    with io.open(SALIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))
    print('capturas', len(filas), 'incluidas', sum(1 for f in filas if f[0] in INCLUIR))


if __name__ == '__main__':
    main()
