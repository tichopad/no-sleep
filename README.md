# No Sleep Extension

GNOME Shell extension. Prevent system sleep when laptop lid closed. Toggle via system menu.

## Install

Clone repo local. Compile schema. Link to extensions folder.

```bash
# Compile schema
glib-compile-schemas schemas/

# Link to extensions dir
ln -s $PWD ~/.local/share/gnome-shell/extensions/i-cant-get-no-sleep@tichopad
```

Restart GNOME Shell (X11: Alt+F2, r, Enter. Wayland: log out/in).

Enable:

```bash
gnome-extensions enable i-cant-get-no-sleep@tichopad
```
