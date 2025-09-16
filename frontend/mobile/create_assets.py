#!/usr/bin/env python3
"""
Create simple PNG assets for the mobile app
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename, text="C"):
    """Create a simple icon with the given size"""
    # Create image with dark background
    img = Image.new('RGBA', (size, size), (26, 26, 26, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a circle with gradient effect
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=(0, 212, 170, 255), outline=(0, 184, 148, 255), width=4)
    
    # Try to use a font, fallback to default if not available
    try:
        font_size = size // 3
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 5
    
    draw.text((x, y), text, fill=(26, 26, 26, 255), font=font)
    
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

def create_splash(width, height, filename):
    """Create a splash screen"""
    img = Image.new('RGBA', (width, height), (26, 26, 26, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background
    for y in range(height):
        ratio = y / height
        r = int(26 + (45 - 26) * ratio)
        g = int(26 + (45 - 26) * ratio)
        b = int(26 + (45 - 26) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
    
    # Draw logo circle
    logo_size = min(width, height) // 4
    logo_x = (width - logo_size) // 2
    logo_y = (height - logo_size) // 2 - height // 8
    
    draw.ellipse([logo_x, logo_y, logo_x + logo_size, logo_y + logo_size], 
                 fill=(0, 212, 170, 255), outline=(0, 184, 148, 255), width=8)
    
    # Draw app name
    try:
        font_size = width // 20
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    app_name = "CeesarTrader"
    bbox = draw.textbbox((0, 0), app_name, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = logo_y + logo_size + height // 20
    
    draw.text((text_x, text_y), app_name, fill=(0, 212, 170, 255), font=font)
    
    # Draw subtitle
    subtitle = "Automated Trading Platform"
    try:
        subtitle_font_size = width // 30
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", subtitle_font_size)
    except:
        subtitle_font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    subtitle_y = text_y + height // 15
    
    draw.text((subtitle_x, subtitle_y), subtitle, fill=(255, 255, 255, 200), font=subtitle_font)
    
    img.save(filename)
    print(f"Created {filename} ({width}x{height})")

if __name__ == "__main__":
    # Create assets directory if it doesn't exist
    os.makedirs("assets", exist_ok=True)
    
    # Create icons
    create_icon(1024, "assets/icon.png", "C")
    create_icon(1024, "assets/adaptive-icon.png", "C")
    create_icon(32, "assets/favicon.png", "C")
    
    # Create splash screen
    create_splash(1284, 2778, "assets/splash.png")
    
    print("All assets created successfully!")
