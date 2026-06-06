// @ts-check
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

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
const NoSleepIndicator = GObject.registerClass(_NoSleepIndicator);

/** Handle sleep block via DBus. */
class _InhibitorManager extends GObject.Object {
	/** Init fd state. */
	_init() {
		super._init();
		this._inhibitorFd = null;
	}

	/** Block sleep. */
	inhibit() {
		if (this._inhibitorFd !== null) return;

		try {
			const [result, fdList] = Gio.DBus.system.call_with_unix_fd_list_sync(
				"org.freedesktop.login1",
				"/org/freedesktop/login1",
				"org.freedesktop.login1.Manager",
				"Inhibit",
				/** @type {Parameters<typeof Gio.DBus.system.call_with_unix_fd_list_sync>[4]} */ (
					/** @type {unknown} */ (
						GLib.Variant.new("(ssss)", [
							"handle-lid-switch",
							"No Sleep Extension",
							"Prevent sleep when lid closed",
							"block",
						])
					)
				),
				/** @type {Parameters<typeof Gio.DBus.system.call_with_unix_fd_list_sync>[5]} */ (
					/** @type {unknown} */ (new GLib.VariantType("(h)"))
				),
				Gio.DBusCallFlags.NONE,
				-1,
				null,
				null,
			);

			/** @type {number} */
			const fdIndex = result.deepUnpack()[0];
			const fd = fdList?.get(fdIndex);
			this._inhibitorFd = new Gio.UnixInputStream({
				fd,
				close_fd: true,
			});
		} catch (e) {
			logError(/** @type {Error} */ (e), "Failed to inhibit sleep");
		}
	}

	/** Allow sleep. */
	uninhibit() {
		if (this._inhibitorFd === null) return;

		try {
			const fd = this._inhibitorFd;
			this._inhibitorFd = null;
			fd?.close(null);
		} catch (e) {
			logError(/** @type {Error} */ (e), "Failed to uninhibit sleep");
		}
	}

	/** Cleanup manager. */
	destroy() {
		this.uninhibit();
	}
}
const InhibitorManager = GObject.registerClass(_InhibitorManager);

/** Menu toggle button. */
class _NoSleepToggle extends QuickSettings.QuickMenuToggle {
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
const NoSleepToggle = GObject.registerClass(_NoSleepToggle);

/** Main extension entry. */
export default class NoSleepExtension extends Extension {
	/** Start extension. */
	enable() {
		this._settings = this.getSettings();

		this._inhibitorManager = new InhibitorManager();
		this._indicator = new NoSleepIndicator();

		this._indicator.setup(this._settings, this._inhibitorManager);

		Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
	}

	/** Stop extension. */
	disable() {
		if (this._indicator) {
			this._indicator.destroy();
			this._indicator = null;
		}

		if (this._inhibitorManager) {
			this._inhibitorManager.destroy();
			this._inhibitorManager = null;
		}

		this._settings = null;
	}
}
