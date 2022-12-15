import { DialogController, DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import {AddCustomer} from '../admin/add_customer';

@autoinject()
export class Promote {
    controller: DialogController;
    dialog: DialogService;
    api;
    theme;
    i18n;
    header_text;
    contact_email;
    contact_first_name;
    contact_last_name;
    contact_mobile;
    contact_message = "";
    create_app = false;

    constructor(controller: DialogController, dialog: DialogService, api: MemberGateway, theme: Theme, ea: EventAggregator, i18n: I18N) {
        this.controller = controller;
        this.dialog = dialog;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.header_text = this.i18n.tr('promote-header-text');
    }

    send() {
        if (! this.all_fields_given()) return;
        if (this.create_app)
        this.dialog.open({viewModel: AddCustomer, 
            model: {first_name: this.contact_first_name, last_name: this.contact_last_name, 
                email: this.contact_email, message: this.contact_message, mobile: this.contact_mobile}, lock: true})
        this.api.call_server_post('default/get_interested_contact', 
            {contact_first_name: this.contact_first_name, contact_last_name: this.contact_last_name, 
                contact_email: this.contact_email, contact_mobile: this.contact_mobile, contact_message: this.contact_message, 
                rtltr: this.theme.rtltr})
            .then(response => {this.controller.ok()});
    }

    cancel() {
        this.controller.cancel();
    }

    create_new_app() {
        this.send();
        this.dialog.open({viewModel: AddCustomer, 
            model: {first_name: this.contact_first_name, last_name: this.contact_last_name, email: this.contact_email}, lock: true})
    }

    @computedFrom('contact_first_name', 'contact_last_name', 'contact_email', 'contact_message', 'create_app')
    get disabled_if() {
        return this.all_fields_given() ? '' : 'disabled';
    }

    all_fields_given() {
        let result =  this.contact_first_name && this.contact_last_name && this.contact_email;
        if (! this.create_app) result &&= this.contact_message.length > 0;
        return result
    }

}
