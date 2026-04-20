#!/usr/bin/env python3
"""
generate_icon.py - Stock Scanner 用アイコン生成スクリプト

512x512 px のおしゃれなアイコンを生成します。
株価チャートのデザインを基調としています。
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

def generate_stock_icon(output_path="stock-scanner-frontend/public/icon.png", size=512):
    """
    Stock Scanner 用アイコンを生成
    
    Args:
        output_path: 出力ファイルパス
        size: アイコンサイズ（デフォルト 512×512）
    """
    
    # 新規画像を作成（RGBA）
    image = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)
    
    # 背景: グラデーション（紺から紫）
    for y in range(size):
        # グラデーション計算
        ratio = y / size
        r = int(0 + (102 - 0) * ratio)      # 0 → 102
        g = int(126 + (75 - 126) * ratio)   # 126 → 75
        b = int(234 + (162 - 234) * ratio)  # 234 → 162
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # パディング
    padding = int(size * 0.1)
    chart_area = (padding, padding, size - padding, size - padding)
    
    # 白い角丸矩形（グラフエリア背景）
    corner_radius = int(size * 0.08)
    draw_rounded_rectangle(draw, chart_area, radius=corner_radius, fill=(255, 255, 255, 250))
    
    # グラフ領域の座標
    chart_left = chart_area[0] + int(size * 0.08)
    chart_right = chart_area[2] - int(size * 0.08)
    chart_top = chart_area[1] + int(size * 0.08)
    chart_bottom = chart_area[3] - int(size * 0.08)
    
    chart_width = chart_right - chart_left
    chart_height = chart_bottom - chart_top
    
    # グリッドライン（薄い灰色）
    grid_color = (220, 220, 220, 150)
    num_gridlines = 4
    
    # 水平グリッドライン
    for i in range(num_gridlines + 1):
        y = chart_top + (chart_height * i // num_gridlines)
        draw.line([(chart_left, y), (chart_right, y)], fill=grid_color, width=1)
    
    # 縦グリッドライン
    for i in range(num_gridlines + 1):
        x = chart_left + (chart_width * i // num_gridlines)
        draw.line([(x, chart_top), (x, chart_bottom)], fill=grid_color, width=1)
    
    # 上昇チャート（緑の折れ線グラフ）
    num_points = 8
    points = []
    
    for i in range(num_points):
        x = chart_left + (chart_width * i // (num_points - 1))
        
        # sin 波で上昇トレンド
        base_ratio = i / (num_points - 1)
        wave = math.sin(base_ratio * math.pi) * 0.2
        y_ratio = 0.7 - (base_ratio * 0.5) + wave
        
        y = chart_top + (chart_height * (1 - y_ratio))
        points.append((x, y))
    
    # グラデーション線を描画（上昇チャート）
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        
        # グリーン系のグラデーション
        ratio = (i + 1) / len(points)
        r = int(76 - (76 - 34) * ratio)      # 76 → 34
        g = int(175 + (139 - 175) * ratio)   # 175 → 139
        b = int(80 + (80 - 80) * ratio)      # 80 → 80
        
        draw.line([(x1, y1), (x2, y2)], fill=(r, g, b, 255), width=4)
    
    # チャートのエリア塗りつぶし（グラデーション）
    points_for_polygon = points + [
        (chart_right, chart_bottom),
        (chart_left, chart_bottom)
    ]
    draw.polygon(points_for_polygon, fill=(76, 175, 80, 80))
    
    # ポイント（円）を描画
    point_radius = int(size * 0.02)
    for x, y in points:
        draw.ellipse(
            [(x - point_radius, y - point_radius), (x + point_radius, y + point_radius)],
            fill=(34, 139, 34, 255)
        )
    
    # 上昇矢印（右上）
    arrow_size = int(size * 0.06)
    arrow_x = chart_right - arrow_size * 1.5
    arrow_y = chart_top - arrow_size * 1.5
    
    # 矢印の三角形
    arrow_points = [
        (arrow_x, arrow_y + arrow_size),           # 左下
        (arrow_x + arrow_size, arrow_y + arrow_size),  # 右下
        (arrow_x + arrow_size / 2, arrow_y)        # 上
    ]
    draw.polygon(arrow_points, fill=(76, 175, 80, 255))
    
    # 画像を保存
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path, 'PNG')
    print(f"✅ アイコンを生成しました: {output_path}")
    
    return output_path


def draw_rounded_rectangle(draw, xy, radius=20, fill=None, outline=None, width=1):
    """角丸矩形を描画する"""
    x1, y1, x2, y2 = xy
    
    # 角の弧を描画
    draw.arc((x1, y1, x1 + 2 * radius, y1 + 2 * radius), 180, 270, fill=outline or fill, width=width)
    draw.arc((x2 - 2 * radius, y1, x2, y1 + 2 * radius), 270, 360, fill=outline or fill, width=width)
    draw.arc((x2 - 2 * radius, y2 - 2 * radius, x2, y2), 0, 90, fill=outline or fill, width=width)
    draw.arc((x1, y2 - 2 * radius, x1 + 2 * radius, y2), 90, 180, fill=outline or fill, width=width)
    
    # 辺を描画
    if fill:
        # 塗りつぶし
        draw.rectangle((x1 + radius, y1, x2 - radius, y2), fill=fill)
        draw.rectangle((x1, y1 + radius, x2, y2 - radius), fill=fill)
    
    # アウトライン
    if outline:
        draw.line((x1 + radius, y1, x2 - radius, y1), fill=outline, width=width)
        draw.line((x2, y1 + radius, x2, y2 - radius), fill=outline, width=width)
        draw.line((x1 + radius, y2, x2 - radius, y2), fill=outline, width=width)
        draw.line((x1, y1 + radius, x1, y2 - radius), fill=outline, width=width)


if __name__ == "__main__":
    try:
        # アイコンを生成
        output = generate_stock_icon()
        print(f"📱 Stock Scanner iPhone アイコン生成完了！")
        print(f"📂 出力先: {output}")
        print(f"✨ サイズ: 512×512 px")
    except ImportError:
        print("❌ エラー: Pillow がインストールされていません")
        print("以下のコマンドでインストールしてください:")
        print("pip install Pillow")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
