import { IDialogController } from '@aurelia/dialog';
import { IMemberGateway } from '../services/gateway';
import { I18N } from '@aurelia/i18n';
import { ITheme } from '../services/theme';

export class AddCustomer {
    customer_data = {
        first_name: '',
        last_name: '',
        password: '',
        email: '',
        app_name: '',
        locale: '',
    };
    message = '';
    message_type = '';
    done = false;

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @ITheme readonly theme: ITheme,
        @IDialogController readonly controller: IDialogController,
        @I18N readonly i18n: I18N
    ) {
        this.customer_data.locale = this.i18n.getLocale();
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
        this.api
            .call_server('init_app/request_new_app', this.customer_data)
            .then((response) => {
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

    get disabled_if() {
        this.message = '';
        return this.all_fields_given() ? '' : 'disabled';
    }

    all_fields_given() {
        return (
            this.customer_data.first_name &&
            this.customer_data.last_name &&
            this.customer_data.email &&
            this.customer_data.password &&
            this.customer_data.app_name
        );
    }

    keep_only_valid_domain_chars(event) {
        const key = event.key;
        if (key == 'Enter' || key == 'Backspace' || key == 'Delete') {
            return true;
        }
        if (key == '_') return true;
        const m = key.match(/[0-9a-zA-Z/]/);
        if (m) {
            return true;
        }
        return false;
    }
}
