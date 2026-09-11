from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "assets/branding/cortex-studio-logo.png"
image = Image.open(source).convert("RGBA")

# Keep the supplied black background and white mark intact while producing
# standard desktop icon sizes from the official source artwork.
web = root / "apps/web/public/cortex-studio-logo.png"
web.parent.mkdir(parents=True, exist_ok=True)
image.save(web, format="PNG", optimize=True)
image.resize((1024, 1024), Image.Resampling.LANCZOS).save(
    web.parent / "cortex.png", format="PNG", optimize=True
)
image.resize((180, 180), Image.Resampling.LANCZOS).save(
    web.parent / "apple-touch-icon.png", format="PNG", optimize=True
)
image.resize((32, 32), Image.Resampling.LANCZOS).save(
    web.parent / "favicon-32x32.png", format="PNG", optimize=True
)
image.resize((16, 16), Image.Resampling.LANCZOS).save(
    web.parent / "favicon-16x16.png", format="PNG", optimize=True
)
image.resize((256, 256), Image.Resampling.LANCZOS).save(
    web.parent / "favicon.ico",
    format="ICO",
    sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)],
)

resources = root / "apps/desktop/resources"
for name in ("cortex.png", "icon.png", "app-icon-linux.png", "app-icon-macos.png", "dock-icon.png", "dock-icon-dark.png"):
    image.resize((1024, 1024), Image.Resampling.LANCZOS).save(resources / name, format="PNG", optimize=True)

windows_icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
image.resize((256, 256), Image.Resampling.LANCZOS).save(resources / "icon.ico", format="ICO", sizes=windows_icon_sizes)
image.resize((256, 256), Image.Resampling.LANCZOS).save(resources / "app-icon-windows.ico", format="ICO", sizes=windows_icon_sizes)

print("Installed official logo PNG and ICO variants")
print(f"Source: {source}")
print(f"Web asset: {web}")
print(f"Desktop resources: {resources}")
