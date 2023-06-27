import { DI } from "aurelia";
import environment from "../environment";
import { IMemberGateway } from "./gateway";
import { I18N } from "@aurelia/i18n";
import * as toastr from "toastr";

let THIS1;

export type IWatchVersion = WatchVersion;
export const IWatchVersion = DI.createInterface<IWatchVersion>(
    "IWatchVersion",
    (x) => x.singleton(WatchVersion)
);

export class WatchVersion {
    nudnik;
    user_warned = 0;
    window;

    constructor(
        @IMemberGateway private readonly api: IMemberGateway,
        @I18N private readonly i18n: I18N
    ) {
        THIS1 = this;
        this.verify_latest_version();
        this.nudnik = setInterval(this.verify_latest_version, 60000);
        this.window = window;
    }

    verify_latest_version() {
        let enversion = environment.version;
        if (!enversion) {
            return;
        }
        THIS1.api.call_server("default/get_curr_version").then((response) => {
            if (!response.version) return;
            if (enversion && environment.version != response.version) {
                let msg_head = THIS1.i18n.tr("please-update-head");
                let msg_body = THIS1.i18n.tr("please-update-body");
                let msg_tail = THIS1.user_warned
                    ? THIS1.i18n.tr("please-update-stubborn")
                    : "";
                toastr.success(msg_body + msg_tail, msg_head, {
                    timeOut: 60000,
                });
                THIS1.window.setTimeout(() => {
                    THIS1.window.location.reload(true);
                }, 8000);

                if (THIS1.user_warned > 1) {
                    clearInterval(THIS1.nudnik);
                    THIS1.nudnik = setInterval(
                        THIS1.verify_latest_version,
                        600000
                    );
                }
                THIS1.user_warned += 1;
            }
        });
    }
}
