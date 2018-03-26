import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { FullSizePhoto } from './full-size-photo';
import { UploadPhotos } from './upload-photos';
import { DialogService } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import default_multi_select_options from '../resources/elements/multi-select';
import { Theme } from '../services/theme';

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
    params = {
        selected_topics: [],
        grouped_selected_topics: [],
        selected_photographers: [],
        grouped_selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        selected_dates_option: "dated-or-not",
        photos_date_str: "",
        photos_date_span_size: 3,
        selected_photo_list: [],
        user_id: null,
        first_year: 1928,
        last_year: 2021,
        base_year: 1925,
        num_years: 100,
        max_photos_per_line: 8
    };
    topic_list = [];
    photographer_list = [];
    days_since_upload_options;
    uploader_options;
    dates_options;
    i18n;
    selected_photos = new Set([]);
    done_selecting = false;
    router;
    options_settings = default_multi_select_options;
    photographers_settings = default_multi_select_options;
    caller_type;
    caller_id;
    
    constructor(api: MemberGateway, user: User, dialog: DialogService, ea: EventAggregator, i18n: I18N, router: Router, theme: Theme) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
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
    }

    created(params, config) {
        this.ea.subscribe('TAGS_MERGED', () => { this.update_topic_list() });
        this.ea.subscribe('PHOTOS_WERE_UPLOADED', () => {this.update_photo_list()});
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => {this.update_topic_list()});  //for now they are linked...
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

    update_topic_list() {
        this.api.call_server('members/get_topic_list', { usage: 'P' })
            .then(result => {
                this.topic_list = result.topic_list;
                this.photographer_list = result.photographer_list;
            });
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
        return this.api.call_server_post('members/get_photo_list', this.params)
            .then(result => {
                this.photo_list = result.photo_list;
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                }
                if (this.photo_list) {
                    console.log(this.photo_list.length + " photos");
                } else {
                    console.log("no photos found");
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
            this.toggle_selection(slide);
        } else {
            this.openDialog(slide);
        }
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_topics = event.detail.grouped_selected_options;
        this.update_photo_list();
    }

    handle_photographer_change(event) {
        if (event.detail.string_value) {
            this.add_photographer(event.detail.string_value)
        } else {
            this.params.selected_photographers = event.detail.ungrouped_selected_options;
            this.params.grouped_selected_photographers = event.detail.grouped_selected_options;
            this.update_photo_list();
        }
    }

    add_photographer(new_photographer_name) {
        this.api.call_server_post('members/add_photographer', {photographer_name: new_photographer_name});
    }

    handle_change(event) {
        this.update_photo_list();
    }

    time_range_changed(event) {
        this.params.first_year = event.detail.first_year;
        this.params.last_year = event.detail.last_year;
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
        this.api.call_server_post('members/save_tag_merges', this.params)
            .then(response => {
                this.params.grouped_selected_topics = [];
                //this.options_settings.clear_selections_now = true;
            });
    }

    apply_to_selected() {
        this.done_selecting = false;
        this.api.call_server_post('members/apply_to_selected_photos', this.params)
            .then(response => {
                this.clear_photo_group();
            });
    }

    private jump_to_photo(slide) {
        let photo_id = slide.photo_id;
        this.router.navigateToRoute('photo-detail', { id: photo_id });
    }

    finish_selecting() {
        this.done_selecting = true;
    }

    @computedFrom('user.editing', 'params.selected_photo_list', 'done_selecting', 'params.grouped_selected_topics', 'params.grouped_selected_photographers',
        'params.selected_topics', 'params.selected_photographers', 'params.photos_date_str', 'selected_photos')
    get phase() {
        let result = "not-editing";
        if (this.user.editing) {
            if (this.selected_photos.size > 0) {
                if (this.done_selecting) {
                    result = "applying-to-photos"
                } else {
                    result = "selecting-photos";
                }
            } else {
                this.done_selecting = false;
                if (this.params.grouped_selected_topics.length > 0 || 
                    this.params.grouped_selected_photographers.length > 0) {
                    result = "can-modify-tags";
                } else {
                    result = "ready-to-edit"
                }
            }
        }
        this.options_settings = Object.assign({}, default_multi_select_options, {
            clear_filter_after_select: false,
            mergeable: result != "applying-to-photos" && result != "selecting-photos",
            name_editable: result == "ready-to-edit",
            can_set_sign: result == "ready-to-edit",
            can_add: result == "ready-to-edit",
            can_delete: result == "ready-to-edit",
            clear_selections_now: false
        });
        this.photographers_settings = Object.assign({}, default_multi_select_options, {
            clear_filter_after_select: true,
            mergeable: result == "can-modify-tags" || result == "ready-to-edit",
            name_editable: result == "ready-to-edit",
            can_set_sign: false,
            can_add: result == "ready-to-edit",
            can_delete: result == "ready-to-edit",
            clear_selections_now: false
        });
        return result;
    }

    @computedFrom('user.editing', 'params.selected_photo_list', 'params.selected_dates_option')
    get can_set_dates() {
        return this.user.editing && this.selected_photos.size > 0 && this.params.selected_dates_option == 'undated'
    }

    save_photo_group() {
        let photo_ids = Array.from(this.selected_photos);
        //member_ids = member_ids.map(m => Number(m));
        this.api.call_server_post('members/save_photo_group',
            { user_id: this.user.id, caller_id: this.caller_id, caller_type: this.caller_type, photo_ids: photo_ids })
            .then(response => {
                this.clear_photo_group();
                history.back();
            });
    }

    clear_photo_group() {
        for (let photo of this.photo_list) {
            photo.selected = 0;
        }
        this.selected_photos = new Set();
    }

    upload_files() {
        this.dialog.open({ viewModel: UploadPhotos, lock: false });
    }


}