import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom, bindable } from 'aurelia-framework';
import { MemberGateway } from '../../services/gateway';
import { User } from "../../services/user";
import { Theme } from "../../services/theme";
import { Misc } from '../../services/misc';
import { Cookies } from '../../services/cookies';

@autoinject()
export class QuickLogin {
    @bindable explanation;
    @bindable explain_registration;
    controller;
    api;
    user: User;
    theme;
    i18n;
    loginData = { email: null, password: '', first_name: '', last_name: "", confirm_password: "" };
    login_failed: boolean = false;
    message: string = "";
    message_type: string = "";
    NOT_REGISTERING = 0;
    REGISTERING = 1;
    REGISTERING_DONE = 2;
    registering = this.NOT_REGISTERING;
    user_id = -1;
    new_user = false;
    cookies: Cookies;
    misc;
    started = false;
    login_error_message = "";

    constructor(controller: DialogController, api: MemberGateway, user: User,
        theme: Theme, cookies: Cookies, i18n: I18N, misc: Misc) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.misc = misc;
        this.i18n = i18n;
        this.cookies = cookies;
    }

    attached() {
        this.loginData.email = this.cookies.get('USER-EMAIL') || "";
        if (this.user.isLoggedIn) {
            this.user_id = this.user.id;
        }
    }

    attempt_login() {
        this.login_error_message = "";
        this.user.attempt_login(this.loginData)
            .then(response => {
                this.user_id = response.user_id;
                if (this.user_id) {
                    this.user.id = this.user_id;  //bad. move this function to the user service
                    this.user.isLoggedIn = true;
                    this.cookies.put('USER-EMAIL', this.loginData.email);
                } else {
                    this.login_error_message = 'user.' + response.warning_message;   
                }
                this.new_user = !this.user_id;

            });
    }

    do_register() {
        this.api.call_server('groups/register_user', this.loginData)
            .then(response => {
                this.attempt_login();
            })
    }

    @computedFrom('loginData.first_name', 'loginData.last_name', 'loginData.password', 'loginData.confirm_password')
    get missing_fields() {
        if (this.loginData.first_name && this.loginData.last_name && this.loginData.password && (this.loginData.password == this.loginData.confirm_password))
            return ''
        return 'disabled'
    }

    @computedFrom('user_id', 'loginData.email', 'new_user', 'started')
    get login_phase() {
        if (!this.started) return 'init';
        if (!this.loginData.email) return 'attempting';
        if (this.loginData.email) {
            if (this.user_id > 0) {
                return 'is_logged-in';
            } else {
                if (this.new_user) return 'registering';
                return 'attempting'
            }
        }
        return 'init';
    }

    open_dialog() {
        this.started = true;
    }

    @computedFrom('user.isLoggedIn')
    get is_logged_in() {
        if (!this.user.isLoggedIn)
            this.started = false;
        return 'bla';
    }

}
