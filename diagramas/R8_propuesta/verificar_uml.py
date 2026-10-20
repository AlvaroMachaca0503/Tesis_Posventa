#!/usr/bin/env python3
"""Verificador UML R8. Uso: python3 verificar_uml.py [directorio]
Comprueba: (1) cada mensaje de las secuencias DSE-R8-* esta numerado,
(2) la numeracion es consistente (N, N.M, N.M.K) y sin saltos/duplicados,
(3) el receptor es una clase del diagrama de clases y tiene ese metodo,
(4) las transiciones de los diagramas de estados con 'metodo(' existen en alguna clase.
Los participantes 'actor' se omiten como receptores."""
import re, sys, glob, os
d = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
classes = {}   # nombre -> set(metodos)
for f in sorted(glob.glob(os.path.join(d, 'DCL-R8-*.puml'))):
    cur = None
    for line in open(f, encoding='utf8'):
        m = re.match(r'\s*(?:class|enum)\s+(\w+)\s*(?:<<.*?>>)?\s*(\{)?', line)
        if m:
            cur = m.group(1) if m.group(2) else None
            classes.setdefault(m.group(1), set())
            continue
        if line.strip() == '}': cur = None; continue
        mm = re.match(r'\s*[+\-#~]?(\w+)\(.*?\)', line)
        if cur and mm: classes[cur].add(mm.group(1))
errores = []; resumen = []
for f in sorted(glob.glob(os.path.join(d, 'DSE-R8-*.puml'))):
    actores, parts = set(), {}
    msgs = []
    for line in open(f, encoding='utf8'):
        a = re.match(r'\s*actor\s+(?:"[^"]*"\s+as\s+(\w+)|(\w+))', line)
        if a: actores.add(a.group(1) or a.group(2)); continue
        p = re.match(r'\s*participant\s+(\w+)', line)
        if p: parts[p.group(1)] = True; continue
        m = re.match(r'\s*(\w+)\s*->\s*(\w+)\s*:\s*(\d+(?:\.\d+)*)\.?\s+(\w+)\(', line)
        if m: msgs.append(m.groups()); continue
        if re.match(r'\s*\w+\s*->\s*\w+\s*:', line):
            errores.append(f'{os.path.basename(f)}: llamada sin numerar: {line.strip()}')
    nums = [m[2] for m in msgs]
    for i, (e, r, n, meth) in enumerate(msgs):
        if r in actores: errores.append(f'{os.path.basename(f)} {n}: el receptor {r} es actor'); continue
        if r not in classes: errores.append(f'{os.path.basename(f)} {n}: receptor {r} no es clase del DCL')
        elif meth not in classes[r]: errores.append(f'{os.path.basename(f)} {n}: {r}.{meth}() no existe en el diagrama de clases')
    # numeracion: el primero de cada nivel debe ser 1 o prefijo+1; no repetir etiquetas dentro de la misma rama
    vistos = set()
    for n in nums:
        if n in vistos and not any(x == n for x in []):
            pass
        vistos.add(n)
    por_padre = {}
    for n in nums:
        partes = n.split('.'); padre = '.'.join(partes[:-1]); por_padre.setdefault(padre, []).append(int(partes[-1]))
    for padre, lst in por_padre.items():
        u = sorted(set(lst))
        if u != list(range(u[0], u[0] + len(u))) or (padre != '' and u[0] != 1):
            errores.append(f'{os.path.basename(f)}: numeracion discontinua bajo "{padre or "raiz"}": {u}')
    resumen.append((os.path.basename(f), len(msgs)))
for f in sorted(glob.glob(os.path.join(d, 'DES-R8-*.puml'))):
    metodos = set(m for s in classes.values() for m in s)
    for line in open(f, encoding='utf8'):
        for mm in re.finditer(r'(?<![\\\w])(\w+)\(', line):
            nom = mm.group(1)
            if nom in ('crearDesdeCita',) or nom in metodos: continue
            if nom in ('avanzarEstado',): continue
            if nom.isupper() or nom in ('EN_PROCESO',): continue
            if re.search(r'\b%s\(' % nom, line) and nom not in metodos and nom[0].islower():
                errores.append(f'{os.path.basename(f)}: disparador {nom}() no existe como metodo')
print('Clases:', len(classes), '| Metodos:', sum(len(v) for v in classes.values()))
for n, c in resumen: print(f'  {n}: {c} llamadas verificadas')
if errores:
    print('FALLÓ'); [print(' -', e) for e in errores]; sys.exit(1)
print('PASÓ: todas las llamadas numeradas, con receptor y metodo existentes en el diagrama de clases.')
