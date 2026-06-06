// @ts-check
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";

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

export const InhibitorManager = GObject.registerClass(_InhibitorManager);
