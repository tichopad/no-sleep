// @ts-check
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";

/** Handle sleep block via DBus. */
class _InhibitorManager extends GObject.Object {
	/** @type {Gio.UnixInputStream | undefined | null} */
	#inhibitorFd = null;

	/** Init fd state. */
	_init() {
		super._init();
	}

	/** Block sleep. */
	inhibit() {
		if (this.#inhibitorFd !== null) return;

		try {
			/** @type {any} Note: @girs/gjs and @girs/gnome-shell is a type cross-compat hell */
			const glibVariant = GLib.Variant.new("(ssss)", [
				"handle-lid-switch",
				"No Sleep Extension",
				"Prevent sleep when lid closed",
				"block",
			]);
			/** @type {any} Note: see above */
			const variantType = new GLib.VariantType("(h)");

			const [result, fdList] = Gio.DBus.system.call_with_unix_fd_list_sync(
				"org.freedesktop.login1",
				"/org/freedesktop/login1",
				"org.freedesktop.login1.Manager",
				"Inhibit",
				glibVariant,
				variantType,
				Gio.DBusCallFlags.NONE,
				-1,
				null,
				null,
			);

			/** @type {number} */
			const fdIndex = result.deepUnpack()[0];
			const fd = fdList?.get(fdIndex);

			this.#inhibitorFd = new Gio.UnixInputStream({
				fd,
				close_fd: true,
			});
		} catch (e) {
			logError(/** @type {Error} */ (e), "Failed to inhibit sleep");
		}
	}

	/** Allow sleep. */
	uninhibit() {
		if (this.#inhibitorFd === null) return;

		try {
			const fd = this.#inhibitorFd;
			this.#inhibitorFd = null;
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
