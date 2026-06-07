import { vi } from "vitest";

export function registerClass(cls) {
	return class extends cls {
		constructor(...args) {
			super();
			this._init(...args);
		}
	};
}

export class GObjectBase {
	_init() {}
	connect = vi.fn();
}

export default {
	registerClass,
	Object: GObjectBase,
};
