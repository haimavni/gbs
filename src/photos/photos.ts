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
import { MyDate, format_date } from '../services/my-date';

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
    days_since_upload_options = [];
    uploader_options = [];
    dates_options = [];
    i18n: I18N;
    selected_photos = new Set([]);
    router: Router;
    options_settings: MultiSelectSettings;
    photographers_settings;
    caller_type;
    caller_id: number;
    with_a_member = false;
    with_a_member_text = "";
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;
    anchor = -1; //for multiple selections
    download_url = "";
    can_pair_photos = false;

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

    maximize_photo(slide, event, index) {
        let distance_from_right = this.photo_size - event.offsetX;
        if (slide.flipable && distance_from_right <= 12) {
            this.flip_sides(slide);
            return;
        }
        if (this.anchor < 0) this.anchor = index;
        if (event.ctrlKey) {
            this.toggle_selection(slide);
        } else if (event.altKey) {
            this.selected_photos = new Set();
            if (slide.selected)
                this.selected_photos.add(slide.photo_id);
            for (let photo of this.photo_list) {
                if (photo.photo_id != slide.photo_id)
                    photo.selected = "";
            }
            this.params.selected_photo_list = Array.from(this.selected_photos);
        } else if (event.shiftKey) {
            //
            this.toggle_selection(slide);
            let checked = slide.photo_selected != "";
            let i0, i1;
            if (this.anchor < index) {
                i0 = this.anchor;
                i1 = index;
            } else {
                i0 = index;
                i1 = this.anchor;
            }
            for (let i = i0; i < i1; i++) {
                let photo = this.photo_list[i];
                if (photo) {
                    photo.selected = checked ? "photo-selected" : "";
                    if (checked) {
                        this.selected_photos.add(photo.photo_id)
                    } else {
                        this.selected_photos.delete(photo.photo_id)
                    }
                } else {
                    console.log("no itm. i is: ", i);
                }
            }
            this.params.selected_photo_list = Array.from(this.selected_photos);
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

    toggle_selection(photo) {
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
        this.can_pair_photos = this.user.editing && this.selected_photos.size == 2;
        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;
        for (let topic_item of this.params.selected_topics) {
            if (topic_item.first && topic_item.last) {
                if (topic_item.option.topic_kind == 2) return 'photos-ready-to-edit';
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
        this.params.selected_photo_list = [];
    }

    upload_files() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: UploadPhotos, lock: false })
            .whenClosed(result => { this.theme.hide_title = false });
    }

    download_photos() {
        this.api.call_server_post('photos/download_files', this.params)
            .then(response => {
                this.download_url = response.download_url;
                setTimeout(() => {
                    this.download_url = "";
                    this.clear_photo_group();
                }, 7000);
            });
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

    pair_selected_photos() {
        this.api.call_server_post('photos/pair_selected_photos', this.params)
            .then(response => {
                let front_id = response.front_id;
                let back_id = response.back_id;
                let front_photo = this.photo_list.find(item => item.photo_id == front_id);
                front_photo.flipable = 'flipable';
                let back_photo = this.photo_list.find(item => item.photo_id == back_id);
                front_photo['back'] = {square_src: back_photo.square_src, photo_id: back_photo.photo_id, src: back_photo.src};
                let idx = this.photo_list.findIndex(item => item.photo_id == back_id);
                this.photo_list.splice(idx, 1)
                this.clear_photo_group();
            })
    }

    flip_sides(photo) {
        photo.side = (photo.side == 'front') ? 'back' : 'front';
        if (this.user.editing) {
            this.api.call_server_post('photos/flip_photo', {front_id: photo.front.photo_id, back_id: photo.back.photo_id})
        }
    }
    
    photo_info_title(photo) {
        console.log("yoptfoyamat")
        let title = `<h3>${photo.name}</h3>`
        return title;
    }

    photo_info_content(photo) {
        let photographer = this.photographer_list.find(p => p.id == photo.photographer_id);
        let photographer_name = photographer ? photographer.name : this.i18n.tr('photos.unknown-photographer');
        let pn = this.i18n.tr('photos.photographer-name');
        let vdr = this.i18n.tr('photos.photo-date-range');
        let date_range = format_date(photo.photo_date_datestr, photo.photo_date_datespan);
        let keywords = photo.keywords ? photo.keywords : "";
        let kw_label = this.i18n.tr('photos.keywords')
        let content = `
        <ul>
            <li>${pn}:&nbsp;${photographer_name}</li>
            <li>${vdr}:&nbsp;${date_range}</li>
            <li>${kw_label}:&nbsp;${keywords}</li>
        </ul>
        `
        return content;
    }


}
