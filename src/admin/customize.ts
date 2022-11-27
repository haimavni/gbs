import { autoinject } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { DialogController } from 'aurelia-dialog';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import * as toastr from 'toastr';

let THIS_EDITOR;

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
    terms_options = ['user.terms-enabled', 'user.terms-disabled'];
    feedback_options = ['user.feedback-on', 'user.feedback-off'];
    quick_upload_options = ['user.quick-upload-on', 'user.quick-upload-off'];
    version_time_options = ['user.version-time-on', 'user.version-time-off'];
    expose_developer_options = ['user.expose-developer-on', 'user.expose-developer-off'];
    enable_articles_options = ['user.enable-articles-on', 'user.enable-articles-off'];
    enable_books_options = ['user.enable-books-on', 'user.enable-books-off'];
    enable_member_of_the_day_options = ['user.enable-member-of-the-day-on', 'user.enable-member-of-the-day-off'];
    exclusive_options = ['user.exclusive-on', 'user.exclusive-off'];
    enable_cuepoints_options = ['user.enable-cuepoints-on', 'user.enable-cuepoints-off'];
    allow_publishing_options = ['user.allow-publishing-on', 'user.allow-publishing-off'];
    expose_gallery_options = ['user.expose-gallery-on', 'user.expose-gallery-off'];
    short_bio_title_options = ['user.short-bio-title-on', 'user.short-bio-title-on'];
    articles_in_menu_options = ['user.articles-in-menu-on', 'user.articles-in-menu-off'];

    //-----------
    auto_reg_option = 'user.by-invitation';
    new_app_option = 'user.new-app-disabled';
    audio_option = 'user.audio-disabled';
    terms_option = 'user.terms-enabled';
    feedback_option = 'user.feedback-on';
    exclusive_option = 'user.exclusive-off'
    quick_upload_button = 'user.quick-upload-off';
    version_time_option = 'user.version-time-on';
    expose_developer_option = 'user.expose-developer-on';
    enable_articles_option = 'user.enable-articles-off';
    enable_cuepoints_option = 'user.enable-cuepoints-off';
    allow_publishing_option = 'user.allow-publishing-off';
    expose_gallery_option = 'user.expose-gallery-off';
    short_bio_title_option = 'user.short-bio-title-off';
    articles_in_menu_option = 'user.articles-in-menu-off';
    enable_books_option = 'user.enable-books-on';
    enable_member_of_the_day_option = 'user.enable-member-of-the-day-on';
    promoted_story_expiration = 7;
    cover_photo;
    cover_photo_id;
    user;
    froala_config = {
        iconsTemplate: 'font_awesome_5',
        toolbarButtons: ['undo', 'redo'],
        fontSize: ['8', '10', '12', '13', '14', '15', '16', '18', '20', '24', '32', '36', '48', '60', '72', '96'],
        imageDefaultDisplay: 'inline',
        imageDefaultAlign: 'right',
        imageUpload: false,
        imageDefaultWidth: 100,
        videoDefaultDisplay: 'inline',
        videoDefaultAlign: 'left',
        VideoDefaultWidth: 160,
        charCounterCount: false,
        linkAlwaysBlank: true,
        language: 'he', heightMin: 100, heightMax: 100,
        padding: '10px',
        imageUploadRemoteUrls: false,
        key: ""
    };
    dirty = false;
    edited_str_orig = "";
    app_description_story;

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
            auto_select: false
        });
        THIS_EDITOR = this;
        this.froala_config.key = this.theme.froala_key();
    }

    async attached() {
        this.app_title = this.i18n.tr('app-title');
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        let lang = this.i18n.getLocale();
        let data = this.i18n.i18next.store.data[lang].translation;
        await this.user.readConfiguration();
        this.create_key_value_list('', data);
        this.auto_reg_option = this.user.config.enable_auto_registration ? 'user.auto-reg' : 'user.by-invitation';
        this.new_app_option = this.user.config.expose_new_app_button ? 'user.new-app-enabled' : 'user.new-app-disabled';
        this.audio_option = this.user.config.support_audio ? 'user.audio-enabled' : 'user.audio-disabled';
        this.terms_option = this.user.config.terms_enabled ? 'user.terms-enabled' : 'user.terms-disabled';
        this.feedback_option = this.user.config.expose_feedback_button ? 'user.feedback-on' : 'user.feedback-off';
        this.exclusive_option = this.user.config.exclusive ? 'user.exclusive-on' : 'user.exclusive-off';
        this.quick_upload_button = this.user.config.quick_upload_button ? 'user.quick-upload-on' : 'user.quick-upload-off';
        this.expose_developer_option = this.user.config.expose_developer ? 'user.expose-developer-on' : 'user.expose-developer-off';
        this.enable_articles_option = this.user.config.enable_articles ? 'user.enable-articles-on' : 'user.enable-articles-off';
        this.version_time_option = this.user.config.expose_version_time ? 'user.version-time-on' : 'user.version-time-off';
        this.enable_books_option = this.user.config.enable_books ? 'user.enable-books-on' : 'user.enable-books-off';
        this.enable_member_of_the_day_option = this.user.config.enable_member_of_the_day_option ? 'user.enable-member-of-the-day-on' : 'user.enable-member-of-the-day-off';
        this.enable_cuepoints_option = this.user.config.enable_cuepoints ? 'user.enable-cuepoints-on' : 'user.enable-cuepoints-off';
        this.allow_publishing_option = this.user.config.allow_publishing ? 'user.allow-publishing-on' : 'user.allow-publishing-off';
        this.expose_gallery_option = this.user.config.expose_gallery ? 'user.expose-gallery-on' : 'user.expose-gallery-off';
        this.short_bio_title_option = this.user.config.short_bio_title ? 'user.short-bio-title-on' : 'user.short-bio-title-off';
        this.articles_in_menu_option = this.user.config.articles_in_menu ? 'user.articles-in-menu-on' : 'user.articles-in-menu-off';
        this.promoted_story_expiration = this.user.config.promoted_story_expiration;
        this.cover_photo = this.user.config.cover_photo;
        if (! this.cover_photo) {
            let cover_photo_id = this.user.get_curr_photo_id();
            this.api.call_server_post('admin/cover_photo',
            {cover_photo_id: cover_photo_id})
            .then(response => {
                this.user.readConfiguration();
                //this.report_success();
            })


            // let cover_photo = this.user.get_photo_link();
            // let cover_photo_id = this.user.get_curr_photo_id();
            // if (cover_photo) {
            //     this.cover_photo = cover_photo;
            //     this.cover_photo_id = cover_photo_id;
            // }
        }
        this.api.call_server_post('members/get_app_description')
            .then(result => { this.app_description_story = result.story;
                this.edited_str_orig = result.story.story_text;
             });
        this.froala_config.key = this.theme.froala_key();
        this.froala_config.language = this.i18n.getLocale();
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

    save_app_title() {
        this.theme.set_locale_override('app-title', this.app_title);
        this.user.store_app_title()
    }

    save_app_description() {
        if (! this.dirty) {
            return;
        }
        let data = { user_id: this.user.id };
        data['story_info'] = this.app_description_story;
        data['pinned'] = true;
        this.api.call_server_post('members/save_story_info', data)
            .then(response => {
                this.edited_str_orig = this.app_description_story.story_text;
                this.dirty = false;
            });
    }

    cancel_changes() {
        this.app_description_story.story_text = this.edited_str_orig;
        this.dirty = false;
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
                this.report_success();
            })
    }

    new_app_option_selected(option) {
        this.new_app_option = option;
        this.api.call_server('admin/set_new_app_options', { option: this.new_app_option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    audio_option_selected(option) {
        this.audio_option = option;
        this.api.call_server('admin/set_audio_option', { option: this.audio_option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    terms_option_selected(option) {
        this.terms_option = option;
        this.api.call_server('admin/set_terms_option', { option: this.terms_option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }


    feedback_option_selected(option) {
        this.feedback_option = option;
        this.api.call_server('admin/set_feedback_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    exclusive_option_selected(option) {
        this.exclusive_option = option;
        this.api.call_server('admin/set_exclusive_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    quick_upload_option_selected(option) {
        this.quick_upload_button = option;
        this.api.call_server('admin/set_quick_upload_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    expose_developer_option_selected(option) {
        this.expose_developer_option = option;
        this.api.call_server('admin/set_developer_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    enable_articles_option_selected(option) {
        this.enable_articles_option = option;
        this.api.call_server('admin/set_articles_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    enable_books_option_selected(option) {
        this.enable_books_option = option;
        this.api.call_server('admin/set_books_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    enable_member_of_the_day_option_selected(option) {
        this.enable_member_of_the_day_option = option;
        this.api.call_server('admin/set_member_of_the_day_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    enable_cuepoints_option_selected(option) {
        this.enable_cuepoints_option = option;
        this.api.call_server('admin/set_cuepoints_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    allow_publishing_option_selected(option) {
        this.allow_publishing_option = option;
        this.api.call_server('admin/set_publishing_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }
    
    expose_gallery_option_selected(option) {
        this.expose_gallery_option = option;
        this.api.call_server('admin/set_expose_gallery_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    short_bio_title_option_selected(option) {
        this.short_bio_title_option = option;
        this.api.call_server('admin/set_short_bio_title_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })

    }
    
    articles_in_menu_option_selected(option) {
        this.articles_in_menu_option = option;
        this.api.call_server('admin/set_articles_in_menu_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })

    }
    
    version_time_option_selected(option) {
        this.version_time_option = option;
        this.api.call_server('admin/set_version_time_option', { option: option })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    set_promoted_story_expiration() {
        this.api.call_server('admin/set_promoted_story_expiration', { promoted_story_expiration: this.promoted_story_expiration })
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

    report_success() {
        toastr.success(this.i18n.tr("admin.changes-successfully-saved"))
    }

    initialized(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        THIS_EDITOR.edited_str_orig = el.innerHTML.slice(0);
    }

    content_changed(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        let s = el.innerHTML;
        THIS_EDITOR.dirty = (s != THIS_EDITOR.edited_str_orig);
    }

    set_cover_photo(event) {
        let cover_photo_id = this.user.get_curr_photo_id();
        if (cover_photo_id == this.cover_photo_id || ! cover_photo_id) {
            toastr.warning(this.i18n.tr("admin.no-new-cover-photo-selected"));
            return;
        }

        //this.cover_photo = cover_photo;
        this.cover_photo_id = cover_photo_id;
        this.api.call_server_post('admin/cover_photo',
            {cover_photo_id: cover_photo_id})
            .then(response => {
                this.user.readConfiguration();
                this.report_success();
            })
    }

}
