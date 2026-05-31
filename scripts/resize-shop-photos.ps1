# Resizes/optimizes shop photos from the source drive into images/shop/ for the web.
# - Honors EXIF orientation (phone photos), downscales to a max long edge, re-encodes JPEG.
# - Names files <category-slug>-NN.jpg and prints a manifest of what was written per category.
#
# Usage:  pwsh scripts/resize-shop-photos.ps1

Add-Type -AssemblyName System.Drawing

$src     = 'H:\.shortcut-targets-by-id\1HocvlMLf5aQ41VeYFipF3y3LuqUShpBK\website'
$dest    = Join-Path $PSScriptRoot '..\images\shop'
$maxEdge = 1400
$quality = 82

# Map source folder -> output filename slug (controls section order in the manifest too).
$map = [ordered]@{
  'SHOP & TOOLING'           = 'shop'
  'CNC MACHINES'             = 'cnc'
  'MILLING MACHINES'         = 'mill'
  'LATHES'                   = 'lathe'
  'GRINDERS'                 = 'grinder'
  'SAWS'                     = 'saw'
  'SANDERS'                  = 'sander'
  'WELDING AND FABRICATION'  = 'welding'
  'INSPECTION'               = 'inspection'
  'ELECTRICAL'               = 'electrical'
  'ROBOTICS'                 = 'robotics'
  'MACHINERY BUILT'          = 'built'
  'WOOD WORKING'             = 'wood'
  'PARTS AND FIXTURES'       = 'parts'
  'CNC PARTS'                = 'cncparts'
  'MISC'                     = 'misc'
}

$dest = [System.IO.Path]::GetFullPath($dest)
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

# Clear only the images this script produces (slug-NN.jpg) so removed photos
# don't linger. Leaves any other images in the folder (e.g. those used by the
# homepage) untouched.
$slugPattern = '^(' + (($map.Values | ForEach-Object { [regex]::Escape($_) }) -join '|') + ')-\d+\.jpg$'
Get-ChildItem $dest -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match $slugPattern } |
  Remove-Item -Force

$jpegCodec  = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams  = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

function Get-Orientation($img) {
  try {
    $p = $img.GetPropertyItem(274)   # 0x0112 EXIF Orientation
    return [int]$p.Value[0]
  } catch { return 1 }
}

foreach ($folder in $map.Keys) {
  $slug    = $map[$folder]
  $srcDir  = Join-Path $src $folder
  if (-not (Test-Path $srcDir)) { Write-Warning "missing: $folder"; continue }

  $files = Get-ChildItem $srcDir -File | Where-Object { $_.Extension -match '(?i)\.jpe?g$' } | Sort-Object Name
  $i = 0
  foreach ($f in $files) {
    $i++
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    try {
      switch (Get-Orientation $img) {
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
      $w = $img.Width; $h = $img.Height
      $scale = [Math]::Min(1.0, $maxEdge / [Math]::Max($w, $h))
      $nw = [int][Math]::Round($w * $scale)
      $nh = [int][Math]::Round($h * $scale)

      $bmp = New-Object System.Drawing.Bitmap $nw, $nh
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.DrawImage($img, 0, 0, $nw, $nh)

      $out = Join-Path $dest ("{0}-{1:D2}.jpg" -f $slug, $i)
      $bmp.Save($out, $jpegCodec, $encParams)
      $g.Dispose(); $bmp.Dispose()
    } finally { $img.Dispose() }
  }
  Write-Output ("{0,-22} -> {1,2} images  ({2})" -f $folder, $i, $slug)
}

Write-Output "---"
$sum = Get-ChildItem $dest -File | Measure-Object Length -Sum
Write-Output ("Total: {0} files, {1} MB" -f $sum.Count, [Math]::Round($sum.Sum/1MB,1))
