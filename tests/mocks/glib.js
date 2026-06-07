import { vi } from "vitest";

export const Variant = {
	new: vi.fn().mockReturnValue("mock-variant"),
};

export class VariantType {
	constructor(type) {
		this.type = type;
	}
}

export default {
	Variant,
	VariantType,
};
