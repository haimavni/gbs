import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';

@autoinject
export class AddCustomer {
    api;
    controller: DialogController;
    customer_data = {
        first_name: '',
        last_name: '',
        password: '',
        email: '',
        app_name: ''
    }
    message = '';
    message_type = '';
    done = false;

    constructor(api: MemberGateway, controller: DialogController) {
        this.api = api;
        this.controller = controller;
    }

    save() {
        if (this.done) {
            this.controller.ok();
            return;
        }
        if (!this.all_fields_given()) {
            this.message_type = 'error';
            this.message = 'admin.fields-missing';
            return;
        }
        this.api.call_server('init_app/request_new_app', this.customer_data).
            then(response => {
                if (!response.error_message) {
                    this.message_type = 'success';
                    this.message = 'admin.new-app-requested';
                    this.done = true;
                } else {
                    this.message_type = 'error';
                    this.message = response.error_message;
                }
            });
    }

    cancel() {
        this.controller.cancel();
    }

    @computedFrom('customer_data.first_name', 'customer_data.last_name',  'customer_data.email', 'customer_data.password', 'customer_data.app_name')
    get disabled_if() {
        this.message = "";
        return this.all_fields_given() ? '' : 'disabled';
    }

    all_fields_given() {
        return this.customer_data.first_name && this.customer_data.last_name && this.customer_data.email && this.customer_data.password && this.customer_data.app_name
    }

}
