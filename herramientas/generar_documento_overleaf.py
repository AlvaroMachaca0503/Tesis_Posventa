# -*- coding: utf-8 -*-
"""Arma 2_documento-tesis-overleaf/ lista para Overleaf.

Estructura:  main.tex (documento completo, sin \\input) · logo_salle.png · imagenes/ por capítulo
Flujo: sube/sustituye la carpeta imagenes/ en Overleaf y pega el contenido de main.tex en su main.tex.
Fuente: tesis/latex/ (tesis_tecnologica_revision.tex y los archivos que incluye). No se usa la carpeta de tablas.
Uso: python herramientas/generar_documento_overleaf.py
Las imágenes publicadas se reducen a un máximo de 750 px por lado: conserva la
lectura al tamaño de página y evita exceder el límite de compilación gratuito.
Los originales no se modifican y permanecen en fuentes-latex/.
"""
import io, os, re, shutil, subprocess, tempfile
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTEXTO = os.path.dirname(RAIZ) if os.path.basename(RAIZ) == 'fuentes-proyecto' else RAIZ
BASE = os.path.dirname(CONTEXTO) if os.path.basename(CONTEXTO) == '3_contexto-drive' else RAIZ
SRC = os.path.join(CONTEXTO, 'fuentes-latex') if os.path.basename(CONTEXTO) == '3_contexto-drive' else os.path.join(RAIZ, 'tesis', 'latex')
OUT = os.path.join(BASE, '2_documento-tesis-overleaf')
LADO_MAXIMO = int(os.environ.get('OVERLEAF_MAX_PX', '750'))
TECTONIC = os.path.join(RAIZ, 'herramientas', 'bin', 'tectonic', 'tectonic.exe')


def leer(n):
    return io.open(os.path.join(SRC, n), encoding='utf-8').read()


def optimizar_imagenes():
    """Optimiza las copias PNG y reduce las sobredimensionadas para Overleaf."""
    n = 0
    for carpeta, _, archivos in os.walk(os.path.join(OUT, 'imagenes')):
        for archivo in archivos:
            if not archivo.lower().endswith('.png'):
                continue
            ruta = os.path.join(carpeta, archivo)
            with Image.open(ruta) as imagen:
                if max(imagen.size) > LADO_MAXIMO:
                    imagen.thumbnail((LADO_MAXIMO, LADO_MAXIMO), Image.Resampling.LANCZOS)
                imagen.save(ruta, optimize=True)
                n += 1
    return n


def preparar_cache_compilacion():
    """Genera aux/toc/out para que Overleaf no necesite rondas iniciales extra."""
    if not os.path.isfile(TECTONIC):
        return False
    with tempfile.TemporaryDirectory(prefix='overleaf-cache-') as temporal:
        r = subprocess.run(
            [TECTONIC, '-X', 'compile', '-r', '0', '-k', '--outdir', temporal, 'main.tex'],
            cwd=OUT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        )
        if r.returncode != 0:
            print('AVISO: no se pudo precalcular aux/toc/out para Overleaf.')
            return False
        for nombre in ('main.aux', 'main.toc', 'main.out'):
            origen = os.path.join(temporal, nombre)
            if not os.path.isfile(origen):
                print('AVISO: Tectonic no generó', nombre)
                return False
            shutil.copy2(origen, os.path.join(OUT, nombre))
    return True


def main():
    s = leer('tesis_tecnologica_revision.tex')
    for m in sorted(set(re.findall(r'\\input\{([^}]+)\}', s))):
        s = s.replace('\\input{%s}' % m, leer(m))
    shutil.copytree(os.path.join(SRC, 'imagenes'), os.path.join(OUT, 'imagenes'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('desktop.ini'))
    optimizadas = optimizar_imagenes()
    shutil.copy(os.path.join(SRC, 'logo_salle.png'), os.path.join(OUT, 'logo_salle.png'))
    with io.open(os.path.join(OUT, 'main.tex'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('% !TEX program = xelatex' + chr(10) + s)
    cache_lista = preparar_cache_compilacion()
    with io.open(os.path.join(OUT, 'latexmkrc'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# Compilación rápida: el paquete incluye main.aux, main.toc y main.out precalculados.\n'
                '# Tras cambios estructurales, regenere este paquete para actualizar esa caché.\n'
                '$max_repeat = 1;\n')
    with io.open(os.path.join(OUT, 'LEEME.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# Documento de la tesis para Overleaf\n\n**Generado** desde `3_contexto-drive/fuentes-latex/` por `3_contexto-drive/fuentes-proyecto/herramientas/generar_documento_overleaf.py` (no editar a mano).\n\n1. En Overleaf, borra la carpeta `imagenes` y sube esta `imagenes`, organizada por capítulo.\n2. Sube también `main.tex`, `logo_salle.png`, `latexmkrc`, `main.aux`, `main.toc` y `main.out` a la raíz del proyecto. La caché y `latexmkrc` evitan rondas extra de compilación en el plan gratuito.\n3. En Overleaf: Menú › Compilador = **XeLaTeX** (o LuaLaTeX); si queda en pdfLaTeX sale «fontspec requires XeTeX o LuaTeX». Marca `main.tex` como documento principal y pulsa Recompile.\n\nLas PNG publicadas se ajustan a un máximo de 750 px por lado para reducir el tiempo de compilación; las imágenes originales siguen intactas en `3_contexto-drive/fuentes-latex/`. Si se cambia la estructura de capítulos, referencias o tabla de contenidos, vuelve a generar este paquete para actualizar la caché. No hay carpeta de tablas: las tablas son LaTeX.\n')
    print('main.tex', len(s), 'bytes | PNG optimizadas', optimizadas, '| cache', 'lista' if cache_lista else 'no disponible')


if __name__ == '__main__':
    main()
