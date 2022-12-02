import { ICustomElementViewModel, IDialogController } from "aurelia";
import { I18N } from "@aurelia/i18n";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { ITheme } from "../services/theme";
import { copy_to_clipboard } from "../services/dom_utils";
import { IPopup } from "../services/popups";

export class FacebookCard implements ICustomElementViewModel {
    message_type;
    title;
    current_url;
    img_src;
    description;
    card_url;
    message = "";

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @IPopup readonly popup: IPopup,
        @I18N readonly i18n: I18N
    ) {}

    activate(model) {
        this.current_url = model.current_url;
        this.img_src = model.img_src;
        this.title = this.i18n.tr("app-title");
        if (this.img_src) {
            this.message = "user.sharing.replace-photo";
            this.message_type = "info";
        } else {
            this.message = "user.sharing.missing-photo";
            this.message_type = "warning";
        }
    }

    create_card() {
        const title = this.title;

        this.api
            .call_server_post("default/make_fb_card", {
                img_src: this.img_src,
                url: this.current_url,
                title: title,
                description: this.description,
            })
            .then((response) => {
                this.card_url = response.card_url;
                copy_to_clipboard(this.card_url);
                //this.controller.ok();
            });
    }

    submit_it() {
        const href = `https://facebook.com/sharer/sharer.php?u=${this.card_url}&t=${this.title}`;
        this.popup.popup(
            "SHARER",
            href,
            "height=600,width=800,left=200,top=100"
        );
    }
}
