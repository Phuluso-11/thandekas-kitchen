# =============================================================================
# resize-images.ps1
# Creates an 800px-wide copy of every JPG in images\ (and its subfolders).
# The copies are named <original>-800.jpg and are used by the srcset and
# <picture> elements so that phones download smaller files.
#
# How to run (from the project root, in the VS Code terminal):
#   powershell -ExecutionPolicy Bypass -File tools\resize-images.ps1
# =============================================================================

Add-Type -AssemblyName System.Drawing

$root       = Join-Path $PSScriptRoot "..\images"
$targetWide = 800
$files      = Get-ChildItem -Path $root -Recurse -Include *.jpg, *.jpeg |
              Where-Object { $_.BaseName -notlike "*-800" }

foreach ($file in $files) {
    $outPath = Join-Path $file.DirectoryName ($file.BaseName + "-800.jpg")

    $source  = [System.Drawing.Image]::FromFile($file.FullName)
    $ratio   = $targetWide / $source.Width
    $newW    = $targetWide
    $newH    = [int]($source.Height * $ratio)

    if ($source.Width -le $targetWide) {
        # Already small enough: copy it as-is so the srcset file still exists.
        $source.Dispose()
        Copy-Item $file.FullName $outPath -Force
        Write-Host "Copied  $($file.Name) -> $(Split-Path $outPath -Leaf)"
        continue
    }

    $bitmap   = New-Object System.Drawing.Bitmap $newW, $newH
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($source, 0, 0, $newW, $newH)

    $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

    $graphics.Dispose()
    $bitmap.Dispose()
    $source.Dispose()

    Write-Host "Resized $($file.Name) -> $(Split-Path $outPath -Leaf) ($newW x $newH)"
}

Write-Host "`nDone. All -800 image copies are in place."
