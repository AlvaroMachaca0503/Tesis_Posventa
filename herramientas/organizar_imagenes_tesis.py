# -*- coding: utf-8 -*-
"""Reubica las imágenes de la tesis por capítulo y actualiza sus referencias.

No modifica los .puml: esos archivos son la fuente técnica de los diagramas.
Las PNG publicadas reciben un código y un nombre corto, para que la carpeta
de imágenes pueda entenderse sin abrir el documento.
"""
from __future__ import annotations

import re
import shutil
import unicodedata
from pathlib import Path


RAIZ_PROYECTO = Path(__file__).resolve().parents[1]
CONTEXTO = RAIZ_PROYECTO.parent
SRC = CONTEXTO / "fuentes-latex"
TEX = SRC / "tesis_tecnologica_revision.tex"
CAPTURAS_TEX = SRC / "capturas_r77.tex"
IMAGENES = SRC / "imagenes"


def slug(texto: str, limite: int = 4) -> str:
    """Convierte un título visible en un identificador breve y ASCII."""
    texto = re.sub(r"\\[a-zA-Z]+(?:\{[^}]*\})?", " ", texto)
    texto = re.sub(r"\([^)]*\)", " ", texto)
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    palabras = re.findall(r"[a-zA-Z0-9]+", texto.lower())
    excluir = {"de", "del", "la", "las", "el", "los", "y", "en", "por", "para", "sin", "con", "una", "un", "al", "se", "no", "es"}
    palabras = [p for p in palabras if p not in excluir and not re.fullmatch(r"d(?:a[scf]|c[mlus]|es|se|md)-r?77?-?\d+", p)]
    return "_".join(palabras[:limite]) or "diagrama"


def mover(origen: Path, destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if not origen.exists() and destino.exists():
        return
    if not origen.exists():
        raise FileNotFoundError(origen)
    if destino.exists():
        raise FileExistsError(f"Destino ya existe: {destino}")
    shutil.move(str(origen), str(destino))


def main() -> None:
    contenido = TEX.read_text(encoding="utf-8")
    capturas = CAPTURAS_TEX.read_text(encoding="utf-8")
    cambios: dict[str, str] = {}

    # Figuras de antecedentes y estado del arte; 1--3 eran diagramas del proyecto.
    fijas = {
        "0.png": ("capitulo_01_problematica/C01-F01_busqueda_prisma.png", "imagenes_graficos/0.png"),
        "4.png": ("capitulo_02_fundamentos/C02-F01_estrategias_mantenimiento.png", "imagenes_graficos/4.png"),
        "5.png": ("capitulo_02_fundamentos/C02-F02_marco_d3m.png", "imagenes_graficos/5.png"),
        "6.png": ("capitulo_02_fundamentos/C02-F03_arquitectura_servicios.png", "imagenes_graficos/6.png"),
        "7.png": ("capitulo_02_fundamentos/C02-F04_diagnostico_rag.png", "imagenes_graficos/7.png"),
        "8.png": ("capitulo_02_fundamentos/C02-F05_recuperacion_multietapa.png", "imagenes_graficos/8.png"),
        "1.png": ("capitulo_04_diseno/diagramas/DAS-0002_arquitectura_proyecto.png", "imagenes_graficos/1.png"),
        "2.png": ("capitulo_04_diseno/diagramas/DCL-0015_clases_mantenimiento.png", "imagenes_graficos/2.png"),
        "3.png": ("capitulo_04_diseno/diagramas/DAC-0007_plan_dinamico.png", "imagenes_graficos/3.png"),
    }
    for viejo, (relativo, referencia) in fijas.items():
        mover(SRC / referencia, IMAGENES / relativo)
        cambios[referencia] = f"imagenes/{relativo}"

    # Diagramas propios: conserva sus fuentes .puml en diagramas/, pero mueve la PNG
    # publicada a la jerarquía del capítulo de diseño y la nombra con código + asunto.
    patron = re.compile(r"\{diagramas/([A-Za-z0-9-]+)\.png\}\\caption\{([^}]*)\}")
    codigos = {codigo: titulo for codigo, titulo in patron.findall(contenido)}
    for codigo, titulo in codigos.items():
        origen = SRC / "diagramas" / f"{codigo}.png"
        if not origen.exists():
            raise FileNotFoundError(origen)
        codigo_publico = "DAM-0002" if codigo == "Metodologia_Scrum_IA_ASE" else codigo
        nuevo = f"{codigo_publico}_{slug(titulo)}.png"
        relativo = f"capitulo_04_diseno/diagramas/{nuevo}"
        mover(origen, IMAGENES / relativo)
        cambios[f"diagramas/{codigo}.png"] = f"imagenes/{relativo}"

    # También se ordenan los diagramas que no se publican hoy en el cuerpo de la
    # tesis: se conservan como respaldo técnico, sin dejarlos mezclados con .puml.
    for origen in sorted((SRC / "diagramas").glob("*.png")):
        fuente = (SRC / "diagramas" / f"{origen.stem}.puml")
        titulo = origen.stem
        if fuente.exists():
            coincidencia = re.search(r"^title\\s+(.+)$", fuente.read_text(encoding="utf-8"), re.MULTILINE)
            if coincidencia:
                titulo = coincidencia.group(1)
        relativo = f"capitulo_04_diseno/diagramas/{origen.stem}_{slug(titulo)}.png"
        mover(origen, IMAGENES / relativo)

    # Capturas de la demostración: pertenecen al capítulo de validación.
    for origen in sorted((SRC / "capturas_r77").glob("*.png")):
        base = origen.stem
        numero = base.split("_", 1)[0]
        asunto = base.split("_", 1)[1] if "_" in base else base
        relativo = f"capitulo_05_validacion/capturas/CAP-R77-{numero}_{asunto}.png"
        mover(origen, IMAGENES / relativo)
        cambios[f"capturas_r77/{origen.name}"] = f"imagenes/{relativo}"

    # Los índices explicativos viajan con sus grupos de imágenes.
    mover(SRC / "capturas_r77" / "INDICE_CAPTURAS.md",
          IMAGENES / "capitulo_05_validacion" / "capturas" / "LEEME.md")
    mover(SRC / "imagenes_graficos" / "LEEME.txt",
          IMAGENES / "capitulo_02_fundamentos" / "LEEME.md")

    # Las rutas se actualizan tanto en el documento como en el archivo incluido.
    for antes, despues in cambios.items():
        contenido = contenido.replace(antes, despues)
        capturas = capturas.replace(antes, despues)
    TEX.write_text(contenido, encoding="utf-8", newline="\n")
    CAPTURAS_TEX.write_text(capturas, encoding="utf-8", newline="\n")

    # El árbol antiguo queda vacío tras una ejecución correcta y se retira.
    # desktop.ini es metadato de Windows, no contenido de la tesis ni de Overleaf.
    metadatos = CONTEXTO / "archivo" / "metadatos_reubicacion_2026-10-19"
    for carpeta in (SRC / "capturas_r77", SRC / "imagenes_graficos"):
        escritorio = carpeta / "desktop.ini"
        if escritorio.exists():
            mover(escritorio, metadatos / f"{carpeta.name}_desktop.ini")
        carpeta.rmdir()
    print(f"Imágenes organizadas: {len(cambios)} referencias actualizadas.")


if __name__ == "__main__":
    main()
