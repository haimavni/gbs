import { autoinject } from "aurelia-framework";
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { Login } from '../user/login';
import { DialogService } from 'aurelia-dialog';
import { UploadPhotos } from '../photos/upload-photos';
import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';

@autoinject()
export class UserMode {

    user;
    theme;
    api;
    dialog;
    popup: Popup;
    loginData = { email: '', password: '' };

    constructor(user: User, theme: Theme, dialog: DialogService, api: MemberGateway, popup: Popup) {
        this.user = user;
        this.theme = theme;
        this.api = api;
        this.dialog = dialog;
        this.popup = popup;
    }

    toggle_edit_mode() {
        this.user.toggle_edit_mode();
    }

    private loginDialog() {
        this.dialog.open({ viewModel: Login, model: this.loginData, lock: false }).whenClosed(response => {
            if (!response.wasCancelled) {
                console.log('successful login - ', response.output);
            } else {
                console.log('login cancelled');
            }
            console.log(response.output);
        });
    }

    login() {
        this.user.checkIfLoggedIn()
            .then((result) => {
                if (!result) {
                    this.loginDialog();
                }
            });
    }

    logout() {
        this.user.logout();
    }

    upload_files() {
        this.dialog.open({ viewModel: UploadPhotos, lock: false });

    }

    toggled(state) {
        console.log("state: ", state);
    }

    save_help_messages() {
        this.api.call_server('help/save_help_messages_to_csv');
    }

    load_help_messages() {
        this.api.call_server('help/load_help_messages_from_csv');
    }

    reindex_words() {
        this.api.call_server('admin/reindex_words');
    }

    manage_users() {
        this.popup.popup('OLD_SITE', 'http://gbs.gbstories.org/gbs__www/stories', "height=600,width=800,left=100,top=100");
    }

    chat_rooms() {
        this.popup.popup('CHAT-ROOMS', 'http://gbs.gbstories.org/gbs__www/stories', "height=800,width=1600,left=150,top=150");
    }

    set_font_size(size) {
        this.theme.font_size = "font-size-" + size;
    }
}
