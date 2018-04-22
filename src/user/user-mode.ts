import { autoinject, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { Login } from '../user/login';
import { DialogService } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';
import { copy_to_clipboard } from '../services/dom_utils';


@autoinject()
export class UserMode {

    user;
    theme;
    api;
    dialog;
    router;
    popup: Popup;
    loginData = { email: '', password: '' };
    selectedLocale;
    locales = ['en', 'he'];
    isChangingLocale = false;

    constructor(user: User, theme: Theme, router: Router, dialog: DialogService, api: MemberGateway, popup: Popup) {
        this.user = user;
        this.theme = theme;
        this.router = router;
        this.api = api;
        this.dialog = dialog;
        this.popup = popup;
    }

    share() {
        let url = `${location.host}${location.pathname}${location.hash}`
        if (url.endsWith('*')) url += '/';
        copy_to_clipboard(url);
    }

    toggle_edit_mode() {
        this.user.toggle_edit_mode();
    }

    private loginDialog() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: Login, model: this.loginData, lock: false }).whenClosed(response => {
            this.theme.hide_title = false;
            if (!response.wasCancelled) {
                //do something?
            } else {
                //do something else?
            }
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
        // 'http://gbs.gbstories.org/gbs__www/stories',
        let url = `${location.host}/stories`;
        console.log("manage users url: ", url);
        this.popup.popup('OLD_SITE',  url, "height=600,width=800,left=100,top=100");
    }

    chat_rooms() {
        let url = `${location.pathname}#/chats`;
        console.log("location is: ", location);
        this.popup.popup('CHAT-ROOMS', url, "height=800,width=1800,left=50,top=50");
    }

    set_font_size(size) {
        this.theme.font_size = "font-size-" + size;
    }

    change_locale(locale) {
        this.theme.changeLocale(locale);
    }
}
