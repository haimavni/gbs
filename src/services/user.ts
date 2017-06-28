import { autoinject, singleton, noView } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';

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

    constructor(eventAggregator: EventAggregator, api: MemberGateway) {
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.isLoggedIn = false;
        this.editing = false;
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
                if (result.error) {
                    throw result.error
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
            })
    }

    setPrivileges(privileges) {
        this.privileges = privileges;
    }

    reset_password() {
        alert('reset password not ready')
    }

    register(loginData) {
        alert('register password not ready')
    }

}


