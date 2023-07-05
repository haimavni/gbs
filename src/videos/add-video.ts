import { IDialogController } from "@aurelia/dialog";
import { I18N } from "@aurelia/i18n";
import { IMemberGateway } from "../services/gateway";
import { ITheme } from "../services/theme";
import * as toastr from "toastr";
import { IUser } from "../services/user";
import { IMisc } from "../services/misc";

export class AddVideo {
    header_text: string;
    params: { src: string; name: string; id: Number };
    old_params: any;
    video_date_valid = "";
    title = "";

    constructor(
        @IDialogController private readonly controller: IDialogController,
        @IMemberGateway private readonly api: IMemberGateway,
        @ITheme private readonly theme: ITheme,
        @I18N private readonly i18n: I18N,
        @IUser private readonly user: IUser,
        @IMisc private readonly misc: IMisc
    ) {
        this.header_text = "videos.header-text";
    }

    activate(model: { params: any }) {
        this.params = model.params;
        if (!this.params) {
            this.params = {
                src: "",
                name: "",
                id: null,
            };
        }
        this.old_params = this.misc.deepClone(this.params);
        this.title = this.params.id
            ? "videos.edit-video-info"
            : "videos.add-video";
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
        let dirty =
            JSON.stringify(this.params) != JSON.stringify(this.old_params);
        return dirty;
    }

    get incomplete() {
        if (this.video_date_valid != "valid") return "disabled";
        return "";
    }
}
