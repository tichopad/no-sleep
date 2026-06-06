// @ts-check
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { InhibitorManager } from "./inhibitor-manager.js";
import { NoSleepIndicator } from "./no-sleep-indicator.js";
import { NoSleepToggle } from "./no-sleep-toggle.js";

/** Main extension entry. */
export default class NoSleepExtension extends Extension {
	/** @type {ReturnType<typeof this.getSettings> | null} */
	#settings = null;
	/** @type {InstanceType<typeof InhibitorManager> | null} */
	#inhibitorManager = null;
	/** @type {InstanceType<typeof NoSleepIndicator> | null} */
	#indicator = null;
	/** @type {InstanceType<typeof NoSleepToggle> | null} */
	#toggle = null;

	/** Start extension. */
	enable() {
		this.#settings = this.getSettings();
		this.#settings.set_boolean("no-sleep-enabled", false);

		this.#inhibitorManager = new InhibitorManager();
		this.#indicator = new NoSleepIndicator();
		this.#toggle = new NoSleepToggle();

		this.#indicator.setup(this.#settings);
		this.#toggle.setup(this.#settings, this.#inhibitorManager);

		this.#indicator.quickSettingsItems.push(this.#toggle);

		Main.panel.statusArea.quickSettings.addExternalIndicator(this.#indicator);
	}

	/** Stop extension. */
	disable() {
		if (this.#toggle) {
			this.#toggle.destroy();
			this.#toggle = null;
		}

		if (this.#indicator) {
			this.#indicator.destroy();
			this.#indicator = null;
		}

		if (this.#inhibitorManager) {
			this.#inhibitorManager.destroy();
			this.#inhibitorManager = null;
		}

		this.#settings = null;
	}
}
