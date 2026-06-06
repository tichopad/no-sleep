import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const NoSleepToggle = GObject.registerClass(
class NoSleepToggle extends QuickSettings.QuickMenuToggle {
    _init(settings, inhibitorManager) {
        super._init({
            title: 'No Sleep',
            iconName: 'face-yarn-symbolic',
            toggleMode: true,
        });

        this._settings = settings;
        this._inhibitorManager = inhibitorManager;

        this._settings.bind('no-sleep-enabled',
            this, 'checked',
            Gio.SettingsBindFlags.DEFAULT);

        this.connect('notify::checked', () => {
            this._sync();
        });

        this._sync();
    }

    _sync() {
        const enabled = this.checked;

        if (enabled) {
            this.iconName = 'face-raspberry-symbolic';
            this._inhibitorManager.inhibit();
        } else {
            this.iconName = 'face-yawn-symbolic';
            this._inhibitorManager.uninhibit();
        }
    }

    destroy() {
        this._inhibitorManager.uninhibit();
        super.destroy();
    }
});

const NoSleepIndicator = GObject.registerClass(
class NoSleepIndicator extends QuickSettings.SystemIndicator {
    _init(settings, inhibitorManager) {
        super._init();

        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'face-raspberry-symbolic';
        this._indicator.visible = false;

        this._settings = settings;
        this._settings.bind('no-sleep-enabled',
            this._indicator, 'visible',
            Gio.SettingsBindFlags.DEFAULT);

        this.quickSettingsItems.push(new NoSleepToggle(settings, inhibitorManager));
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

const InhibitorManager = GObject.registerClass(
class InhibitorManager extends GObject.Object {
    _init() {
        super._init();
        this._inhibitorFd = null;
    }

    inhibit() {
        if (this._inhibitorFd !== null)
            return;

        try {
            const [result, fdList] = Gio.DBus.system.call_with_unix_fd_list_sync(
                'org.freedesktop.login1',
                '/org/freedesktop/login1',
                'org.freedesktop.login1.Manager',
                'Inhibit',
                GLib.Variant.new('(ssss)', [
                    'handle-lid-switch',
                    'No Sleep Extension',
                    'Prevent sleep when lid closed',
                    'block',
                ]),
                new GLib.VariantType('(h)'),
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                null
            );

            const fdIndex = result.deepUnpack()[0];
            const fd = fdList.get(fdIndex);
            this._inhibitorFd = new Gio.UnixInputStream({fd, close_fd: true});
        } catch (e) {
            logError(e, 'Failed to inhibit sleep');
        }
    }

    uninhibit() {
        if (this._inhibitorFd === null)
            return;

        try {
            const fd = this._inhibitorFd;
            this._inhibitorFd = null;
            fd.close();
        } catch (e) {
            logError(e, 'Failed to uninhibit sleep');
        }
    }

    destroy() {
        this.uninhibit();
    }
});

export default class NoSleepExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._inhibitorManager = new InhibitorManager();
        this._indicator = new NoSleepIndicator(this._settings, this._inhibitorManager);

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;

        this._inhibitorManager.destroy();
        this._inhibitorManager = null;

        this._settings = null;
    }
}
