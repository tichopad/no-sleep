import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EXTENSION_NAME, ICONS, STATE_KEY_NAME } from "../src/config.js";
import { InhibitorManager } from "../src/inhibitor-manager.js";
import { NoSleepToggle } from "../src/no-sleep-toggle.js";

describe("NoSleepToggle", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("_init sets correct properties", () => {
		const toggle = new NoSleepToggle();
		expect(toggle.title).toBe(EXTENSION_NAME);
		expect(toggle.iconName).toBe(ICONS.off.name);
		expect(toggle.toggleMode).toBe(true);
	});

	it("setup() binds settings to checked property", () => {
		const toggle = new NoSleepToggle();
		const settings = { bind: vi.fn() };
		const mgr = new InhibitorManager();
		toggle.setup(settings, mgr);

		expect(settings.bind).toHaveBeenCalledWith(
			STATE_KEY_NAME,
			toggle,
			"checked",
			Gio.SettingsBindFlags.DEFAULT,
		);
	});

	it("toggle checked true calls inhibit and shows OSD", () => {
		const toggle = new NoSleepToggle();
		const settings = { bind: vi.fn() };
		const mgr = new InhibitorManager();
		vi.spyOn(mgr, "inhibit");
		toggle.setup(settings, mgr);

		toggle.checked = true;
		toggle.emit("notify::checked");

		expect(mgr.inhibit).toHaveBeenCalled();
		expect(Main.osdWindowManager.show).toHaveBeenCalledWith(
			-1,
			Gio.Icon.new_for_string(ICONS.on.name),
			`${EXTENSION_NAME} enabled`,
			null,
		);
	});

	it("toggle checked false calls uninhibit and shows OSD", () => {
		const toggle = new NoSleepToggle();
		const settings = { bind: vi.fn() };
		const mgr = new InhibitorManager();
		vi.spyOn(mgr, "uninhibit");
		toggle.setup(settings, mgr);

		toggle.checked = false;
		toggle.emit("notify::checked");

		expect(mgr.uninhibit).toHaveBeenCalled();
		expect(Main.osdWindowManager.show).toHaveBeenCalledWith(
			-1,
			Gio.Icon.new_for_string(ICONS.off.name),
			`${EXTENSION_NAME} disabled`,
			null,
		);
	});

	it("destroy() calls uninhibit and super.destroy()", () => {
		const toggle = new NoSleepToggle();
		const settings = { bind: vi.fn() };
		const mgr = new InhibitorManager();
		vi.spyOn(mgr, "uninhibit");
		toggle.setup(settings, mgr);
		toggle.destroy();

		expect(mgr.uninhibit).toHaveBeenCalled();
	});

	it("setup() with null inhibitorManager does not throw", () => {
		const toggle = new NoSleepToggle();
		const settings = { bind: vi.fn() };

		expect(() => {
			toggle.setup(settings, null);
			toggle.checked = true;
			toggle.emit("notify::checked");
		}).not.toThrow();
	});
});
