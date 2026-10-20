# INC-0X — Título

**Estado:** BORRADOR · **Versión:** 0.1 · **Fecha:** AAAA-MM-DD · **Autor:** (quién redactó) · **Aprobada por:** (nadie hasta que el investigador lo registre)

## 1. Objetivo y resultado vertical
Qué debe poder hacer un usuario al terminar, de punta a punta. Citar el criterio de cierre de `docs/contexto/06_ALCANCE_TOTAL_VS_TESIS.md` §7.

## 2. Alcance
- **Incluye:** tabla de requisitos (ver `requisitos-por-incremento/INC-0X.md`).
- **Excluye explícitamente:** lo que podría confundirse con este incremento.
- **Depende de:** incrementos y decisiones previas.

## 3. Reglas de dominio
Cada regla con su fuente (`DEC-xx`, archivo y sección). Separar **cerrada**, **confirmar** y **deducida**.

## 4. Modelo de datos
Entidades y tablas implicadas, y **correcciones necesarias** al modelo propuesto (referir a `docs/decisiones/INCONSISTENCIAS.md`).

## 5. Contratos
Clases y métodos (nombres de `diagramas/R8_propuesta/`), con precondiciones, efectos, errores y auditoría.

## 6. Criterios de aceptación
| ID | RF | Dado / Cuando / Entonces | Origen |
|---|---|---|---|

Incluir casos **negativos** (rol sin permiso, dato faltante, repetición, concurrencia).

## 7. Pruebas previstas
Unitarias del dominio, de API/servicio, de interfaz, negativas. Indicar qué prueba del prototipo (`prototipo/pruebas/`) sirve de referencia.

## 8. Datos y dependencias externas
Datos sintéticos necesarios; archivos reales anonimizados; personas que validan.

## 9. Decisiones abiertas que lo afectan
Lista de `OPEN-xx` con el efecto de cada respuesta posible.

## 10. Riesgos y brechas
Qué puede salir mal y qué se sabe que falta.

## 11. Definición de hecho
Remite a `docs/plan/PLAN_DESARROLLO.md` §4 y añade lo específico del incremento.

## 12. Referencias
Archivos del contexto, UML, SQL, funciones del prototipo.
