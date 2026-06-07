import { Settings } from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STATE_KEY_NAME } from "../config.js";
import NoSleepExtension from "../extension.js";
import { InhibitorManager } from "../inhibitor-manager.js";
import { NoSleepIndicator } from "../no-sleep-indicator.js";
import { NoSleepToggle } from "../no-sleep-toggle.js";

describe("NoSleepExtension", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	function enableExtension(ext) {
		const mockSettings = new Settings();
		ext.getSettings.mockReturnValue(mockSettings);
		ext.enable();
		return mockSettings;
	}

	it("enable() creates settings and sets state to false", () => {
		const ext = new NoSleepExtension();
		const mockSettings = enableExtension(ext);

		expect(ext.getSettings).toHaveBeenCalled();
		expect(mockSettings.set_boolean).toHaveBeenCalledWith(
			STATE_KEY_NAME,
			false,
		);
	});

	it("enable() pushes toggle into indicator and adds to panel", () => {
		const ext = new NoSleepExtension();
		enableExtension(ext);

		expect(
			Main.panel.statusArea.quickSettings.addExternalIndicator,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				quickSettingsItems: expect.arrayContaining([
					expect.objectContaining({
						title: "No Sleep",
						toggleMode: true,
					}),
				]),
			}),
		);
	});

	it("enable() calls indicator.setup and toggle.setup with settings", () => {
		const indicatorSetup = vi.spyOn(NoSleepIndicator.prototype, "setup");
		const toggleSetup = vi.spyOn(NoSleepToggle.prototype, "setup");
		const ext = new NoSleepExtension();
		const mockSettings = enableExtension(ext);

		expect(indicatorSetup).toHaveBeenCalledWith(mockSettings);
		expect(toggleSetup).toHaveBeenCalledWith(
			mockSettings,
			expect.any(InhibitorManager),
		);
	});

	it("enable() adds indicator to Main.panel", () => {
		const ext = new NoSleepExtension();
		enableExtension(ext);

		expect(
			Main.panel.statusArea.quickSettings.addExternalIndicator,
		).toHaveBeenCalledTimes(1);
	});

	it("disable() after enable() does not throw", () => {
		const ext = new NoSleepExtension();
		enableExtension(ext);

		expect(() => ext.disable()).not.toThrow();
	});

	it("disable() without enable() does not throw", () => {
		const ext = new NoSleepExtension();

		expect(() => ext.disable()).not.toThrow();
	});

	it("enable() -> disable() -> enable() works cleanly", () => {
		const ext = new NoSleepExtension();
		enableExtension(ext);
		ext.disable();
		expect(() => ext.enable()).not.toThrow();

		expect(
			Main.panel.statusArea.quickSettings.addExternalIndicator,
		).toHaveBeenCalledTimes(2);
	});
});
