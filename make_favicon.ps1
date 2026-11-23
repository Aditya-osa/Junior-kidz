Add-Type -AssemblyName System.Drawing
$srcPath = (Resolve-Path "assets/img/logo/black-logo.jpg").Path
$src = New-Object System.Drawing.Bitmap($srcPath)

# Bounding box of the mark
$cropX = 170
$cropY = 35
$cropW = 765 - 170
$cropH = 895 - 35

# Target square size (512x512)
$size = 512
$target = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($target)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Fit into square maintaining aspect ratio with small padding
$scale = ($size - 32) / [Math]::Max($cropW, $cropH)
$drawW = [int]($cropW * $scale)
$drawH = [int]($cropH * $scale)
$destX = [int](($size - $drawW) / 2)
$destY = [int](($size - $drawH) / 2)

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle($destX, $destY, $drawW, $drawH)

$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$outPath = (Join-Path (Get-Location) "assets/img/favicon.png")
$target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$target.Dispose()
$src.Dispose()
Write-Host "Created $outPath"
