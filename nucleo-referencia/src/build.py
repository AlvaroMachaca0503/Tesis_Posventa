#!/usr/bin/env python3
"""Construye (1) motor.build.js para pruebas Node y (2) R_Motriz_R8_nucleo.html autocontenido."""
import os, re
d = os.path.dirname(os.path.abspath(__file__)); out = os.path.dirname(d)
planes = open(os.path.join(d, 'planes_r7.json'), encoding='utf8').read()
motor = open(os.path.join(d, 'motor.js'), encoding='utf8').read().replace('__PLANES_R7__', planes)
open(os.path.join(d, 'motor.build.js'), 'w', encoding='utf8').write(motor)
if os.path.exists(os.path.join(d, 'ui.js')):
    tpl = open(os.path.join(d, 'plantilla.html'), encoding='utf8').read()
    css = open(os.path.join(d, 'estilos.css'), encoding='utf8').read()
    ui = open(os.path.join(d, 'ui.js'), encoding='utf8').read()
    html = tpl.replace('/*__CSS__*/', css).replace('/*__MOTOR__*/', motor.replace('</script', '<\\/script')).replace('/*__UI__*/', ui.replace('</script', '<\\/script'))
    open(os.path.join(out, 'R_Motriz_R8_nucleo.html'), 'w', encoding='utf8').write(html)
    print('HTML:', len(html), 'bytes')
print('motor.build.js:', len(motor), 'bytes')
