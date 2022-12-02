import { I18N } from "@aurelia/i18n";
import { ICustomElementViewModel, IDialogController } from "aurelia";
import { IMemberGateway } from "../services/gateway";
import { ITheme } from "../services/theme";
import * as toastr from "toastr";
import { IUser } from "../services/user";
import { IMisc } from "../services/misc";

export class AddVideo implements ICustomElementViewModel {
    header_text: string;
    params: { src: string; name: string };
    old_params: any;
    video_date_valid = "";

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @ITheme readonly theme: ITheme,
        @I18N readonly i18n: I18N,
        @IUser readonly user: IUser,
        @IMisc readonly misc: IMisc
    ) {
        this.header_text = "videos.header-text";
    }

    activate(model: { params: any }) {
        this.params = model.params;
        if (!this.params) {
            this.params = {
                src: "",
                name: "",
            };
        }
        this.old_params = this.misc.deepClone(this.params);
    }

    send() {
        this.api
            .call_server_post("videos/save_video", {
                params: this.params,
                user_id: this.user.id,
            })
            .then((response: { user_error: any; error: any }) => {
                if (response.user_error || response.error) {
                    //toastr.warning("<p dir='rtl'>" + this.i18n.tr(response.user_error) + "</p>", '', 10000);
                } else {
                    toastr.success(
                        "<p dir='rtl'>" +
                            this.i18n.tr("videos.message-successful") +
                            "</p>",
                        "",
                        10000
                    );
                }
                this.controller.ok();
            });
    }

    cancel() {
        this.params = this.misc.deepClone(this.old_params);
        this.controller.cancel();
    }

    get dirty() {
        const dirty = JSON.stringify(this.params) != JSON.stringify(this.old_params);
        return dirty;
    }

    get incomplete() {
        if (this.video_date_valid != "valid") return "disabled";
        return "";
    }
}
