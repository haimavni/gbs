import { autoinject, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { Login } from '../user/login';
import { AddCustomer } from '../admin/add_customer';
import { DialogService } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';
import { copy_to_clipboard } from '../services/dom_utils';
import { Customize } from '../admin/customize';
import { EventAggregator } from 'aurelia-event-aggregator';
import { I18N } from 'aurelia-i18n';
import * as toastr from 'toastr';

@autoinject()
export class UserMode {

    user;
    theme;
    api;
    dialog;
    router;
    i18n;
    popup: Popup;
    loginData = { email: '', password: '' };
    selectedLocale;
    locales = ['en', 'he'];
    isChangingLocale = false;
    current_url = "";
    current_url4mail;
    sharing_subject;
    ea;
    handle_star_text;

    constructor(user: User, theme: Theme, router: Router, dialog: DialogService, api: MemberGateway, popup: Popup, ea: EventAggregator, i18n: I18N) {
        this.user = user;
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
        this.api = api;
        this.dialog = dialog;
        this.popup = popup;
        this.ea = ea;
        this.handle_star_text = this.i18n.tr('user.handle-star-text')
    }

    attached() {
        this.calc_current_info();
        this.ea.subscribe('router:navigation:complete', response => {
            this.calc_current_info();
        });
    }

    calc_current_info() {
        document.title = this.i18n.tr('app-title');
        setTimeout(() => {  //if too early, overridden title is till not in effect
            this.sharing_subject = encodeURIComponent(document.title);
        }, 4000);

        let url = `${location.host}${location.pathname}${location.hash}`
        let url4mail = url;
        let i = url.indexOf('*');
        if (i == url.length - 1) {
            url += '/';
            url4mail = '"' + url + '"';
        }
        this.current_url = encodeURIComponent(url);
        this.current_url4mail = encodeURIComponent(url4mail);
        copy_to_clipboard(url)
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
        //console.log("state: ", state);
    }

    save_help_messages() {
        let target = this.user.privileges.DEVELOPER ? 'system' : '';
        this.api.call_server('help/save_help_messages_to_csv', { target: target });
    }

    load_help_messages() {
        this.api.call_server('help/load_help_messages_from_csv')
            .then(result => this.handle_help_diffs(result));
    }

    merge_help_messages() {
        let url = `${location.pathname}#/merge-help-messages`;
        this.popup.popup('MERGE-HELP', url, "height=860,width=1700,left=100,top=100");
    }

    save_letter_templates() {
        let target = this.user.privileges.DEVELOPER ? 'system' : '';
        this.api.call_server('letters/save_letter_templates_to_csv', { target: target });
    }

    handle_help_diffs(load_response) {
        //display list of conflicts and let the user enter dual editor to resolve
    }

    print_help_messages() {
        this.api.call_server('help/print_all_messages');
    }

    reindex_words() {
        this.api.call_server('admin/reindex_words');
    }

    manage_users() {
        let url = `${location.pathname}#/access-manager`;
        this.popup.popup('OLD_SITE', url, "height=860,width=1700,left=100,top=100");
    }

    manage_groups() {
        let url = `${location.pathname}#/groups-manager`;
        this.popup.popup('OLD_SITE', url, "height=860,width=1700,left=100,top=100");
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
        this.dialog.open({ viewModel: Customize, lock: false })
    }

    create_new_app() {
        this.dialog.open({ viewModel: AddCustomer, lock: true })
    }

    show_gallery() {
        this.router.navigateToRoute('gallery', {})
    }

    notify_link_copied() {
        toastr.success("Link was copied")
    }
}
