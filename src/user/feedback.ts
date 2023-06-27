import { IDialogController } from "@aurelia/dialog";
import { watch } from "@aurelia/runtime-html";
import { I18N } from "@aurelia/i18n";
import { IMemberGateway } from "../services/gateway";
import { ITheme } from "../services/theme";
import environment from "../environment";
import * as toastr from "toastr";

export class Feedback {
    header_text;
    params = {
        feedback_message: "",
        feedback_name: "",
        feedback_email: "",
        code_version: environment.version, //,
        // device_type:'any-device',
        // device_details: ''
    };
    //device_type_options;

    constructor(
        @IDialogController private readonly controller: IDialogController,
        @IMemberGateway private readonly api: IMemberGateway,
        @ITheme private readonly theme: ITheme,
        @I18N private readonly i18n: I18N
    ) {
        this.header_text =
            this.i18n.tr("feedback.header-text") +
            this.i18n.tr("feedback.header-text1");
        // this.device_type_options = [
        //     // { value: "any-device", name: 'feedback.any-device' },
        //     // { value: "desktop", name: 'feedback.desktop' },
        //     { value: "tablet", name: 'feedback.tablet' },
        //     { value: "smartphone", name: 'feedback.smartphone' }
        // ];
    }

    send() {
        if (this.params.feedback_message == "") return;
        this.api
            .call_server_post("default/save_feedback", this.params)
            .then(() => {
                toastr.success(
                    "<p dir='rtl'>" +
                        this.i18n.tr("feedback.message-successful") +
                        "</p>",
                    "",
                    6000
                );
                this.controller.ok();
            });
    }

    cancel() {
        this.controller.cancel();
    }

    @watch(vm => vm.params.feedback_message || vm.params.feedback_email)
    get is_disabled() {
        return (
            this.params.feedback_message == "" || !this.params.feedback_email
        );
    }
}
