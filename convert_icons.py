import os
from PIL import Image

input_path = r"C:\Users\Vincenzo Durante\Desktop\FrigoRadar\pwa-app\public\icon-512x512.jpg"
out_512 = r"C:\Users\Vincenzo Durante\Desktop\FrigoRadar\pwa-app\public\pwa-512x512.png"
out_192 = r"C:\Users\Vincenzo Durante\Desktop\FrigoRadar\pwa-app\public\pwa-192x192.png"

try:
    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        
        # 512x512
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(out_512, "PNG")
        
        # 192x192
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(out_192, "PNG")
        
    print("Conversion successful.")
except Exception as e:
    print(f"Error: {e}")
