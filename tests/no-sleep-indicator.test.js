import Gio from "gi://Gio";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ICONS } from "../config.js";
import { NoSleepIndicator } from "../no-sleep-indicator.js";

describe("NoSleepIndicator", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("setup() calls _addIndicator, sets icon and visible", () => {
		const indicator = new NoSleepIndicator();
		const settings = { bind: vi.fn() };
		indicator.setup(settings);

		expect(indicator._addIndicator).toHaveBeenCalled();
		const addedIndicator = indicator._addIndicator.mock.results[0].value;
		expect(addedIndicator.icon_name).toBe(ICONS.on.name);
		expect(addedIndicator.visible).toBe(false);
	});

	it("setup() binds settings to indicator visible", () => {
		const indicator = new NoSleepIndicator();
		const settings = { bind: vi.fn() };
		indicator.setup(settings);

		expect(settings.bind).toHaveBeenCalledWith(
			"no-sleep-enabled",
			indicator._addIndicator.mock.results[0].value,
			"visible",
			Gio.SettingsBindFlags.DEFAULT,
		);
	});
});
