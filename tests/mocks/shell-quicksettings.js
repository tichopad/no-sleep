import { vi } from "vitest";

export class QuickToggle {
	_init(props) {
		if (props) {
			this.title = props.title;
			this.iconName = props.iconName;
			this.toggleMode = props.toggleMode;
		}
	}
	quickSettingsItems = [];
	connect = vi.fn();
	destroy = vi.fn();
	emit(signal) {
		const handler = this.connect.mock.calls.find((c) => c[0] === signal)?.[1];
		if (handler) handler();
	}
}

export class SystemIndicator {
	_init() {}
	_addIndicator = vi.fn().mockReturnValue({
		icon_name: null,
		visible: false,
	});
	quickSettingsItems = [];
	destroy = vi.fn();
}
