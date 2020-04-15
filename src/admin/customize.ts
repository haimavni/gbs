import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { DialogController } from 'aurelia-dialog';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';

@autoinject()
export class Customize {

    theme;
    api;
    app_title;
    app_description;
    router;
    i18n;
    controller;
    key_value_list = [];
    options_settings: MultiSelectSettings;
    auto_reg_options = ['user.auto-reg', 'user.by-invitation'];
    new_app_options = ['user.new-app-enabled', 'user.new-app-disabled'];
    audio_options = ['user.audio-enabled', 'user.audio-disabled'];
    auto_reg_option = 'user.by-invitation';
    new_app_option = 'user.new-app-disabled';
    audio_option = 'user.audio-disabled'
    user;

    constructor(theme: Theme, router: Router, i18n: I18N, controller: DialogController, api: MemberGateway, user: User) {
        this.theme = theme;
        this.router = router;
        this.user = user;
        this.i18n = i18n;
        this.api = api;
        this.controller = controller;
        this.options_settings = new MultiSelectSettings({
            clear_filter_after_select: false,
            name_editable: true,
            can_set_sign: false,
            can_group: false,
        });
    }

    attached() {
        this.app_title = this.i18n.tr('app-title');
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        let lang = this.i18n.getLocale();
        let data = this.i18n.i18next.store.data[lang].translation;
        this.create_key_value_list('', data);
        this.auto_reg_option = this.user.config.enable_auto_registration ? 'user.auto-reg' : 'user.by-invitation';
        this.new_app_option = this.user.config.expose_new_app_button ? 'user.new-app-enabled' : 'user.new-app-disabled';
        this.audio_option = this.user.config.support_audio ? 'user.audio-enabled' : 'user.audio-disabled';
    }

    create_key_value_list(prefix, data) {
        let keys = Object.keys(data);
        for (let key of keys) {
            let v = data[key];
            let p = prefix ? prefix + '.' : ''
            if (typeof v == 'string') {
                let itm = { id: p + key, name: v, topic_kind: 2 }
                this.key_value_list.push(itm)
            } else {
                this.create_key_value_list(p + key, v)
            }
        }
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
        this.key_value_list = [];
    }

    activate() {
        this.app_title = this.i18n.tr('app-title');
    }

    save() {
        this.theme.set_locale_override('app-title', this.app_title);
        this.controller.ok();
    }

    save_app_title() {
        this.theme.set_locale_override('app-title', this.app_title);
    }

    save_app_description() {
        alert(this.app_description + ' - save not ready')
    }

    cancel() {
        this.controller.cancel();
    }

    dic_item_changed(event) {
        let p = event.detail.option;
        this.theme.set_locale_override(p.id, p.name);
    }

    auto_reg_option_selected(option) {
        this.auto_reg_option = option;
        this.api.call_server('admin/set_user_registration_options', {option: this.auto_reg_option});
    }

    new_app_option_selected(option) {
        this.new_app_option = option;
        this.api.call_server('admin/set_new_app_options', {option: this.new_app_option});
    }

    audio_option_selected(option) {
        this.audio_option = option;
        this.api.call_server('admin/set_audio_option', {option: this.audio_option})
    }

}
