import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import * as toastr from 'toastr';

@autoinject()
export class UserInfo {
    controller;
    api;
    user;
    theme;
    i18n;
    loginData = { email: '', password: '', first_name: '', last_name: "", confirm_password: "" };
    login_failed: boolean = false;
    message: string = "";
    message_type: string = "";
    status_record;
    NOT_REGISTERING = 0;
    REGISTERING = 1;
    REGISTERING_DONE = 2;
    registering = this.NOT_REGISTERING;
    new_user = false;
    photo_story;


    constructor(controller: DialogController, api: MemberGateway, user: User, theme: Theme, i18n: I18N) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
    }

    activate(params) {
        this.status_record = params;
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

    @computedFrom('user.isLoggedIn', 'loginData.email')
    get login_phase() {
        if (this.loginData.email) {
            if (this.user.isLoggedIn) {
                this.status_record.is_logged_in = true;
                return 'is_logged-in';
            } else {
                if (this.new_user) return 'registering';
                return 'attempting'
            }
        }
        return 'init';

    }

}



