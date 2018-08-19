import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom} from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import environment from '../environment';
import * as toastr from 'toastr';

@autoinject()
export class Feedback {
    controller;
    api;
    theme;
    i18n;
    header_text;
    params = {
        feedback_bad_message: '',
        feedback_good_message: '',
        feedback_name: '',
        feedback_email: '',
        code_version: environment.version
    }

    constructor(controller: DialogController, api: MemberGateway, theme: Theme, i18n: I18N) {
        this.controller = controller;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.header_text = this.i18n.tr('feedback-header-text');
    }

    send() {
        if (this.params.feedback_bad_message=='' && this.params.feedback_good_message=='') return;
        this.api.call_server_post('default/save_feedback', this.params)
            .then(() => {
                toastr.success("<p dir='rtl'>" + this.i18n.tr('feedback-message-successful') + "</p>", '', 6000);
                this.controller.ok();
            });
    }

    cancel() {
        this.controller.cancel();
    }

    @computedFrom('params.feedback_bad_message', 'feedback_good_message')
    get is_disabled() {
        return (this.params.feedback_bad_message=='' && this.params.feedback_good_message=='');
    }


}
