import { DialogController } from 'aurelia-dialog';
import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';


@autoinject()
export class Login {
    controller;
    api;
    user;
    ea;
    loginData = { user_email: '', password: '', first_name: '', last_name: "", confirm_password: "" };
    login_failed: boolean = false;
    message: string = "";
    message_type: string = "";
    NOT_REGISTERING = 0;
    REGISTERING  = 1;
    REGISTERING_DONE = 2;
    registering = this.NOT_REGISTERING;

    constructor(controller: DialogController, api: MemberGateway, user: User, ea: EventAggregator) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.ea = ea;
    }

    do_login() {
        this.user.login(this.loginData)
            .then(() => this.controller.ok('good'))
            .catch((reason) => {
                this.login_failed = true;
                this.message = 'user.' + reason;
                this.message_type="error";
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
        this.user.reset_password()
            .then(() => this.controller.ok('good'));
    }
}

