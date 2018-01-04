import { autoinject, singleton, noView } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';

const rtl_langs = new Set(['he', 'ar']);

@autoinject()
@singleton()
@noView()
export class User {
    public isLoggedIn: boolean;
    public eventAggregator: EventAggregator;
    public editing: boolean;
    public privileges;
    public id;
    private api;
    public rtltr;
    i18n;

    constructor(eventAggregator: EventAggregator, api: MemberGateway, i18n: I18N) {
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.isLoggedIn = false;
        this.editing = false;
        this.i18n = i18n;
        let lang = i18n.getLocale();
        this.rtltr = rtl_langs.has(lang) ? "rtl" : "ltr";
        this.privileges = {
            EDITOR: true
        }
        this.readPrivileges();
    }

    toggle_edit_mode() {
        this.editing = !this.editing;
        this.eventAggregator.publish('EditModeChange', this);
    }

    readPrivileges() {
        return this.api.call_server('default/read_privileges')
            .then(result => {
                this.isLoggedIn = result.user_id > 0;
                this.privileges = result.privileges;
            });
    }

    checkIfLoggedIn() {
        return this.api.call_server('default/check_if_logged_in')
            .then(result => { this.isLoggedIn = result.is_logged_in });
    }

    login(loginData) {
        return this.api.call_server('default/login', loginData)
            .then((result) => {
                if (result.user_error) {
                    let msg = this.i18n.tr('user.' + result.user_error);
                    throw result.user_error
                }
                this.isLoggedIn = true;
                let keys = Object.keys(result.user);
                for (let key of keys) {
                    this[key] = result.user[key];
                }
            });
    }

    logout() {
        return this.api.call_server('default/logout')
            .then(result => {
                this.isLoggedIn = false;
                this.privileges = {};
                this.editing = false;
            })
    }

    setPrivileges(privileges) {
        this.privileges = privileges;
    }

    reset_password() {
        alert('reset password not ready')
    }

    register(loginData) {
        return this.api.call_server_post('default/register_user', { user_info: loginData })
            .then((result) => {
                if (result.user_error) {
                    let msg = this.i18n.tr('user.' + result.user_error);
                    throw result.user_error
                } else if (result.error) {
                    let msg = result.error;
                    throw result.error
                }
            });
    }

}


