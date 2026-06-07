import Gio from "gi://Gio";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InhibitorManager } from "../inhibitor-manager.js";

describe("InhibitorManager", () => {
	beforeEach(() => {
		Gio.DBus.system.call_with_unix_fd_list_sync.mockReturnValue([
			{ deepUnpack: () => [0] },
			{ get: (i) => i },
		]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("inhibit() calls DBus with correct args", () => {
		const mgr = new InhibitorManager();
		mgr.inhibit();

		const [busName, objPath, iface, method] =
			Gio.DBus.system.call_with_unix_fd_list_sync.mock.calls[0];
		expect(busName).toBe("org.freedesktop.login1");
		expect(objPath).toBe("/org/freedesktop/login1");
		expect(iface).toBe("org.freedesktop.login1.Manager");
		expect(method).toBe("Inhibit");
	});

	it("inhibit() creates a UnixInputStream fd", () => {
		const mgr = new InhibitorManager();
		mgr.inhibit();

		expect(Gio.UnixInputStream).toHaveBeenCalledWith({ fd: 0, close_fd: true });
	});

	it("uninhibit() closes fd", () => {
		const mgr = new InhibitorManager();
		mgr.inhibit();
		mgr.uninhibit();

		expect(Gio.UnixInputStream.mock.results[0].value.close).toHaveBeenCalled();
	});

	it("destroy() calls uninhibit()", () => {
		const mgr = new InhibitorManager();
		mgr.inhibit();
		const spy = vi.spyOn(mgr, "uninhibit");
		mgr.destroy();

		expect(spy).toHaveBeenCalled();
	});

	it("inhibit() is idempotent", () => {
		const mgr = new InhibitorManager();
		mgr.inhibit();
		Gio.DBus.system.call_with_unix_fd_list_sync.mockClear();
		mgr.inhibit();

		expect(Gio.DBus.system.call_with_unix_fd_list_sync).not.toHaveBeenCalled();
	});

	it("uninhibit() when not inhibited is a no-op", () => {
		const mgr = new InhibitorManager();
		expect(() => mgr.uninhibit()).not.toThrow();
	});

	it("destroy() when not inhibited is a no-op", () => {
		const mgr = new InhibitorManager();
		expect(() => mgr.destroy()).not.toThrow();
	});

	it("DBus failure in inhibit() is caught and logged", () => {
		Gio.DBus.system.call_with_unix_fd_list_sync.mockImplementation(() => {
			throw new Error("DBus error");
		});
		const logSpy = vi
			.spyOn(globalThis, "logError")
			.mockImplementation(() => {});
		const mgr = new InhibitorManager();

		expect(() => mgr.inhibit()).not.toThrow();
		expect(logSpy).toHaveBeenCalled();
	});

	it("uninhibit() fd.close() failure is caught and logged", () => {
		const mgr = new InhibitorManager();
		mgr.inhibit();
		const fd = Gio.UnixInputStream.mock.results[0].value;
		fd.close.mockImplementation(() => {
			throw new Error("close error");
		});
		const logSpy = vi
			.spyOn(globalThis, "logError")
			.mockImplementation(() => {});

		expect(() => mgr.uninhibit()).not.toThrow();
		expect(logSpy).toHaveBeenCalled();
	});
});
