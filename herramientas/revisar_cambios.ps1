<#
  revisar_cambios.ps1 — Detecta qué cambió en la carpeta de la tesis desde la última revisión.
  Solo LEE la carpeta (no modifica ningún archivo del proyecto). Usa un manifiesto en .estado/.

  Uso:
    powershell -ExecutionPolicy Bypass -File herramientas\revisar_cambios.ps1            # muestra cambios
    powershell -ExecutionPolicy Bypass -File herramientas\revisar_cambios.ps1 -Guardar   # muestra y fija esta foto como nueva base

  Regla de trabajo: ejecutarlo ANTES de empezar a trabajar (cualquier herramienta o chat).
  Al terminar, ejecutarlo con -Guardar y anotar el resumen en REGISTRO_CAMBIOS.md.
#>
param([switch]$Guardar)

$proyecto = Split-Path -Parent $PSScriptRoot
if ((Split-Path -Leaf $proyecto) -eq 'fuentes-proyecto') {
    $contexto = Split-Path -Parent $proyecto
    $raiz = Split-Path -Parent $contexto
    $estado = Join-Path $contexto '.estado'
} else {
    $raiz = $proyecto
    $estado = Join-Path $raiz '.estado'
}
$archivoBase = Join-Path $estado 'manifiesto.json'
$excluir = @('\.estado\', '\node_modules\', '\__pycache__\', '\.git\', '\desktop.ini')

function Obtener-Foto {
    $foto = @{}
    Get-ChildItem -LiteralPath $raiz -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $ruta = $_.FullName
        foreach ($x in $excluir) { if ($ruta -like "*$x*") { return } }
        $rel = $ruta.Substring($raiz.Length + 1)
        $foto[$rel] = "{0}|{1}" -f $_.Length, $_.LastWriteTimeUtc.ToString('o')
    }
    return $foto
}

Write-Host "Revisando: $raiz"
$actual = Obtener-Foto
Write-Host ("Archivos encontrados: {0}" -f $actual.Count)

if (-not (Test-Path $archivoBase)) {
    Write-Host "No hay revisión anterior: esta es la primera. Ejecuta con -Guardar para fijar la base." -ForegroundColor Yellow
    if ($Guardar) {
        New-Item -ItemType Directory -Force $estado | Out-Null
        $actual | ConvertTo-Json -Depth 3 | Set-Content -Path $archivoBase -Encoding UTF8
        (Get-Date).ToString('o') | Set-Content -Path (Join-Path $estado 'ultima_revision.txt') -Encoding UTF8
        Write-Host "Base guardada." -ForegroundColor Green
    }
    return
}

$basePsObj = Get-Content $archivoBase -Raw -Encoding UTF8 | ConvertFrom-Json
$base = @{}
$basePsObj.PSObject.Properties | ForEach-Object { $base[$_.Name] = $_.Value }

$nuevos = @(); $modificados = @(); $eliminados = @()
foreach ($k in $actual.Keys) {
    if (-not $base.ContainsKey($k)) { $nuevos += $k }
    elseif ($base[$k] -ne $actual[$k]) { $modificados += $k }
}
foreach ($k in $base.Keys) { if (-not $actual.ContainsKey($k)) { $eliminados += $k } }

$ultima = ''
$fu = Join-Path $estado 'ultima_revision.txt'
if (Test-Path $fu) { $ultima = (Get-Content $fu -Raw).Trim() }
Write-Host ("Última revisión guardada: {0}" -f $ultima)

if (($nuevos.Count + $modificados.Count + $eliminados.Count) -eq 0) {
    Write-Host "Sin cambios desde la última revisión." -ForegroundColor Green
} else {
    Write-Host ("CAMBIOS: {0} nuevos, {1} modificados, {2} eliminados" -f $nuevos.Count, $modificados.Count, $eliminados.Count) -ForegroundColor Yellow
    if ($nuevos.Count)      { "`nNUEVOS:";      $nuevos      | Sort-Object | Select-Object -First 80 | ForEach-Object { "  + $_" } }
    if ($modificados.Count) { "`nMODIFICADOS:"; $modificados | Sort-Object | Select-Object -First 80 | ForEach-Object { "  ~ $_" } }
    if ($eliminados.Count)  { "`nELIMINADOS:";  $eliminados  | Sort-Object | Select-Object -First 80 | ForEach-Object { "  - $_" } }
    if (($nuevos.Count + $modificados.Count + $eliminados.Count) -gt 240) { "`n(Lista recortada a 80 por categoría.)" }
}

if ($Guardar) {
    New-Item -ItemType Directory -Force $estado | Out-Null
    $actual | ConvertTo-Json -Depth 3 | Set-Content -Path $archivoBase -Encoding UTF8
    (Get-Date).ToString('o') | Set-Content -Path $fu -Encoding UTF8
    Write-Host "`nNueva base guardada." -ForegroundColor Green
}
