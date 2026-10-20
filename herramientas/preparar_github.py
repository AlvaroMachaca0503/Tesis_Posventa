# -*- coding: utf-8 -*-
"""Arma 1_github-proyecto/ con lo que se sube al repositorio de GitHub.

Se COPIA (no se mueve) desde la carpeta de Drive. Lo que no se sube queda en Drive.
Nunca se copian desktop.ini, node_modules, binarios ni datos reales. Vuelve a ejecutarse cuando cambie algo.
Uso: python herramientas/preparar_github.py
"""
import io, os, re, shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTEXTO = os.path.dirname(RAIZ) if os.path.basename(RAIZ) == 'fuentes-proyecto' else RAIZ
BASE = os.path.dirname(CONTEXTO) if os.path.basename(CONTEXTO) == '3_contexto-drive' else RAIZ
OUT = os.path.join(BASE, '1_github-proyecto')
SUBE = [  # (origen, destino) relativos a la raíz
    ('AGENTS.md', 'AGENTS.md'), ('CLAUDE.md', 'CLAUDE.md'), ('README.md', 'README.md'),
    ('prototipo/R_Motriz_R7.7.html', 'prototipo/R_Motriz_R7.7.html'), ('prototipo/R_Motriz_R7.6.html', 'prototipo/R_Motriz_R7.6.html'),
    ('prototipo/capas', 'prototipo/capas'), ('prototipo/pruebas', 'prototipo/pruebas'), ('prototipo/carga_masiva', 'prototipo/carga_masiva'), ('prototipo/construir.sh', 'prototipo/construir.sh'),
    ('specs', 'specs'),
    ('docs/alcance', 'docs/alcance'), ('docs/api', 'docs/api'), ('docs/decisiones', 'docs/decisiones'), ('docs/requisitos', 'docs/requisitos'), ('docs/plan', 'docs/plan'),
    ('diagramas', 'diagramas'), ('nucleo-referencia', 'nucleo-referencia'),
    ('agentes/definiciones', 'agentes/definiciones'), ('.agents/skills', '.agents/skills'),
    ('herramientas', 'herramientas'),
]
IGNORAR = {'desktop.ini', 'thumbs.db', '.ds_store', 'node_modules', '__pycache__', 'build', 'bin'}


def copiar(a, b):
    if os.path.isdir(a):
        for r, ds, fs in os.walk(a):
            ds[:] = [d for d in ds if d.lower() not in IGNORAR]
            for f in fs:
                if f.lower() in IGNORAR or f.lower().endswith(('.pdf',)) and 'docs' not in r:
                    continue
                d = os.path.join(b, os.path.relpath(os.path.join(r, f), a))
                os.makedirs(os.path.dirname(d), exist_ok=True)
                shutil.copy2(os.path.join(r, f), d)
    elif os.path.isfile(a):
        os.makedirs(os.path.dirname(b), exist_ok=True)
        shutil.copy2(a, b)


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT, exist_ok=True)
    for o, d in SUBE:
        copiar(os.path.join(RAIZ, o), os.path.join(OUT, d))
    # los HTML traen ODS históricas con nombres de técnicos reales: en la copia para GitHub se sustituyen por nombres inventados
    for r, ds, fs in os.walk(os.path.join(OUT, 'prototipo')):
        for f in fs:
            if f.lower().endswith('.html'):
                ruta = os.path.join(r, f)
                t = io.open(ruta, encoding='utf-8', newline='').read()
                mp = {}
                t2 = re.sub(r'("technicianName"\s*:\s*")([^"]*)(")', lambda m: m.group(1) + mp.setdefault(m.group(2), 'Técnico demo %d' % (len(mp) + 1)) + m.group(3), t)
                if t2 != t:
                    io.open(ruta, 'w', encoding='utf-8', newline='').write(t2)
    for v in ('src', 'tests'):
        os.makedirs(os.path.join(OUT, v), exist_ok=True)
        with io.open(os.path.join(OUT, v, 'README.md'), 'w', encoding='utf-8', newline='\n') as f:
            f.write('# %s\n\nVacío hasta que el investigador acepte `docs/decisiones/ADR-001-pila-tecnologica.md` y cierre OPEN-03.\n' % v)
    with io.open(os.path.join(OUT, '.gitignore'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# Basura de la carpeta sincronizada con Drive\ndesktop.ini\n**/desktop.ini\nThumbs.db\n.DS_Store\n\n# Dependencias, compilados y datos\nnode_modules/\n__pycache__/\n*.pyc\nbuild/\ndist/\n*.sqlite\n*.sqlite3\n*.db\n.env\n*.pem\n\n# Datos reales o secretos: nunca\ndatos_reales/\nsecretos/\n')
    with io.open(os.path.join(OUT, 'LEEME_GITHUB.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('''# Carpeta para GitHub (generada)

**Generada** por `3_contexto-drive/fuentes-proyecto/herramientas/preparar_github.py` desde las fuentes canónicas de Drive. No edites esta copia a mano: modifica `3_contexto-drive/fuentes-proyecto/` y regenera. Sube **esta carpeta** al repositorio.

## Qué se sube
Prototipo R7.7 (HTML, capas, pruebas y plantillas de carga masiva), especificaciones, documentos de alcance, API, decisiones, requisitos y plan, diagramas UML, motor de referencia, agentes y skills, y los scripts que generan los documentos. `.gitignore` excluye `desktop.ini` y todo lo que genera Drive.

## Qué NO se sube (se queda en Drive)
`RMotriz_tesis_contexto/` (solo lectura), las fuentes LaTeX, contexto, historial, referencias, evidencias, `REGISTRO_CAMBIOS.md`, datos reales y archivo histórico. Nunca se sube nada con datos reales, claves o tokens.

## Antes de subir
1. Ejecuta `sanear-datos-reales` (`herramientas/buscar_datos_reales.ps1`). Los HTML de la carpeta de Drive traen 42 ODS históricas con nombres de técnicos reales (INC-E5); **en esta copia el script ya los sustituyó** por «Técnico demo N». Verifica igualmente.
2. Revisa que no haya `desktop.ini` (`git status`).
''')
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print('archivos', n)


if __name__ == '__main__':
    main()
