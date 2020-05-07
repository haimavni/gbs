import { PhotoDetail } from './../photos/photo-detail';
import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { Misc } from '../services/misc';
import * as toastr from 'toastr';
import { Cookies } from '../services/cookies';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';

@autoinject()
export class UserInfo {
    controller;
    api;
    user;
    theme;
    i18n;
    loginData = { email: '', password: '', first_name: '', last_name: "", confirm_password: "" };
    login_failed: boolean = false;
    message: string = "";
    message_type: string = "";
    status_record;
    NOT_REGISTERING = 0;
    REGISTERING = 1;
    REGISTERING_DONE = 2;
    registering = this.NOT_REGISTERING;
    user_id = -1;
    new_user = false;
    cookies: Cookies;
    consent;
    explain_dates_range;
    topic_list = [];
    photographer_list = [];
    no_topics_yet = false;
    no_photographers_yet = false;
    topic_groups = [];
    options_settings: MultiSelectSettings;
    photographers_settings: MultiSelectSettings;
    num_text_rows = 3;
    selected_topics = [];
    misc;
    login_error_message = "";

    constructor(controller: DialogController, api: MemberGateway, user: User,
        theme: Theme, cookies: Cookies, i18n: I18N, misc: Misc) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.misc = misc;
        this.i18n = i18n;
        this.cookies = cookies;
        this.consent = this.i18n.tr("groups.consent");
        this.explain_dates_range = this.i18n.tr("groups.explain-dates-range");
        this.options_settings = new MultiSelectSettings({
            hide_higher_options: true,
            clear_filter_after_select: false,
            can_set_sign: false,
            can_add: true,
            can_group: false,
            show_only_if_filter: true,
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
        });
        this.photographers_settings = new MultiSelectSettings({
            clear_filter_after_select: true,
            can_add: true,
            can_set_sign: false,
            can_group: false,
            single: true,
            show_only_if_filter: true,
            empty_list_message: this.i18n.tr('photos.no-photographers-yet')
        });
    }

    activate(params) {
        this.status_record = params;
        this.user.editing = true;
        this.loginData.email = this.cookies.get('USER-EMAIL');
        this.update_topic_list();
    }

    update_topic_list() {
        this.api.call_server_post('topics/get_topic_list', { usage: 'P' })
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.photographer_list = result.photographer_list;
                this.no_topics_yet = this.topic_list.length == 0;
                this.no_photographers_yet = this.photographer_list.length == 0;
            });
    }

    attempt_login() {
        this.login_error_message = "";
        this.api.call_server('groups/attempt_login', { email: this.loginData.email })
            .then(response => {
                if (response.warning_message) {
                    this.login_error_message = 'user.' + response.warning_message;
                    this.new_user = true;
                } else {
                    this.user_id = response.user_id;
                    this.new_user = this.user_id == 0;
                    this.cookies.put('USER-EMAIL', this.loginData.email);
                }
            })
    }

    do_register() {
        this.api.call_server('groups/register_user', this.loginData)
            .then(response => {
                this.user_id = response.user_id;
                this.new_user = false;
                //this.status_record.is_logged_in = true;
            })
    }

    @computedFrom('loginData.first_name', 'loginData.last_name', 'loginData.password', 'loginData.confirm_password')
    get missing_fields() {
        if (this.loginData.first_name && this.loginData.last_name && this.loginData.password && (this.loginData.password == this.loginData.confirm_password))
            return ''
        return 'disabled'
    }

    @computedFrom('user_id', 'loginData.email', 'new_user')
    get login_phase() {
        if (this.loginData.email) {
            if (this.user_id > 0) {
                this.status_record.is_logged_in = true;
                this.status_record.user_id = this.user_id;
                return 'is_logged-in';
            } else {
                if (this.new_user) return 'registering';
                return 'attempting'
            }
        }
        return 'init';
    }

    next_photo() {
        this.status_record.photo_uploaded = false;
        this.status_record.photo_url = '';
        this.status_record.photo_info.photo_story = '';
        this.status_record.duplicate = false;
        this.status_record.photo_details_saved = false;
    }

    save_photo_info() {
        this.api.call_server_post('groups/save_photo_info', { photo_id: this.status_record.photo_id, photo_info: this.status_record.photo_info })
            .then(result => {
                this.status_record.photo_details_saved = true;
                this.status_record.old_data = this.misc.deepClone(this.status_record.photo_info);
            })
    }

    cancel_changes() {
        this.status_record.photo_info = this.misc.deepClone(this.status_record.old_data);
    }

    @computedFrom('status_record.old_data', 'status_record.photo_info.photo_name', 'status_record.photo_info.photo_story',
        'status_record.photo_info.photographer_name', 'status_record.photo_info.photo_date_str', 'status_record.photo_info.photo_date_datespan')
    get dirty() {
        let _dirty = JSON.stringify(this.status_record.photo_info) != JSON.stringify(this.status_record.old_data);
        return _dirty;
    }

    @computedFrom('status_record.photo_info.photo_name', 'status_record.photo_info.photo_story', 'status_record.photo_info.photo_date_str')
    get missing_photo_info() {
        if (!this.status_record.photo_info.photo_name) return true;
        if (!this.status_record.photo_info.photo_story) return true;
        if (!this.status_record.photo_info.photo_date_str) return true;
        return false;
    }

    init_selected_topics() {
        this.selected_topics = [];
        let i = 0;
        for (let opt of this.status_record.photo_info.photo_topics) {
            let itm = { option: opt, first: i == 0, last: i == this.status_record.photo_info.photo_topics.length - 1, group_number: i + 1 }
            this.selected_topics.push(itm);
            i += 1;
        }
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.selected_topics = event.detail.selected_options
        let topics = this.selected_topics.map(top => top.option);
        this.status_record.photo_info.photo_topics = topics;
        this.api.call_server_post('photos/apply_topics_to_photo', { photo_id: this.status_record.photo_id, topics: this.status_record.photo_info.photo_topics });
    }

    @computedFrom('status_record.photo_id')
    get dummy() {
        this.init_selected_topics();
        this.init_photographer();
        return false
    }

    init_photographer() {
        //not ready yet
        return
        // this.selected_photographers = [];
        // if (this.status_record.photo_info.photographer_id) {
        //     let itm = { option: { id: this.photographer_id, name: this.photographer_name } };
        //     this.params.selected_photographers.push(itm)
        // }
    }
}
