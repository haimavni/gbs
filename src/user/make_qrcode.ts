import { IDialogController } from "aurelia";
import { IMemberGateway } from "../services/gateway";
import { I18N } from "@aurelia/i18n";
import { IMisc } from "../services/misc";
import { ITheme } from "../services/theme";
import * as download from "downloadjs";

export class MakeQRCode {
    error_message = "";
    qrname = "";
    url;
    title;
    name_placeholder = "";

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @I18N readonly i18n: I18N,
        @IMisc readonly misc: IMisc,
        @ITheme readonly theme: ITheme
    ) {}

    loading(params) {
        this.url = params.url;
        this.name_placeholder = this.i18n.tr("user.qrcode-name");
    }

    save() {
        this.api
            .call_server_post("default/create_qrcode", {
                url: this.url,
                name: this.qrname,
            })
            .then((response) => {
                const download_url = response.download_url;
                download(download_url);
                this.controller.ok();
            });
    }

    cancel() {
        this.controller.cancel();
    }

    get ready_to_save() {
        if (!this.qrname) return false;
        return true;
    }

    keep_only_valid_chars(event) {
        const key = event.key;
        if (key == "Enter" || key == "Backspace" || key == "Delete") {
            return true;
        }
        if (key == "_") return true;
        if (key == "-") return true;
        const m = key.match(/[0-9a-zA-Z/]/);
        if (m) {
            return true;
        }
        return false;
    }
}
