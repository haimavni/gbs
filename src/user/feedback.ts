
import { I18N } from '@aurelia/i18n';
import { IDialogController } from 'aurelia';
import * as toastr from 'toastr';
import { IMemberGateway } from '../services/gateway';
import { ITheme } from '../services/theme';

export class Feedback {
    header_text;
    params = {
        feedback_bad_message: '',
        feedback_good_message: '',
        feedback_name: '',
        feedback_email: '',
        code_version: process.env.version,
        device_type:'any-device',
        device_details: ''
    }
    device_type_options;

    constructor(@IDialogController readonly controller: IDialogController, @IMemberGateway readonly api: IMemberGateway, @ITheme readonly theme: ITheme, @I18N readonly i18n: I18N) {
        this.header_text = 'feedback.header-text';

        this.device_type_options = [
            { value: "any-device", name: 'feedback.any-device' },
            { value: "desktop", name: 'feedback.desktop' },
            { value: "tablet", name: 'feedback.tablet' },
            { value: "smartphone", name: 'feedback.smartphone' }
        ];
    }

    send() {
        if (this.params.feedback_bad_message=='' && this.params.feedback_good_message=='') return;
        this.api.call_server_post('default/save_feedback', this.params)
            .then(() => {
                toastr.success("<p dir='rtl'>" + this.i18n.tr('feedback.message-successful') + "</p>", '', 6000);
                this.controller.ok();
            });
    }

    cancel() {
        this.controller.cancel();
    }

    get is_disabled() {
        return ((this.params.feedback_bad_message=='' && this.params.feedback_good_message=='') || ! this.params.feedback_email);
    }


}
