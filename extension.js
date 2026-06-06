// @ts-check
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { InhibitorManager } from "./inhibitor-manager.js";
import { NoSleepIndicator } from "./system-indicator.js";

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
