# Implementation Plan: Unit Tests for No Sleep GNOME Shell Extension

## Overview

Add comprehensive unit tests to the No Sleep GNOME Shell extension using Vitest. The extension currently has zero test infrastructure. All modules depend on GNOME Shell-specific APIs (`Gio`, `GLib`, `GObject`, `QuickSettings`, `Main`) which must be mocked.

## 1. Install Dependencies & Configure Scripts

### Edit `package.json`

- Add `"vitest"` to `devDependencies`
- Add scripts:
  - `"test": "vitest run"` — single run
  - `"test:watch": "vitest"` — watch mode
  - `"test:coverage": "vitest run --coverage"` — coverage report

### Create `vitest.config.js`

- `resolve.alias` maps GNOME imports to mock modules:
  - `gi://Gio` -> `./tests/mocks/gio.js`
  - `gi://GLib` -> `./tests/mocks/glib.js`
  - `gi://GObject` -> `./tests/mocks/gobject.js`
  - `resource:///org/gnome/shell/ui/main.js` -> `./tests/mocks/shell-main.js`
  - `resource:///org/gnome/shell/ui/quickSettings.js` -> `./tests/mocks/shell-quicksettings.js`
  - `resource:///org/gnome/shell/extensions/extension.js` -> `./tests/mocks/extension.js`
- `test.include: ["tests/**/*.test.js"]`
- Coverage provider: `v8`

## 2. Create Mock Modules (`tests/mocks/`)

### `tests/mocks/gio.js` — `gi://Gio`

- `Settings` class: `bind()`, `get_boolean()`, `set_boolean()` tracked via `vi.fn()`
- `SettingsBindFlags.DEFAULT`
- `DBus.system.call_with_unix_fd_list_sync` — returns `[result, fdList]`
- `UnixInputStream` class: `close()` tracked
- `Icon.new_for_string` tracked
- `DBusCallFlags.NONE`

### `tests/mocks/glib.js` — `gi://GLib`

- `Variant.new()` tracked, returns a mock variant
- `VariantType` constructor tracked

### `tests/mocks/gobject.js` — `gi://GObject`

- `registerClass` is a pass-through (returns the class unchanged)
- Base `Object` class

### `tests/mocks/shell-main.js` — `resource:///org/gnome/shell/ui/main.js`

- `panel.statusArea.quickSettings.addExternalIndicator` tracked
- `osdWindowManager.show` tracked

### `tests/mocks/shell-quicksettings.js` — `resource:///org/gnome/shell/ui/quickSettings.js`

- `QuickToggle` base class: `_init()` sets props, `connect()` tracked, `destroy()` tracked
- `SystemIndicator` base class: `_addIndicator()` returns mock indicator, `destroy()` tracked

### `tests/mocks/extension.js` — `resource:///org/gnome/shell/extensions/extension.js`

- `Extension` base class with `getSettings()` tracked

## 3. Test Files

### `tests/config.test.js` — Pure constants, no mocks

- `ICONS.on.name === "face-raspberry-symbolic"`
- `ICONS.off.name === "face-yawn-symbolic"`
- `EXTENSION_NAME === "No Sleep"`
- `STATE_KEY_NAME === "no-sleep-enabled"`

### `tests/inhibitor-manager.test.js`

**Happy paths:**
- `inhibit()` calls DBus with correct `(ssss)` variant args: `["handle-lid-switch", "No Sleep Extension", "Prevent sleep when lid closed", "block"]`
- `inhibit()` stores fd as `Gio.UnixInputStream`
- `uninhibit()` closes fd and nulls internal state
- `destroy()` calls `uninhibit()`

**Edge cases:**
- `inhibit()` is idempotent — calling twice doesn't re-call DBus
- `uninhibit()` when not inhibited is a no-op (no error thrown)
- `destroy()` when not inhibited is a no-op
- DBus failure in `inhibit()` is caught and logged (does not throw)
- DBus failure in `uninhibit()` (`fd.close()` throws) is caught and logged

### `tests/no-sleep-toggle.test.js`

**Happy paths:**
- `_init` sets title to `"No Sleep"`, icon to `ICONS.off.name`, toggleMode to `true`
- `setup()` binds `no-sleep-enabled` setting key to `checked` property
- When `checked` becomes `true`: calls `inhibitorManager.inhibit()`, shows OSD with `"No Sleep enabled"` and `ICONS.on.name`
- When `checked` becomes `false`: calls `inhibitorManager.uninhibit()`, shows OSD with `"No Sleep disabled"` and `ICONS.off.name`
- `destroy()` calls `inhibitorManager.uninhibit()` and `super.destroy()`

**Edge cases:**
- `setup()` called with null inhibitorManager — no throw when toggled
- Toggle checked state doesn't change — sync not re-triggered

### `tests/no-sleep-indicator.test.js`

**Happy paths:**
- `setup()` calls `_addIndicator()`, sets icon to `ICONS.on.name`, sets `visible = false`
- `setup()` binds `no-sleep-enabled` to indicator's `visible` property
- `destroy()` calls `super.destroy()`

### `tests/extension.test.js`

**Happy paths:**
- `enable()` creates settings, sets `STATE_KEY_NAME` to `false`
- `enable()` creates `InhibitorManager`, `NoSleepIndicator`, `NoSleepToggle`
- `enable()` calls `indicator.setup(settings)` and `toggle.setup(settings, inhibitorManager)`
- `enable()` pushes toggle into `indicator.quickSettingsItems`
- `enable()` adds indicator to `Main.panel.statusArea.quickSettings`
- `disable()` destroys toggle, indicator, inhibitorManager in order
- `disable()` nulls all private references

**Edge cases:**
- `disable()` called without prior `enable()` — no throws (null guard checks)
- `enable()` -> `disable()` -> `enable()` again — works cleanly (re-creates everything)

## 4. Code Style Compliance

- All new files use **tabs** for indentation (`.editorconfig`, `biome.json`)
- **Double quotes** for strings (`biome.json` JS config)
- No comments added
- Run `pnpm check` (Biome) after writing to ensure formatting/lint passes
- Run `pnpm test` to verify all tests pass

## 5. File Summary

| File | Action |
|---|---|
| `package.json` | Edit: add vitest devDep + test scripts |
| `vitest.config.js` | Create |
| `tests/mocks/gio.js` | Create |
| `tests/mocks/glib.js` | Create |
| `tests/mocks/gobject.js` | Create |
| `tests/mocks/shell-main.js` | Create |
| `tests/mocks/shell-quicksettings.js` | Create |
| `tests/mocks/extension.js` | Create |
| `tests/config.test.js` | Create |
| `tests/inhibitor-manager.test.js` | Create |
| `tests/no-sleep-toggle.test.js` | Create |
| `tests/no-sleep-indicator.test.js` | Create |
| `tests/extension.test.js` | Create |

## 6. Execution Order

1. Edit `package.json` (add vitest + scripts)
2. Create `vitest.config.js`
3. Create all 6 mock files
4. Create all 5 test files
5. Run `pnpm install`
6. Run `pnpm test` — fix any failures
7. Run `pnpm check` — fix any Biome issues
8. Confirm all green
