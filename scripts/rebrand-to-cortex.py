from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
tracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z"], text=False).decode().split("\0")
skip_prefixes = ("docs/archive/", ".git/", "node_modules/")
replacements = (
    ("SYNARA", "CORTEX"),
    ("Synara", "Cortex"),
    ("synara", "cortex"),
)
changed = []
for relative in tracked:
    if not relative or relative.startswith(skip_prefixes):
        continue
    path = root / relative
    if not path.is_file():
        continue
    data = path.read_bytes()
    if b"\x00" in data:
        continue
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        continue
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed.append(relative)
print(f"Rebranded {len(changed)} tracked text files")
for item in changed:
    print(item)
