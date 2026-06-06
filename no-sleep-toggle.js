// @ts-check
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import { InhibitorManager } from "./inhibitor-manager.js";

/** Menu toggle button. */
class _NoSleepToggle extends QuickSettings.QuickToggle {
	/** Init toggle UI. */
	_init() {
		super._init({
			title: "No Sleep",
			iconName: "face-yarn-symbolic",
			toggleMode: true,
		});
	}

	/**
	 * Setup settings bind.
	 * @param {Gio.Settings} settings
	 * @param {InstanceType<typeof InhibitorManager>} inhibitorManager
	 */
	setup(settings, inhibitorManager) {
		this._settings = settings;
		this._inhibitorManager = inhibitorManager;

		this._settings.bind(
			"no-sleep-enabled",
			/** @type {Parameters<Gio.Settings['bind']>[1]} */ (
				/** @type {unknown} */ (this)
			),
			"checked",
			Gio.SettingsBindFlags.DEFAULT,
		);

		this.connect("notify::checked", () => {
			this._sync();
		});

		this._sync();
	}

	/** Update icon and state. */
	_sync() {
		if (this.checked) {
			this.iconName = "face-raspberry-symbolic";
			this._inhibitorManager?.inhibit();
		} else {
			this.iconName = "face-yawn-symbolic";
			this._inhibitorManager?.uninhibit();
		}
	}

	/** Cleanup toggle. */
	destroy() {
		this._inhibitorManager?.uninhibit();
		super.destroy();
	}
}

export const NoSleepToggle = GObject.registerClass(_NoSleepToggle);
