// @ts-check
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import { ICONS } from "./config.js";

/** Top panel icon. */
class _NoSleepIndicator extends QuickSettings.SystemIndicator {
	/** @type {ReturnType<typeof this._addIndicator> | null} */
	#indicator = null;

	/** Init indicator. */
	_init() {
		super._init();
	}

	/**
	 * Setup settings.
	 * @param {Gio.Settings} settings
	 */
	setup(settings) {
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
	}

	/** Cleanup indicator. */
	destroy() {
		super.destroy();
	}
}

export const NoSleepIndicator = GObject.registerClass(_NoSleepIndicator);
