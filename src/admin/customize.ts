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
    feedback_options = ['user.feedback-on', 'user.feedback-off'];
    quick_upload_options = ['user.quick-upload-on', 'user.quick-upload-off'];
    version_time_options = ['user.version-time-on', 'user.version-time-off'];
    expose_developer_options = ['user.expose-developer-on', 'user.expose-developer-off'];
    
    //-----------
    auto_reg_option = 'user.by-invitation';
    new_app_option = 'user.new-app-disabled';
    audio_option = 'user.audio-disabled';
    feedback_option = 'user.feedback-on';
    quick_upload_button = 'user.quick-upload-off';
    version_time_option = 'user.version-time-on';
    expose_developer_option = 'user.expose-developer-on';
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

    async attached() {
        this.app_title = this.i18n.tr('app-title');
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        let lang = this.i18n.getLocale();
        let data = this.i18n.i18next.store.data[lang].translation;
        //await this.user.readConfiguration();
        this.create_key_value_list('', data);
        this.auto_reg_option = this.user.config.enable_auto_registration ? 'user.auto-reg' : 'user.by-invitation';
        this.new_app_option = this.user.config.expose_new_app_button ? 'user.new-app-enabled' : 'user.new-app-disabled';
        this.audio_option = this.user.config.support_audio ? 'user.audio-enabled' : 'user.audio-disabled';
        this.feedback_option = this.user.config.expose_feedback_button ? 'user.feedback-on' : 'user.feedback-off';
        this.quick_upload_button = this.user.config.quick_upload_button ? 'user.quick-upload-on' : 'user.quick-upload-off';
        this.expose_developer_option = this.user.config.expose_developer ?  'user.expose-developer-on' : 'user.expose-developer-off';
        this.version_time_option = this.user.config.expose_version_time ? 'user.version-time-on' : 'user.version-time-off';
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
        this.api.call_server('admin/set_user_registration_options', { option: this.auto_reg_option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

    new_app_option_selected(option) {
        this.new_app_option = option;
        this.api.call_server('admin/set_new_app_options', { option: this.new_app_option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

    audio_option_selected(option) {
        this.audio_option = option;
        this.api.call_server('admin/set_audio_option', { option: this.audio_option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

    feedback_option_selected(option) {
        this.feedback_option = option;
        this.api.call_server('admin/set_feedback_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

    quick_upload_option_selected(option) {
        this.quick_upload_button = option;
        this.api.call_server('admin/set_quick_upload_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

    expose_developer_option_selected(option) {
        this.expose_developer_option = option;
        this.api.call_server('admin/set_developer_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

    version_time_option_selected(option) {
        this.version_time_option = option;
        this.api.call_server('admin/set_version_time_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
            })
    }

}
