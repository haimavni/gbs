import { I18N } from '@aurelia/i18n';
import { bindable, IDialogController } from 'aurelia';
import { IMemberGateway } from '../../services/gateway';
import { IUser } from '../../services/user';
import { ITheme } from '../../services/theme';
import { IMisc } from '../../services/misc';
import { ICookies } from '../../services/cookies';

export class QuickLogin {
    @bindable explanation;
    @bindable explain_registration;
    loginData = {
        email: null,
        password: '',
        first_name: '',
        last_name: '',
        confirm_password: '',
    };
    login_failed = false;
    message = '';
    message_type = '';
    NOT_REGISTERING = 0;
    REGISTERING = 1;
    REGISTERING_DONE = 2;
    registering = this.NOT_REGISTERING;
    user_id = -1;
    new_user = false;
    started = false;
    login_error_message = '';

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @ICookies readonly cookies: ICookies,
        @I18N readonly i18n: I18N,
        @IMisc readonly misc: IMisc
    ) {}

    attached() {
        this.loginData.email = this.cookies.get('USER-EMAIL') || '';
        if (this.user.isLoggedIn) {
            this.user_id = this.user.id;
        }
    }

    attempt_login() {
        this.login_error_message = '';
        this.user.attempt_login(this.loginData).then((response) => {
            this.user_id = response.user_id;
            if (this.user_id) {
                this.user.id = this.user_id; //bad. move this function to the user service
                this.user.isLoggedIn = true;
                this.cookies.put('USER-EMAIL', this.loginData.email);
            } else {
                this.login_error_message = 'user.' + response.warning_message;
            }
            this.new_user = !this.user_id;
        });
    }

    do_register() {
        this.api
            .call_server('groups/register_user', this.loginData)
            .then((response) => {
                this.attempt_login();
            });
    }

    get missing_fields() {
        if (
            this.loginData.first_name &&
            this.loginData.last_name &&
            this.loginData.password &&
            this.loginData.password == this.loginData.confirm_password
        )
            return '';
        return 'disabled';
    }

    get login_phase() {
        if (!this.started) return 'init';
        if (!this.loginData.email) return 'attempting';
        if (this.loginData.email) {
            if (this.user_id > 0) {
                return 'is_logged-in';
            } else {
                if (this.new_user) return 'registering';
                return 'attempting';
            }
        }
        return 'init';
    }

    open_dialog() {
        this.started = true;
    }

    get is_logged_in() {
        if (!this.user.isLoggedIn) this.started = false;
        return 'bla';
    }
}
