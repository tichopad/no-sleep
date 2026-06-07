# No Sleep Extension

GNOME Shell extension. Prevent system sleep when laptop lid closed. Toggle via system menu.

## Install

Clone repo local. Compile schema. Copy to extensions folder.

```bash
# Compile schema
glib-compile-schemas schemas/

# Link to extensions dir
EXT_DIR=~/.local/share/gnome-shell/extensions/i-cant-get-no-sleep@tichopad
mkdir -p "$EXT_DIR"
ln -s "$PWD/src/extension.js" "$EXT_DIR/"
ln -s "$PWD/metadata.json" "$EXT_DIR/"
ln -s "$PWD/schemas" "$EXT_DIR/"
```

Restart GNOME Shell (X11: Alt+F2, r, Enter. Wayland: log out/in).

Enable:

```bash
gnome-extensions enable i-cant-get-no-sleep@tichopad
```
