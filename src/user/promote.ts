import { I18N } from "@aurelia/i18n";
import { IDialogController, IEventAggregator } from "aurelia";
import { IMemberGateway } from "../services/gateway";
import { ITheme } from "../services/theme";

export class Promote {
    header_text;
    contact_email;
    contact_name;
    contact_mobile;
    contact_message;

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @ITheme readonly theme: ITheme,
        @IEventAggregator readonly ea: IEventAggregator,
        @I18N readonly i18n: I18N
    ) {
        this.header_text = this.i18n.tr("promote-header-text");
    }

    send() {
        this.api
            .call_server_post("default/get_interested_contact", {
                contact_name: this.contact_name,
                contact_email: this.contact_email,
                contact_mobile: this.contact_mobile,
                contact_message: this.contact_message,
                rtltr: this.theme.rtltr,
            })
            .then(this.controller.ok());
    }

    cancel() {
        this.controller.cancel();
    }
}
