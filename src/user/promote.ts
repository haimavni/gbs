import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
export class Promote {
    controller;
    api;
    theme;
    i18n;
    header_text;
    contact_email;
    contact_name;
    contact_mobile;
    contact_message;

    constructor(controller: DialogController, api: MemberGateway, theme: Theme, ea: EventAggregator, i18n: I18N) {
        this.controller = controller;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.header_text = this.i18n.tr('promote-header-text');
    }

    send() {
        this.api.call_server_post('default/get_interested_contact', 
            {contact_name: this.contact_name, contact_email: this.contact_email, contact_mobile: this.contact_mobile, contact_message: this.contact_message, rtltr: this.theme.rtltr})
            .then(this.controller.ok());
    }

    cancel() {
        this.controller.cancel();
    }


}