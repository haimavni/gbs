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
    user_id = -1;
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

    attempt_login() {
        this.api.call_server('groups/attempt_login', { email: this.loginData.email })
            .then(response => {
                this.user_id = response.user_id;
                this.new_user = this.user_id == 0;
            })
    }

    do_register() {
        this.api.call_server('groups/register_user', this.loginData)
            .then(response => {
                this.user_id = response.user_id;
                this.new_user = false;
                //this.status_record.is_logged_in = true;
            })
    }

    @computedFrom('loginData.first_name', 'loginData.last_name', 'loginData.password', 'loginData.confirm_password')
    get missing_fields() {
        if (this.loginData.first_name && this.loginData.last_name && this.loginData.password && (this.loginData.password==this.loginData.confirm_password))
            return ''
        return 'disabled'
    }

    @computedFrom('user_id', 'loginData.email', 'new_user')
    get login_phase() {
        if (this.loginData.email) {
            if (this.user_id > 0) {
                this.status_record.is_logged_in = true;
                this.status_record.user_id = this.user_id;
                return 'is_logged-in';
            } else {
                if (this.new_user) return 'registering';
                return 'attempting'
            }
        }
        return 'init';
    }

    next_photo() {
        this.status_record.photo_uploaded = false;
        this.status_record.photo_url = '';
    }

}
