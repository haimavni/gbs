import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { FullSizePhoto } from './full-size-photo';
import { UploadPhotos } from './upload-photos';
import { DialogService } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { Theme } from '../services/theme';
import { MemberPicker } from "../members/member-picker";
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';


@autoinject()
@singleton()
export class Photos {
    filter = "";
    photos_per_line: number = 8;
    photo_size = 128;
    photo_list = [];
    photos_margin = 0;
    api;
    ea: EventAggregator;
    user;
    theme;
    dialog;
    win_width;
    win_height;
    has_grouped_photographers = false;
    has_grouped_topics = false;
    params = {
        kind: "P",
        selected_topics: [],
        selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        selected_dates_option: "dated-or-not",
        photos_date_str: "",
        photos_date_span_size: 3,
        selected_photo_list: [],
        user_id: null,
        selected_member_id: null,
        first_year: 1928,
        last_year: 2021,
        base_year: 1925,
        num_years: 100,
        max_photos_per_line: 8,
    };
    topic_list = [];
    topic_groups = [];
    photographer_list = [];
    days_since_upload_options;
    uploader_options;
    dates_options;
    i18n;
    selected_photos = new Set([]);
    router;
    options_settings;
    photographers_settings;
    caller_type;
    caller_id;
    with_a_member;
    with_a_member_text;
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;

    constructor(api: MemberGateway, user: User, dialog: DialogService, ea: EventAggregator, i18n: I18N, router: Router, theme: Theme) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
        this.with_a_member_text = this.i18n.tr('photos.search-member');
        this.router = router;
        this.ea = ea;
        this.days_since_upload_options = [
            { value: 0, name: this.i18n.tr('photos.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('photos.uploaded-today') },
            { value: 7, name: this.i18n.tr('photos.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('photos.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('photos.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('photos.uploaded-this-year') }
        ];
        this.uploader_options = [
            { value: "anyone", name: this.i18n.tr('photos.uploaded-by-anyone') },
            { value: "users", name: this.i18n.tr('photos.uploaded-by-users') },
            { value: "mine", name: this.i18n.tr('photos.uploaded-by-me') }
        ];
        this.dates_options = [
            { value: "dated-or-not", name: this.i18n.tr('photos.dated-or-not') },
            { value: "dated", name: this.i18n.tr('photos.dated') },
            { value: "undated", name: this.i18n.tr('photos.undated') }
        ];
    this.options_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        can_set_sign: true,
        can_group: true,
        empty_list_message: this.i18n.tr('photos.no-topics-yet')
    });
    this.photographers_settings = new MultiSelectSettings({
        clear_filter_after_select: true,
        can_set_sign: false,
        empty_list_message: this.i18n.tr('photos.no-photographers-yet')
    });
    }

    created(params, config) {
        this.ea.subscribe('TAGS_MERGED', () => { this.update_topic_list() });
        this.ea.subscribe('PHOTOS_WERE_UPLOADED', () => { this.update_photo_list() });
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => { this.update_topic_list() });  //for now they are linked...
        if (this.topic_list.length > 0) {
            return;
        }
        this.update_topic_list();
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
    }

    activate(params, routeConfig) {
        if (routeConfig.name == 'associate-photos') {
            this.caller_id = params.caller_id;
            this.caller_type = params.caller_type;
            let arr;
            if (params.associated_photos) {
                arr = params.associated_photos.map(i => Number(i));
            } else {
                arr = [];
            }
            this.selected_photos = new Set(arr);
            this.params.selected_photo_list = Array.from(this.selected_photos);
        }
        this.update_photo_list();
    }

    @computedFrom('user.editing')
    get user_editing() {
        this.update_topic_list();
        return this.user.editing;
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : { usage: 'P' };
        this.api.call_server('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.photographer_list = result.photographer_list;
            });
    }

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', { topic_name: new_topic_name })
            .then(() => this.update_topic_list());
    }



    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.theme.page_title = (this.caller_type) ? 'members.' + this.caller_type : "photos.photos-store";
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    update_photo_list() {
        console.time('get_photo_list');
        this.params.user_id = this.user.id;
        return this.api.call_server_post('photos/get_photo_list', this.params)
            .then(result => {
                this.photo_list = result.photo_list;
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                }
                console.timeEnd('get_photo_list');
            });
    }

    slider_changed() {
        let width = document.getElementById("photos-container").offsetWidth;
        this.photo_size = Math.floor((width - 60) / this.photos_per_line);
        if (Number(this.photos_per_line) > this.params.max_photos_per_line) {
            this.params.max_photos_per_line = Number(this.photos_per_line);
            this.update_photo_list();
        }
        this.photo_list = this.photo_list.splice(0);
    }

    private openDialog(slide) {
        //let title = this.theme.page_title;
        //this.theme.page_title = "";
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false })
            .whenClosed(response => {
                //this.theme.page_title = title;
            });
    }

    maximize_photo(slide, event) {
        if (event.ctrlKey) {
            this.toggle_selection(slide, event);
        } else {
            event.stopPropagation();
            this.openDialog(slide);
        }
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options
        this.update_photo_list();
    }

    handle_photographer_change(event) {
        this.params.selected_photographers = event.detail.selected_options;
        this.update_photo_list();
    }

    photographer_name_changed(event) {
        let p = event.detail.option;
        this.api.call_server_post('topics/rename_photographer', p);
    }

    topic_name_changed(event) {
        let t = event.detail.option;
        this.api.call_server_post('topics/rename_topic', t);
    }

    remove_topic(event) {
        let topic_id = event.detail.option.id;
        this.api.call_server_post('topics/remove_topic', { topic_id: topic_id })
            .then(() => this.update_topic_list());
    }

    add_photographer(event) {
        let new_photographer_name = event.detail.new_name;
        this.api.call_server_post('topics/add_photographer', { photographer_name: new_photographer_name, kind: 'P' });
    }

    remove_photographer(event) {
        let photographer = event.detail.option;
        this.api.call_server_post('topics/remove_photographer', { photographer: photographer });
    }

    handle_change(event) {
        this.update_photo_list();
    }

    time_range_changed(event) {
        this.params.first_year = event.detail.first_year;
        this.params.last_year = event.detail.last_year;
        this.params.base_year = event.detail.base_year;
        this.update_photo_list();
    }

    toggle_selection(photo, event) {
        if (this.selected_photos.has(photo.photo_id)) {
            this.selected_photos.delete(photo.photo_id);
            photo.selected = "";
        } else {
            this.selected_photos.add(photo.photo_id);
            photo.selected = "photo-selected";
        }
        this.params.selected_photo_list = Array.from(this.selected_photos);
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api.call_server_post('topics/save_tag_merges', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_phototgraphers_now = true;
                this.clear_selected_topics_now = true;
            });
    }

    save_topic_group(event: Event) {
        this.api.call_server_post('topics/add_topic_group', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_topics_now = true;
                this.update_topic_list();
            });
    }

    select_member(event: Event) {
        this.with_a_member = !this.with_a_member;
        if (!this.with_a_member) {
            this.params.selected_member_id = null;
            this.update_photo_list();
            this.with_a_member_text = this.i18n.tr('photos.search-member');
            return;
        }
        this.with_a_member_text = this.i18n.tr('photos.any-photo');
        this.theme.hide_title = true;
        this.dialog.open({
            viewModel: MemberPicker, model: {}, lock: false,
            rejectOnCancel: true
        }).whenClosed(response => {
            this.theme.hide_title = false;
            this.params.selected_member_id = response.output.member_id;
            this.update_photo_list()
                .then(response => {
                    //this.params.selected_member_id = null;
                });
        });

    }

    apply_to_selected() {
        this.api.call_server_post('photos/apply_to_selected_photos', this.params)
            .then(response => {
                this.clear_photo_group();
            });
    }

    private jump_to_photo(slide) {
        let photo_id = slide.photo_id;
        this.router.navigateToRoute('photo-detail', { id: photo_id, keywords: "" });
    }

    @computedFrom('user.editing', 'params.selected_photo_list', 'params.selected_topics', 'params.selected_photographers', 'params.photos_date_str', 
                  'selected_photos', 'has_grouped_photographers', 'has_grouped_topics')
    get phase() {
        if (this.caller_type == 'term' || this.caller_type == 'story')
            return 'selecting-photos-for-story'
        let result = "photos-not-editing";
        if (this.user.editing) {
            if (this.selected_photos.size > 0) {
                result = "applying-to-photos"
            } else {
                result = this.topics_action();
           }
        }
        this.options_settings.update({
            mergeable: result != "applying-to-photos" && result != "selecting-photos",
            name_editable: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_set_sign: result == "photos-ready-to-edit" || result == "applying-to-photos",
            can_delete: result == "photos-ready-to-edit",
            hide_higher_options: this.selected_photos.size > 0 && this.user.editing,
            help_topic: 'topics-help'
        });
        this.photographers_settings.update({
            mergeable: result == "can-modify-tags" || result == "ready-to-edit",
            name_editable: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            can_group: this.user.editing,
            help_topic: 'photographers-help'
        });
        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;
        for (let topic_item of this.params.selected_topics) {
            if (topic_item.first && topic_item.last) {
                if (topic_item.option.topic_kind==2) return 'photos-ready-to-edit';
                has_group_candidate = true;
            }
            if (topic_item.last && !topic_item.first) {
                n_groups += 1;
            }
        }
        if (has_group_candidate && n_groups == 1) return 'can-create-group';
        if (n_groups == 1) return 'can-merge-topics';
        if (n_groups == 0 && this.has_grouped_photographers) return 'can-merge-topics'
        return 'photos-ready-to-edit';
    }

    @computedFrom('user.editing', 'params.selected_photo_list', 'params.selected_dates_option')
    get can_set_dates() {
        return this.user.editing && this.selected_photos.size > 0
    }

    save_photo_group() {
        let photo_ids = Array.from(this.selected_photos);
        //member_ids = member_ids.map(m => Number(m));
        this.api.call_server_post('members/save_photo_group',
            { user_id: this.user.id, caller_id: this.caller_id, caller_type: this.caller_type, photo_ids: photo_ids })
            .then(response => {
                this.clear_photo_group();
                if (this.caller_type == 'story') {
                    this.router.navigateToRoute('story-detail', { id: this.caller_id, used_for: this.api.constants.story_type.STORY4EVENT });
                } if (this.caller_type == 'term') {
                    this.router.navigateToRoute('term-detail', { id: this.caller_id, used_for: this.api.constants.story_type.STORY4TERM });
                }
            });
    }

    clear_photo_group() {
        for (let photo of this.photo_list) {
            photo.selected = 0;
        }
        this.selected_photos = new Set();
    }

    upload_files() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: UploadPhotos, lock: false })
            .whenClosed(result => { this.theme.hide_title = false });
    }

    download_photos() {

    }

    delete_selected_photos() {
        this.api.call_server_post('photos/delete_selected_photos', this.params)
            .then(() => {
                this.params.selected_photo_list = [];
                this.selected_photos = new Set();
                this.update_photo_list();
            });
    }

    rotate_selected_photos() {
        this.api.call_server_post('photos/rotate_selected_photos', this.params)
            .then(() => this.update_photo_list());
    }

}
