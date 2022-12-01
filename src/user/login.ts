import { I18N } from "@aurelia/i18n";
import { IDialogController } from "aurelia";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { ITheme } from "../services/theme";
import * as toastr from "toastr";

export class Login {
    loginData = {
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        confirm_password: "",
    };
    
    login_failed = false;
    message = "";
    message_type = "";
    NOT_REGISTERING = 0;
    REGISTERING = 1;
    REGISTERING_DONE = 2;
    PASSWORD_RESET = 3;
    registering = this.NOT_REGISTERING;

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @I18N readonly i18n: I18N
    ) {

    }

    do_login() {
        this.user
            .login(this.loginData)
            .then(() => {
                this.controller.ok("good");
                toastr.success(
                    "<p dir='rtl'>" +
                        this.i18n.tr("user.login-successful") +
                        "</p>",
                    "",
                    6000
                );
            })
            .catch((reason) => {
                this.login_failed = true;
                this.message = "user." + reason;
                this.message_type = "error";
            });
    }

    do_register() {
        if (this.registering) {
            this.user
                .register(this.loginData)
                .then(() => {
                    this.registering = this.REGISTERING_DONE;
                    this.message = "user.howto-finalize-registration";
                    this.message_type = "success";
                })
                .catch((reason) => {
                    this.message = "user." + reason;
                    this.message_type = "error";
                });
        } else {
            this.registering = this.REGISTERING;
        }
    }

    finish_registration() {
        this.controller.ok("good");
    }

    do_reset_password() {
        if (this.registering == this.PASSWORD_RESET) {
            if (this.loginData.password != this.loginData.confirm_password) {
                this.message = "Passwords are different";
                this.message_type = "error";
                return;
            }
            this.user.reset_password(this.loginData).then(() => {
                this.finish_registration();
            });
        } else {
            this.registering = this.PASSWORD_RESET;
            this.message = "user.howto-complete-reset-password";
            this.message_type = "info";
        }
    }
}
