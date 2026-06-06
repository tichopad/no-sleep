# No Sleep Extension — Implementation Plan

## Overview
GNOME Shell extension providing a system menu toggle to prevent sleep when laptop lid is closed.

**UUID:** `i-cant-get-no-sleep@tichopad`  
**Compatibility:** GNOME 45+ (ESM modules)

---

## File Structure

```
no-sleep/
├── metadata.json              # Extension metadata
├── extension.js               # Main extension logic
├── schemas/
│   └── org.gnome.shell.extensions.no-sleep.gschema.xml  # GSettings schema
├── stylesheet.css             # Minimal styling (if needed)
└── README.md                  # Documentation
```

---

## Implementation Steps

### Step 1: metadata.json ✅
**Purpose:** Extension identification and compatibility declaration.

**Content:**
- `uuid`: `i-cant-get-no-sleep@tichopad`
- `name`: `No Sleep`
- `description`: Brief description of functionality
- `shell-version`: `["45", "46"]` (GNOME 45+)
- `url`: Optional GitHub repo URL
- `settings-schema`: `org.gnome.shell.extensions.no-sleep`
- `version`: `1`

**Key decisions:**
- Use array for shell-version to support multiple GNOME versions
- Include settings-schema to enable GSettings integration

---

### Step 2: GSettings Schema (schemas/org.gnome.shell.extensions.no-sleep.gschema.xml)
**Purpose:** Persist toggle state across sessions.

**Schema structure:**
```xml
<schemalist>
  <schema id="org.gnome.shell.extensions.no-sleep" 
          path="/org/gnome/shell/extensions/no-sleep/">
    <key name="no-sleep-enabled" type="b">
      <default>false</default>
      <summary>No Sleep enabled state</summary>
      <description>Whether No Sleep is currently active</description>
    </key>
  </schema>
</schemalist>
```

**Key decisions:**
- Single boolean key `no-sleep-enabled` for toggle state
- Default to `false` (off) on first install
- Schema path follows GNOME extension convention

**Post-creation step:**
- Compile schema: `glib-compile-schemas schemas/`
- This generates `gschemas.compiled` needed for GSettings to work

---

### Step 3: extension.js — Main Extension Logic
**Purpose:** Core extension implementation with toggle UI and inhibitor management.

**Structure:**
```javascript
// ESM imports (GNOME 45+)
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
```

**Components to implement:**

#### 3.1: NoSleepIndicator Class
**Purpose:** System menu button with toggle functionality.

**Responsibilities:**
- Create menu item in system menu (Quick Settings area)
- Display icon and "No Sleep" text
- Handle toggle state changes
- Update icon based on state (face-raspberry-symbolic vs face-yarn-symbolic)
- Add/remove top bar icon when toggled on/off

**Implementation details:**
- Extend `PanelMenu.Button` or create custom menu item
- Use `St.Icon` for icon display
- Use `St.Label` for text
- Bind to GSettings for state persistence
- Connect to `toggled` signal for state changes

**Icon logic:**
```javascript
// When enabled:
menuIcon: face-raspberry-symbolic
topBarIcon: face-raspberry-symbolic (visible)

// When disabled:
menuIcon: face-yarn-symbolic
topBarIcon: none (hidden)
```

#### 3.2: InhibitorManager
**Purpose:** Manage logind inhibitor lock via D-Bus.

**Responsibilities:**
- Take inhibitor lock when enabled
- Release inhibitor lock when disabled
- Handle D-Bus communication with systemd-logind

**Implementation details:**
- Use `Gio.DBus.system` for D-Bus communication
- Call `org.freedesktop.login1.Manager.Inhibit()` with:
  - `what`: `"handle-lid-switch"`
  - `who`: `"No Sleep Extension"`
  - `why`: `"Prevent sleep when lid is closed"`
  - `mode`: `"block"`
- Store returned file descriptor (FD)
- Close FD to release inhibitor

**D-Bus call structure:**
```javascript
const inhibitor = Gio.DBus.system.call_sync(
    'org.freedesktop.login1',           // bus name
    '/org/freedesktop/login1',          // object path
    'org.freedesktop.login1.Manager',   // interface
    'Inhibit',                          // method
    GLib.Variant.new('(ssss)', [
        'handle-lid-switch',            // what
        'No Sleep Extension',           // who
        'Prevent sleep when lid closed',// why
        'block'                         // mode
    ]),
    null,
    Gio.DBusCallFlags.NONE,
    -1,
    null
);
// Extract FD from response and store it
```

**Cleanup:**
- Close FD when disabling
- Handle extension disable/unload gracefully

#### 3.3: Extension Class
**Purpose:** Main extension lifecycle management.

**Responsibilities:**
- Initialize extension on enable()
- Clean up on disable()
- Manage indicator and inhibitor manager instances

**Implementation details:**
```javascript
export default class NoSleepExtension extends Extension {
    enable() {
        // Load GSettings
        // Create InhibitorManager
        // Create NoSleepIndicator
        // Restore state from GSettings
        // If enabled, take inhibitor lock
    }
    
    disable() {
        // Release inhibitor lock (if held)
        // Destroy indicator
        // Clean up resources
    }
}
```

**State restoration logic:**
- On enable(), read `no-sleep-enabled` from GSettings
- If `true`, immediately take inhibitor lock and update UI
- Connect to GSettings `changed` signal for external state changes

---

### Step 4: stylesheet.css (Optional)
**Purpose:** Minimal styling if needed for menu item appearance.

**Likely content:**
- Empty or minimal CSS
- GNOME Shell handles most styling automatically
- May need adjustments for icon spacing or alignment

**Decision:** Start with empty file, add styling only if visual issues arise.

---

### Step 5: README.md
**Purpose:** User documentation.

**Content:**
- Extension description
- Installation instructions
- Usage guide
- Compatibility information
- License (if applicable)

---

## Implementation Order

1. **metadata.json** — Foundation for extension identification
2. **GSettings schema** — Enable state persistence infrastructure
3. **extension.js** — Core logic in this order:
   - Extension class skeleton (enable/disable lifecycle)
   - InhibitorManager (D-Bus communication)
   - NoSleepIndicator (UI components)
   - Integration and state management
4. **stylesheet.css** — Add if needed after testing
5. **README.md** — Documentation

---

## Technical Considerations

### GNOME 45+ ESM Modules
- Use `import` syntax instead of `imports.*`
- All imports must be at top of file
- Use `resource://` URLs for GNOME Shell imports

### System Menu Integration
- GNOME 45+ uses Quick Settings panel
- Need to add item to system menu area (where Wi-Fi, Bluetooth, etc. reside)
- May need to use `Main.panel.statusArea.quickSettings` or similar API

### D-Bus Inhibitor Lock
- File descriptor must be kept open to maintain lock
- Closing FD releases the lock
- Must handle FD lifecycle carefully to avoid leaks

### GSettings Integration
- Schema must be compiled before use
- Extension settings accessed via `Extension.getSettings()`
- Changes propagate automatically via `changed` signal

### Icon Handling
- Use `St.Icon` with `icon_name` property
- Symbolic icons adapt to theme automatically
- Top bar icon needs separate `St.Icon` instance

---

## Testing Strategy

1. **Install extension locally:**
   ```bash
   # Compile schema
   glib-compile-schemas schemas/
   
   # Create symlink to extensions directory
   ln -s ~/Projects/no-sleep ~/.local/share/gnome-shell/extensions/i-cant-get-no-sleep@tichopad
   
   # Restart GNOME Shell (X11: Alt+F2, r, Enter)
   # Or log out and back in (Wayland)
   ```

2. **Enable extension:**
   ```bash
   gnome-extensions enable i-cant-get-no-sleep@tichopad
   ```

3. **Verify functionality:**
   - Toggle appears in system menu
   - Icons change correctly
   - Top bar icon appears/disappears
   - State persists across toggle
   - State persists across GNOME Shell restart
   - Inhibitor lock is taken/released (check with `systemd-inhibit --list`)

4. **Check inhibitor:**
   ```bash
   systemd-inhibit --list
   # Should show "No Sleep Extension" when enabled
   ```

---

## Potential Challenges

1. **Quick Settings API:** GNOME 45+ Quick Settings API may require specific approach for adding custom items
2. **D-Bus FD handling:** File descriptor management in JavaScript requires careful handling
3. **Icon positioning:** Top bar icon placement may need adjustment
4. **State synchronization:** Ensuring UI state matches inhibitor state and GSettings

---

## Success Criteria

- [ ] Extension loads without errors
- [ ] Toggle appears in system menu with correct icons
- [ ] Toggle state changes update icons correctly
- [ ] Top bar icon appears when enabled, disappears when disabled
- [ ] Inhibitor lock is taken when enabled
- [ ] Inhibitor lock is released when disabled
- [ ] State persists across GNOME Shell restart
- [ ] Extension disables cleanly without resource leaks
- [ ] No JavaScript errors in GNOME Shell logs

---

## Next Steps After Implementation

1. Test on actual hardware with lid close/open
2. Verify no interference with Caffeine extension
3. Test with external monitors connected
4. Consider edge cases (rapid toggling, extension reload, etc.)
