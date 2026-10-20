# Entorno de desarrollo y pruebas

Estado verificado el 17/10/2026 en la máquina del investigador. Los comandos de la sección 4 **no se han ejecutado**: los ejecuta el investigador, y cada uno indica qué comprobar.

## 1. Qué hay hoy

| Componente | Estado | Dónde / versión |
|---|---|---|
| Sistema | Windows 10 Pro (10.0.19045), PowerShell 5.1 | — |
| Discos | **C: 6,5 GB libres** (casi lleno) · D: 0 GB · E: 193 GB · **F: 102 GB** · G: 75 GB · J: = Google Drive | Preferir F: para instalaciones y cachés nuevas |
| **Python** | **Instalado** | `C:\Python313\python.exe` · **3.13.3** · lanzador `py` disponible |
| Paquetes Python relevantes | Instalados (104 en total) | openpyxl 3.1.5 (XLSX), reportlab 5.0.1 (PDF), SQLAlchemy 2.0.40, FastAPI 0.122.0, Flask 3.0.0, Django 5.2.8, pytest 9.1.1, PyYAML 6.0.2, Playwright 1.62.0, numpy 2.2.5 |
| ⚠ Alias `python3` | **Apunta a un acceso directo de la tienda de Windows**, no a Python | `C:\Users\alvaa\AppData\Local\Microsoft\WindowsApps\python3.exe`. **Usar `python` o `py`** |
| Node.js | Instalado **portable, no está en el PATH global** | `F:\Tesis\reverse-lab\node` · v22.23.3 · npm 10.9.9. Existe un `npx.ps1` huérfano en `E:\` |
| Java | Instalado | JDK 21.0.1 en `C:\Program Files\Java\jdk-21` (también JDK 1.8 y JRE 1.8) |
| Git | Instalado | 2.47.1 |
| `bash` | Git Bash sí; el `bash` de Windows (WSL) **no tiene distribuciones instaladas** | — |
| Navegadores | Chromium de Playwright **instalado dos veces** (compilaciones 1208 y 1234, ≈ **1,35 GB en C:**); además Chrome y Edge | `C:\Users\alvaa\AppData\Local\ms-playwright` |
| PlantUML | Disponible | `herramientas/bin/plantuml.jar` · 1.2025.10 |
| Tectonic (LaTeX) | Disponible | `herramientas/bin/tectonic/tectonic.exe` · 0.15.0 |
| **xelatex / pdflatex** | **No instalados** | La tesis solo se puede compilar con Tectonic. `CLAUDE.md` de `RMotriz_tesis_contexto` pide xelatex: **sin comprobar** que Tectonic dé el mismo PDF |
| Google Drive | `J:` es una unidad en streaming: recorrerla es **lento** la primera vez | — |

## 2. Qué necesita cada tarea y si se puede hacer hoy

| Tarea | Necesita | ¿Hoy? |
|---|---|---|
| Revisar cambios de la carpeta | PowerShell | Sí |
| Regenerar el catálogo de requisitos | Node | Sí (con Node portable) |
| Buscar datos reales | PowerShell | Sí |
| Renderizar UML | Java + `plantuml.jar` | Sí |
| Verificar UML (`verificar_uml*.py`) | Python | Sí (`python`, no `python3`) |
| **Reconstruir el prototipo R7.6** desde la base | Python | **Sí. Verificado el 17/10/2026:** el resultado coincide con `prototipo/R_Motriz_R7.6.html` **salvo los saltos de línea** (Windows escribe `\r\n`; el original usa `\n`). Normalizados, el SHA-256 es idéntico. `construir.sh` **no** sirve tal cual en esta máquina: llama a `python3` (ver ⚠) |
| Ejecutar las pruebas del prototipo (`prototipo/pruebas/*.mjs`) | Node + paquete npm `playwright` + un Chromium | **Casi:** los `.mjs` aceptan la variable `PW_CHROMIUM` con la ruta de un navegador ya instalado, pero falta instalar el paquete npm `playwright` (descarga pequeña). **No se han ejecutado** |
| Compilar la tesis | Tectonic (o xelatex, no instalado) | Con Tectonic; sin comprobar |
| Implementación real (pista S) | Lo que fije `ADR-001` | Python ya está listo; Node requiere `npm` portable |

## 3. Reproducibilidad del prototipo (verificada)
Comando equivalente a `construir.sh` en PowerShell (copia en carpeta temporal; **no escribe en el proyecto**):
```powershell
$py='C:\Python313\python.exe'; # base_R7.1 -> r72 -> r73 -> r74 -> r75 -> r76
# cada paso: & $py capas\aplicar_r7X.py build\r7(X-1).html build\r7X.html
```
Resultado: el archivo generado difiere del copiado **solo** en 2 836 saltos de línea `\r\n`. Esto confirma lo que afirma `CLAUDE.md` de `RMotriz_tesis_contexto` («idéntico byte a byte»), con esa salvedad de plataforma. Para producir una copia idéntica en Windows, abrir el destino en modo binario o normalizar los saltos de línea después de construir.

## 4. Preparación propuesta (a ejecutar por el investigador)

**4.1 Node en el PATH de la sesión** (no cambia el sistema):
```powershell
$env:Path = "F:\Tesis\reverse-lab\node;" + $env:Path; node -v; npm -v
```
Debe mostrar `v22.23.3` y `10.9.9`.

**4.2 Paquete `playwright` de npm en una carpeta fuera de Drive, reutilizando un Chromium ya instalado:**
```powershell
cd F:\Tesis\reverse-lab; mkdir pw-tests -Force | Out-Null; cd pw-tests; npm init -y; npm i playwright
$env:PW_CHROMIUM = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node "J:\Mi unidad\Trabajo RSA\Tesis sistema posventa\prototipo\pruebas\base.mjs" "J:\Mi unidad\Trabajo RSA\Tesis sistema posventa\prototipo\R_Motriz_R7.6.html" r76
```
Comprobar que `base.mjs` imprime la lista de vistas y `ERRORES 0`. **No probado aquí:** si las pruebas funcionan con Chrome en lugar del Chromium de Playwright, y si el import `playwright` se resuelve desde otra carpeta (puede ser necesario ejecutar desde `pw-tests` o instalar el paquete junto a las pruebas).

**4.3 Liberar espacio en C: (opcional, decisión del investigador).** `C:\Users\alvaa\AppData\Local\ms-playwright` ocupa ≈ 1,35 GB con **dos versiones** de Chromium. Podría conservarse solo la que use el paquete de Python instalado. **No se ha borrado nada.**

**4.4 Dónde vive el código (OPEN-03) — propuesta del asistente**
- **Riesgo:** esta carpeta se sincroniza con Google Drive. `node_modules` (miles de archivos), builds, bases SQLite locales y navegadores **no deberían sincronizarse**. **No se ha comprobado** cómo trata Drive esas carpetas ni si permite excluirlas.
- **Propuesta:** un **repositorio git en un disco local** (por ejemplo `F:\Tesis\sistema-posventa`) para `src/` y `tests/`, y **esta carpeta de Drive para contexto, especificaciones, decisiones, tesis y evidencias**. Los agentes se abren en el repositorio y leen el contexto con directorio adicional (Claude Code: `--add-dir`; Codex: abriendo ambas carpetas).
- **Alternativa:** todo dentro de Drive, verificando antes el comportamiento de Drive con una carpeta de prueba.
- Hasta decidirlo, `src/` y `tests/` de esta carpeta solo contienen un `README`.

## 5. Verificación del entorno
Cuando esté preparado, comprobar y anotar en `REGISTRO_CAMBIOS.md`:
```powershell
node -v; npm -v; py --version; java -version; git --version; npx playwright --version
```
Registrar lo que **no** se pudo comprobar.
