import { vi } from "vitest";

export const panel = {
	statusArea: {
		quickSettings: {
			addExternalIndicator: vi.fn(),
		},
	},
};

export const osdWindowManager = {
	show: vi.fn(),
};
