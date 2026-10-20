# Convenciones transversales

Aplican a **todos** los incrementos. Fuentes principales: `docs/contexto/07_ARQUITECTURA_DATOS_TRAZABILIDAD.md` (§4 invariantes, §7 trazabilidad, §9 seguridad), `tesis/latex/modelo/README.md` y `AGENTS.md`. Lo que no cite fuente es **deducción del asistente** y se marca *(deducido)*.

## 1. Identidad y datos
- **IDs internos** (UUID/texto) para toda entidad. Documento, placa o ID externo **nunca** sustituyen al ID interno (07 §4.1).
- Un dato importado conserva **sistema de origen e ID externo**; reimportar no duplica (07 §4.2–3).
- `NULL` significa **desconocido**, nunca cero inferido (modelo README). No se inventan VIN, kilometraje, teléfono, técnico, comprobante ni servicio.
- Dinero en **centavos**, moneda **PEN** (soles) (modelo README, DEC-25).
- Fechas en ISO 8601. La **hora de auditoría es la del servidor**, no la del cliente.
- Borrado **lógico y auditado** por omisión (modelo README). Un ítem retirado deja de sumar pero conserva su historia (07 §4.5).

## 2. Tiempo
- Agenda en **intervalos de 15 minutos**; H-H en múltiplos de **0,25** (DEC-17). Horas reales: precisión de minutos (modelo README).
- Los intervalos de solapamiento se comparan como **[inicio, fin)** dentro de la misma transacción de escritura y se revalidan antes de confirmar (modelo README).
- Horario inicial de demostración: lunes a sábado 08:00–18:00; almuerzo configurable (**valor sin decidir**: OPEN-24).

## 3. Seguridad (07 §9)
- **Autorización en el servidor** por rol y sede. Ocultar un botón no es autorización (05 §1).
- Contraseñas protegidas, sesiones seguras con expiración, **CSRF**, validación de tipo y tamaño de archivos, auditoría no editable, copias de seguridad, acceso financiero restringido, minimización de datos en exportaciones.
- **Datos reales fuera del repositorio y de las demostraciones.** Solo sintéticos (`DEM-xxx`, «Cliente demo …»). Usar la skill `sanear-datos-reales` antes de entregar.

## 4. Operaciones compuestas
- **Transaccionales:** o se aplica todo o nada (importación, archivado, conversión de cita, transferencia).
- **Idempotentes por clave de evento de negocio**, no por clic: un re-cierre, una conversión o una tarea automática usan `claveEvento` (modelo README; `tareas.clave_evento`, `citas.clave_conversion`).
- **Versiones inmutables:** plan, cotización entregada, comprobante de compra emitido (07 §4.8, 10, 11).
- Todo cambio sensible registra **actor, fecha de servidor, entidad, acción, motivo y antes/después** (`EventoAuditoria`; RF-21).

## 5. Vocabulario y nombres
- Estados de ODS: **Recepción, En proceso, Entrega, Archivada** (DEC-05). «Cerrada» es antecedente documental.
- Decisión del cliente: **Pendiente, Aprobada, No aprobada** (DEC-01).
- Estados de tarea: **Pendiente, En proceso, Completada**; «Archivada» es condición (DEC-06).
- Nombres de clases y métodos: **los de los diagramas R8** (`diagramas/R8_propuesta/`): `archivar`, `corregirArchivada`, `reabrir`, `LineaCita`, `ServicioCitas`. Hay conflictos con la matriz R7.6 (INC-B4): resolverlos al implementar.
- Glosario: `docs/contexto/14_GLOSARIO.md`.

## 6. Trazabilidad
Cadena del proyecto: **EDU → ILA → ESP → RF → PR → diagrama → entidad/clase → pantalla → prueba → evidencia** (07 §7). Cada requisito conserva: identificador, redacción verificable, alcance, criterio de aceptación, componente, datos, prueba, evidencia y **estado real**. «Demostrado en HTML» **no** se cambia por «implementado» sin servidor y pruebas.

## 7. Pruebas
- **Pruebas primero** *(deducido)*: cada criterio `CA-xx` tiene al menos una prueba automática antes de escribir el código.
- Cada criterio incluye **rutas negativas** (rol sin permiso, dato faltante, repetición).
- Distinguir lo que acredita cada prueba: una prueba del almacenamiento no acredita la interfaz; una cabecera `%PDF` no acredita el contenido (`AGENTS.md`).
- Las pruebas de interfaz del prototipo (`prototipo/pruebas/`) son **referencia de comportamiento**, no pruebas de la implementación real.
- Resultados con fecha, comando y salida en `docs/evidencias/`. **No se declara «pasa» sin haberlo ejecutado.**

## 8. Documentación mínima por cambio
Entrada en `REGISTRO_CAMBIOS.md`; evidencia en `docs/evidencias/`; matriz y diagramas actualizados cuando cambien nombres o contratos; las reglas del profesor para UML se conservan (`AGENTS.md`).
