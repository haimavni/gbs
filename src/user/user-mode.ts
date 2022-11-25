import { autoinject, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";
import { User } from '../services/user';
import { Misc } from '../services/misc';
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
import environment from '../environment';
import { FacebookCard } from "./facebook-card";
import { MakeQRCode } from "./make_qrcode";

@autoinject()
export class UserMode {

    user: User;
    misc: Misc;
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
    title = "";
    sharing_subject;
    ea;
    share_menu_open = false;
    adv_options = [{name: 'advanced-options-off', cls: ''}, {name: 'advanced-options-on', cls: ''}];
    font_size_options = [];

    constructor(user: User, theme: Theme, misc: Misc, router: Router, dialog: DialogService, 
        api: MemberGateway, popup: Popup, ea: EventAggregator, i18n: I18N) {
        this.user = user;
        this.misc = misc;
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
        this.api = api;
        this.dialog = dialog;
        this.popup = popup;
        this.ea = ea;
        for (let size of [100,110,120,130,140,150,180]) {
            let opt = {size: size, sel: ''};
            this.font_size_options.push(opt);
        }
    }

    calc_current_info() {
        let shortcut = this.misc.url_shortcut;
        console.log("shortcut in user mode ", shortcut);
        if (shortcut) {
            copy_to_clipboard(shortcut);
            this.current_url = shortcut;
            return;
        }
        document.title = this.i18n.tr('app-title');
        setTimeout(() => {  //if too early, overridden title is not in effect yet
            this.sharing_subject = encodeURIComponent(document.title);
        }, 4000);

        let url = `${location.pathname}${location.hash}`
        this.current_url = null;
        this.title = document.title;
        this.api.call_server_post('default/get_shortcut', { url: url })
            .then(response => {
                let base_url = `${location.host}`;
                if (base_url == "localhost:9000") {
                    base_url = environment.baseURL;  //for the development system
                }
                let shortcut = base_url + response.shortcut;
                if (shortcut.includes('undefined')) {  //strange bug...
                    shortcut = url;
                }
                copy_to_clipboard('http://' + shortcut);
                this.current_url = shortcut;
            });

    }

    attached() {
        let idx = this.user.advanced ? 1 : 0;
        this.adv_options[idx].cls = 'selected';
        let s = this.theme.font_size.substr(10, 3);
        let size = parseInt(s);
        this.set_font_size(size); //to set the selected class
    }

    toggle_edit_mode() {
        this.user.toggle_edit_mode();
    }

    share_toggled() {
        if (! this.share_menu_open) {
            this.calc_current_info();
        }
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
        let url = this.misc.make_url('merge-help-messages')
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
        let url = this.misc.make_url('access-manager');
        this.popup.popup('OLD_SITE', url, "height=860,width=1700,left=100,top=100");
    }

    manage_groups() {
        let url = this.misc.make_url('groups-manager');
        this.popup.popup('OLD_SITE', url, "height=860,width=1700,left=100,top=100");
    }

    chat_rooms() {
        let url = this.misc.make_url('chats');
        this.popup.popup('CHAT-ROOMS', url, "height=800,width=1800,left=50,top=50");
    }

    adhoc_scripts() {
        let url = this.misc.make_url('adhoc-scripts');
        this.popup.popup('ADHOC', url, "height=900,width=1800,left=50,top=50");
    }

    show_logs() {
        let url = this.misc.make_url('show-logs');
        this.popup.popup('ADHOC', url, "height=900,width=1800,left=50,top=50");
    }

    show_hit_counts() {
        let url = this.misc.make_url('hit-counts');
        this.popup.popup('ADHOC', url, "height=960,width=1800,left=50,top=50");
    }

    show_feedbacks() {
        let url = this.misc.make_url('feedbacks');
        this.popup.popup('ADHOC', url, "height=960,width=1800,left=50,top=50");
    }


    set_font_size(size) {
        this.theme.font_size = "font-size-" + size;
        for (let fso of this.font_size_options) fso.sel = '';
        let fso = this.font_size_options.find(fs => fs.size == size);
        if (fso) fso.sel = 'selected'
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

    change_advanced_options(adv_option) {
        this.user.advanced = adv_option.name == 'advanced-options-off' ? false : true;
        for (let adv of this.adv_options) adv.cls = '';
        let idx = adv_option.name == 'advanced-options-off' ? 0 : 1;
        this.adv_options[idx].cls = 'selected';
    }

    async share_on_facebook() {
        this.theme.hide_title = true;
        let padded_photo_url;
        let photo_url = this.user.get_photo_link();
        let photo_id;
        if (photo_url) {
            photo_id = this.user.get_curr_photo_id();
        } else {
            photo_url = this.user.config.cover_photo;
            //photo_id = this.user.config.cover_photo_id;
        }
        if (photo_id) {
            await this.api.call_server_post('photos/get_padded_photo_url', 
                {photo_url: photo_url, 
                photo_id: photo_id})
                .then(response => {
                    padded_photo_url = response.padded_photo_url;
                })
            } else {
                padded_photo_url = photo_url;
            }
        this.dialog.open({ viewModel: FacebookCard,
            model: {current_url: this.current_url,
                img_src: padded_photo_url}, lock: false })
            .whenClosed(response => {
            this.theme.hide_title = false;
        });

    }

    async create_qrcode() {
        for (let i=0; i< 100; i++) {
            if (this.current_url) break;
            await this.misc.sleep(50);
        }
        if (! this.current_url) {
            toastr.error("Could not create link");
            return;
        }
        this.theme.hide_title = true;
        this.dialog.open({viewModel: MakeQRCode, 
            model: {url: this.current_url}, lock: false})
            .whenClosed(response => {
                this.theme.hide_title = false;
        })
    }

}
