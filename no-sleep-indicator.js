// @ts-check
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import { ICONS } from "./config.js";
import { InhibitorManager } from "./inhibitor-manager.js";
import { NoSleepToggle } from "./no-sleep-toggle.js";

/** Top panel icon. Wires button into the quick menu as well. */
class _NoSleepIndicator extends QuickSettings.SystemIndicator {
	/** @type {ReturnType<typeof this._addIndicator> | null} */
	#indicator = null;

	/** Init indicator. */
	_init() {
		super._init();
	}

	/**
	 * Setup settings and toggle.
	 * @param {Gio.Settings} settings
	 * @param {InstanceType<typeof InhibitorManager>} inhibitorManager
	 */
	setup(settings, inhibitorManager) {
		this.#indicator = this._addIndicator();
		this.#indicator.icon_name = ICONS.on.name;
		this.#indicator.visible = false;

		/** @type {Gio.Settings} */
		this._settings = settings;
		this._settings.bind(
			"no-sleep-enabled",
			/** @type {Parameters<Gio.Settings['bind']>[1]} */ (
				/** @type {unknown} */ (this.#indicator)
			),
			"visible",
			Gio.SettingsBindFlags.DEFAULT,
		);

		const toggle = new NoSleepToggle();
		toggle.setup(settings, inhibitorManager);

		this.quickSettingsItems.push(toggle);
	}

	/** Cleanup indicator. */
	destroy() {
		for (const item of this.quickSettingsItems) {
			item.destroy();
		}
		super.destroy();
	}
}

export const NoSleepIndicator = GObject.registerClass(_NoSleepIndicator);
