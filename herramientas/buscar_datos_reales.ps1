<#
  buscar_datos_reales.ps1 — Busca posibles datos reales o secretos en la carpeta antes de entregarla o sincronizarla.
  Solo LEE. Los hallazgos se muestran ENMASCARADOS (no repite el dato en pantalla).

  Uso:
    powershell -ExecutionPolicy Bypass -File herramientas\buscar_datos_reales.ps1                    # revisa todo salvo RMotriz_tesis_contexto
    powershell -ExecutionPolicy Bypass -File herramientas\buscar_datos_reales.ps1 -Ruta docs\contexto
    powershell -ExecutionPolicy Bypass -File herramientas\buscar_datos_reales.ps1 -IncluirContextoOriginal

  Es una ayuda, NO una garantía: hay falsos positivos (números que parecen un RUC) y puede haber falsos negativos
  (nombres propios, direcciones, datos en imágenes o PDF). Un hallazgo no prueba que el dato sea real; ninguna
  ausencia prueba que no haya datos reales. La revisión final es humana.
  Salida: código 0 sin hallazgos, 1 con hallazgos.
#>
param([string]$Ruta = '.', [switch]$IncluirContextoOriginal)

$proyecto = Split-Path -Parent $PSScriptRoot
$raiz = if ((Split-Path -Leaf $proyecto) -eq 'fuentes-proyecto') {
  Split-Path -Parent (Split-Path -Parent $proyecto)
} else { $proyecto }
$base = if ([IO.Path]::IsPathRooted($Ruta)) { $Ruta } else { Join-Path $raiz $Ruta }
$ext = '.md','.txt','.csv','.json','.html','.js','.mjs','.cjs','.py','.ps1','.tex','.sql','.puml','.toml','.yaml','.yml','.sh'
$excluir = @('\.estado\', '\herramientas\bin\', '\node_modules\', '\__pycache__\', '\.git\', '\archivo\_pendiente_de_borrar\', '\pdf_review_deps\', '\validation-deps\', '\04-api\')
if (-not $IncluirContextoOriginal) { $excluir += '\RMotriz_tesis_contexto\' }

# Patrones. 'Permitir' son prefijos sintéticos que no se reportan.
$patrones = @(
  @{ Nombre='Placa';          Regex='\b[A-Z0-9]{3}-\d{3}\b'; Permitir='^(DEM|SIN|ODS|COT|CIT|EDU|ILA|ESP|DCL|DES|DSE|DAC|DCU|DMD|DAS|DAF|DCM|DAM|REQ|OPE|DEC|SHA|DIF|ADR|INC|ZZZ)-' }
  @{ Nombre='RUC';            Regex='\b(10|15|17|20)\d{9}\b'; Permitir='' }
  @{ Nombre='DNI (con rotulo)'; Regex='(?i)\bDNI\b\W{0,6}\d{8}\b'; Permitir='' }
  @{ Nombre='Celular PE';     Regex='\b9\d{2}[ -]?\d{3}[ -]?\d{3}\b'; Permitir='' }
  @{ Nombre='VIN (17)';       Regex='\b(?![0-9A-F]{17}\b)[A-HJ-NPR-Z0-9]{17}\b(?<=[A-Z].*\d.*|\d.*[A-Z].*)'; Permitir='' }
  @{ Nombre='Correo';         Regex='[\w.+-]+@[\w-]+\.[\w.-]+'; Permitir='(?i)@(example\.|test\.|ejemplo\.|demo\.|noreply\.)' }
  @{ Nombre='Token/clave';    Regex='\b(pk_\d+_[A-Z0-9]{16,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,})\b'; Permitir='' }
)

function Enmascarar($t) { if ($t.Length -le 4) { return '****' } return $t.Substring(0,2) + ('*' * [Math]::Min(8, $t.Length - 4)) + $t.Substring($t.Length-2) }

Write-Host "Buscando en: $base"
$archivos = @(Get-ChildItem -LiteralPath $base -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
  $e = $_.Extension.ToLower()
  if ($ext -notcontains $e) { return $false }
  if ($_.Length -ge 5MB) { return $false }
  foreach ($x in $excluir) { if ($_.FullName -like "*$x*") { return $false } }
  return $true
})
Write-Host ("Archivos de texto revisados: {0}" -f $archivos.Count)

$hallazgos = @{}
foreach ($a in $archivos) {
  try { $texto = [IO.File]::ReadAllText($a.FullName, [Text.Encoding]::UTF8) } catch { continue }
  foreach ($p in $patrones) {
    $m = [regex]::Matches($texto, $p.Regex)
    foreach ($x in $m) {
      if ($p.Permitir -and ($x.Value -match $p.Permitir)) { continue }
      $rel = $a.FullName.Substring($raiz.Length + 1)
      $k = "$($p.Nombre)|$rel"
      if (-not $hallazgos.ContainsKey($k)) { $hallazgos[$k] = [pscustomobject]@{ Tipo=$p.Nombre; Archivo=$rel; N=0; Ejemplo=(Enmascarar $x.Value) } }
      $hallazgos[$k].N++
    }
  }
}

if ($hallazgos.Count -eq 0) { Write-Host 'Sin hallazgos con estos patrones. Recuerda: no prueba que no haya datos reales.' -ForegroundColor Green; exit 0 }
Write-Host ("`nHALLAZGOS: {0} combinaciones tipo/archivo" -f $hallazgos.Count) -ForegroundColor Yellow
$hallazgos.Values | Sort-Object Tipo, Archivo | Format-Table Tipo, N, Ejemplo, Archivo -AutoSize | Out-String -Width 220
Write-Host 'Revisar cada uno a mano. Los ejemplos están enmascarados a propósito.'
exit 1
