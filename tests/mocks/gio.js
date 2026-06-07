import { vi } from "vitest";

export const SettingsBindFlags = { DEFAULT: 0 };

export class Settings {
	bind = vi.fn();
	get_boolean = vi.fn().mockReturnValue(false);
	set_boolean = vi.fn();
}

export const DBusCallFlags = { NONE: 0 };

export const DBus = {
	system: {
		call_with_unix_fd_list_sync: vi
			.fn()
			.mockReturnValue([{ deepUnpack: () => [0] }, { get: (i) => i }]),
	},
};

export const UnixInputStream = vi
	.fn()
	.mockImplementation(({ fd, close_fd }) => ({ fd, close_fd, close: vi.fn() }));

export const Icon = {
	new_for_string: vi.fn().mockReturnValue("mock-icon"),
};

export default {
	Settings,
	SettingsBindFlags,
	DBus,
	DBusCallFlags,
	UnixInputStream,
	Icon,
};
