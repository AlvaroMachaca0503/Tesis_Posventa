# Carpeta para GitHub (generada)

**Generada** por `3_contexto-drive/fuentes-proyecto/herramientas/preparar_github.py` desde las fuentes canónicas de Drive. No edites esta copia a mano: modifica `3_contexto-drive/fuentes-proyecto/` y regenera. Sube **esta carpeta** al repositorio.

## Qué se sube
Prototipo R7.7 (HTML, capas, pruebas y plantillas de carga masiva), especificaciones, documentos de alcance, API, decisiones, requisitos y plan, diagramas UML, motor de referencia, agentes y skills, y los scripts que generan los documentos. `.gitignore` excluye `desktop.ini` y todo lo que genera Drive.

## Qué NO se sube (se queda en Drive)
`RMotriz_tesis_contexto/` (solo lectura), las fuentes LaTeX, contexto, historial, referencias, evidencias, `REGISTRO_CAMBIOS.md`, datos reales y archivo histórico. Nunca se sube nada con datos reales, claves o tokens.

## Antes de subir
1. Ejecuta `sanear-datos-reales` (`herramientas/buscar_datos_reales.ps1`). Los HTML de la carpeta de Drive traen 42 ODS históricas con nombres de técnicos reales (INC-E5); **en esta copia el script ya los sustituyó** por «Técnico demo N». Verifica igualmente.
2. Revisa que no haya `desktop.ini` (`git status`).
