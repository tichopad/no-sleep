// @ts-check
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import { InhibitorManager } from "./inhibitor-manager.js";
import { NoSleepToggle } from "./no-sleep-toggle.js";

/** Top panel icon. */
class _NoSleepIndicator extends QuickSettings.SystemIndicator {
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
		this._indicator = this._addIndicator();
		this._indicator.icon_name = "face-raspberry-symbolic";
		this._indicator.visible = false;

		/** @type {Gio.Settings} */
		this._settings = settings;
		this._settings.bind(
			"no-sleep-enabled",
			/** @type {Parameters<Gio.Settings['bind']>[1]} */ (
				/** @type {unknown} */ (this._indicator)
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
		this.quickSettingsItems.forEach((item) => {
			item.destroy();
		});
		super.destroy();
	}
}

export const NoSleepIndicator = GObject.registerClass(_NoSleepIndicator);
