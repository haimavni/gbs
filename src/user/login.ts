import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import * as toastr from 'toastr';

@autoinject()
export class Login {
    controller;
    api;
    user;
    theme;
    i18n;
    loginData = { email: '', password: '', first_name: '', last_name: "", confirm_password: "" };
    login_failed: boolean = false;
    message: string = "";
    message_type: string = "";
    NOT_REGISTERING = 0;
    REGISTERING = 1;
    REGISTERING_DONE = 2;
    PASSWORD_RESET = 3;
    registering = this.NOT_REGISTERING;

    constructor(controller: DialogController, api: MemberGateway, user: User, theme: Theme, i18n: I18N) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
    }

    do_login() {
        this.user.login(this.loginData)
            .then(() => {
                this.controller.ok('good');
                toastr.success("<p dir='rtl'>" + this.i18n.tr('user.login-successful') + "</p>", '', 6000);
            })
            .catch((reason) => {
                this.login_failed = true;
                this.message = 'user.' + reason;
                this.message_type = "error";
            });
    }

    do_register() {
        if (this.registering) {
            this.user.register(this.loginData)
                .then(() => {
                    this.registering = this.REGISTERING_DONE;
                    this.message = 'user.howto-finalize-registration';
                    this.message_type = 'success';
                })
                .catch((reason) => {
                    this.message = 'user.' + reason;
                    this.message_type = 'error';
                });
        } else {
            this.registering = this.REGISTERING;
        }
    }

    finish_registration() {
        this.controller.ok('good');
    }

    do_reset_password() {
        if (this.registering == this.PASSWORD_RESET) {
            if (this.loginData.password != this.loginData.confirm_password) {
                this.message = "Passwords are different";
                this.message_type = 'error';
                return;
            }
            this.user.reset_password(this.loginData)
                .then(() => { this.finish_registration(); });
        } else {
            this.registering = this.PASSWORD_RESET;
            this.message = 'user.howto-complete-reset-password';
            this.message_type = 'info';
        }
    }
}
