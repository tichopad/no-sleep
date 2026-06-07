// @ts-check
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import { EXTENSION_NAME, ICONS, STATE_KEY_NAME } from "./config.js";
import { InhibitorManager } from "./inhibitor-manager.js";

/** Menu toggle button. */
class _NoSleepToggle extends QuickSettings.QuickToggle {
	/** @type {InstanceType<typeof InhibitorManager> | null} */
	#inhibitorManager = null;
	/** @type {Gio.Settings | null} */
	#settings = null;

	/** Init toggle UI. */
	_init() {
		super._init({
			title: EXTENSION_NAME,
			iconName: ICONS.off.name,
			toggleMode: true,
		});
	}

	/**
	 * Setup settings bind.
	 * @param {Gio.Settings} settings
	 * @param {InstanceType<typeof InhibitorManager>} inhibitorManager
	 */
	setup(settings, inhibitorManager) {
		this.#settings = settings;
		this.#inhibitorManager = inhibitorManager;

		this.#settings.bind(
			STATE_KEY_NAME,
			/** @type {Parameters<Gio.Settings['bind']>[1]} */ (
				/** @type {unknown} */ (this)
			),
			"checked",
			Gio.SettingsBindFlags.DEFAULT,
		);

		this.#sync();

		this.connect("notify::checked", () => {
			this.#sync();
		});
	}

	/**
	 * Update icon and state.
	 */
	#sync() {
		this.iconName = ICONS[this.checked ? "on" : "off"].name;
		if (this.checked) {
			this.#inhibitorManager?.inhibit();
		} else {
			this.#inhibitorManager?.uninhibit();
		}
		this.#showNotification();
	}

	/**
	 * Display notification based on state
	 */
	#showNotification() {
		const iconName = ICONS[this.checked ? "on" : "off"].name;
		const text = `${EXTENSION_NAME} ${this.checked ? "enabled" : "disabled"}`;

		Main.osdWindowManager.show(
			-1,
			Gio.Icon.new_for_string(iconName),
			text,
			null,
		);
	}

	/** Cleanup toggle. */
	destroy() {
		this.#inhibitorManager?.uninhibit();
		super.destroy();
	}
}

export const NoSleepToggle = GObject.registerClass(_NoSleepToggle);
