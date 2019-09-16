import { autoinject, computedFrom } from "aurelia-framework";
import { Router} from "aurelia-router";
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { Login } from '../user/login';
import { DialogService } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';
import { copy_to_clipboard } from '../services/dom_utils';
import { Customize } from '../admin/customize';
import { EventAggregator } from 'aurelia-event-aggregator';


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
    current_url = "https%3A%2F%2Fgbstories.org";
    sharing_subject = "Sharing";
    ea;

    constructor(user: User, theme: Theme, router: Router, dialog: DialogService, api: MemberGateway, popup: Popup, ea: EventAggregator) {
        this.user = user;
        this.theme = theme;
        this.router = router;
        this.api = api;
        this.dialog = dialog;
        this.popup = popup;
        this.ea = ea;
        this.ea.subscribe('router:navigation:complete', response => {
            let url = `${location.host}${location.pathname}${location.hash}`
            if (url.endsWith('*')) url += '/';
            url = encodeURIComponent(url);
            this.current_url = url;
        });
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
        let url = `${location.pathname}#/access-manager`;
        this.popup.popup('OLD_SITE',  url, "height=860,width=1700,left=100,top=100");
    }

    chat_rooms() {
        let url = `${location.pathname}#/chats`;
        this.popup.popup('CHAT-ROOMS', url, "height=800,width=1800,left=50,top=50");
    }



    adhoc_scripts() {
        let url = `${location.pathname}#/adhoc-scripts`;
        this.popup.popup('ADHOC', url, "height=900,width=1800,left=50,top=50");
    }

    show_logs() {
        let url = `${location.pathname}#/show-logs`;
        this.popup.popup('ADHOC', url, "height=900,width=1800,left=50,top=50");
    }

    show_hit_counts() {
        let url = `${location.pathname}#/hit-counts`;
        this.popup.popup('ADHOC', url, "height=960,width=1800,left=50,top=50");
    }

    show_feedbacks() {
        let url = `${location.pathname}#/feedbacks`;
        this.popup.popup('ADHOC', url, "height=960,width=1800,left=50,top=50");
    }
    

    set_font_size(size) {
        this.theme.font_size = "font-size-" + size;
    }

    change_locale(locale) {
        this.theme.changeLocale(locale);
    }

    change_palette(palette) {
        this.theme.changePalette(palette);
    }

    toggle_logo() {
        this.theme.changeLogoColor();
    }

    customize() {
        this.dialog.open({viewModel: Customize, lock: false})
    }
}
