// @ts-check
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import { ICONS } from "./config.js";
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
		this.#settings = settings;
		this.#inhibitorManager = inhibitorManager;

		this.#settings.bind(
			"no-sleep-enabled",
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
		const checkedStateToNotification = new Map([
			[true, { iconName: ICONS.on.name, text: "No Sleep enabled" }],
			[false, { iconName: ICONS.off.name, text: "No Sleep disabled" }],
		]);

		const notification = checkedStateToNotification.get(this.checked);
		if (notification === undefined) {
			logError(
				`Expected boolean state, received: ${String(typeof this.checked)}`,
			);
			return;
		}

		Main.osdWindowManager.show(
			-1,
			Gio.Icon.new_for_string(notification.iconName),
			notification.text,
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
