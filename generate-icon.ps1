Add-Type -AssemblyName System.Drawing

# キャンバスサイズ
$size = 512
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# 背景グラデーション（紺から紫）
$brush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(65, 105, 160))  # 紺
$brush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(122, 75, 162))  # 紫

$graphics.Clear([System.Drawing.Color]::White)

# グラデーション背景
for ($y = 0; $y -lt $size; $y++) {
    $ratio = $y / $size
    $r = [int](65 + (122 - 65) * $ratio)
    $g = [int](105 + (75 - 105) * $ratio)
    $b = [int](160 + (162 - 160) * $ratio)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($r, $g, $b))
    $graphics.DrawLine(
        (New-Object System.Drawing.Pen($brush)),
        0, $y, $size, $y
    )
}

# 白い背景（グラフエリア）
$padding = $size * 0.1
$chartX = $padding
$chartY = $padding
$chartW = $size - $padding * 2
$chartH = $size - $padding * 2

$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
$graphics.FillRectangle($whiteBrush, $chartX, $chartY, $chartW, $chartH)

# グリッドライン
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 220, 220), 1)
$graphPadding = $size * 0.08
$graphX = $chartX + $graphPadding
$graphY = $chartY + $graphPadding
$graphW = $chartW - $graphPadding * 2
$graphH = $chartH - $graphPadding * 2

for ($i = 0; $i -le 4; $i++) {
    $y = $graphY + $graphH * $i / 4
    $graphics.DrawLine($gridPen, $graphX, $y, $graphX + $graphW, $y)
    
    $x = $graphX + $graphW * $i / 4
    $graphics.DrawLine($gridPen, $x, $graphY, $x, $graphY + $graphH)
}

# チャートラインを描画（緑の上昇トレンド）
$greenPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(46, 139, 87), 4)
$greenPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

$numPoints = 8
$points = @()

for ($i = 0; $i -lt $numPoints; $i++) {
    $x = $graphX + $graphW * $i / ($numPoints - 1)
    $baseRatio = $i / ($numPoints - 1)
    $wave = [Math]::Sin($baseRatio * [Math]::PI) * 0.2
    $yRatio = 0.7 - ($baseRatio * 0.5) + $wave
    $y = $graphY + $graphH * (1 - $yRatio)
    $points += @([System.Drawing.PointF]::new($x, $y))
}

# ラインを描画
if ($points.Count -gt 1) {
    $graphics.DrawLines($greenPen, $points)
}

# ポイント（円）
$pointRadius = $size * 0.02
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 139, 34))

foreach ($point in $points) {
    $graphics.FillEllipse($dotBrush, 
        $point.X - $pointRadius, 
        $point.Y - $pointRadius, 
        $pointRadius * 2, 
        $pointRadius * 2)
}

# クリーンアップと保存
$graphics.Dispose()
$bitmap.Save("icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()

Write-Host "✅ icon.png を生成しました！"
