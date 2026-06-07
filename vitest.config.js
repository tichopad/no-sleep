import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"gi://Gio": resolve(import.meta.dirname, "tests/mocks/gio.js"),
			"gi://GLib": resolve(import.meta.dirname, "tests/mocks/glib.js"),
			"gi://GObject": resolve(import.meta.dirname, "tests/mocks/gobject.js"),
			"resource:///org/gnome/shell/ui/main.js": resolve(
				import.meta.dirname,
				"tests/mocks/shell-main.js",
			),
			"resource:///org/gnome/shell/ui/quickSettings.js": resolve(
				import.meta.dirname,
				"tests/mocks/shell-quicksettings.js",
			),
			"resource:///org/gnome/shell/extensions/extension.js": resolve(
				import.meta.dirname,
				"tests/mocks/extension.js",
			),
		},
	},
	test: {
		include: ["tests/**/*.test.js"],
		coverage: {
			provider: "v8",
		},
		setupFiles: ["tests/setup.js"],
	},
});
