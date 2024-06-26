import {MemberGateway} from '../services/gateway';
import {User} from "../services/user";
import {autoinject, singleton, computedFrom} from 'aurelia-framework';
import {ShowPhoto} from "../services/show-photo";
import {Uploader} from '../services/uploader';
import {DialogService} from 'aurelia-dialog';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Router} from 'aurelia-router';
import {Theme} from '../services/theme';
import {MemberPicker} from "../members/member-picker";
import {MultiSelectSettings} from '../resources/elements/multi-select/multi-select';
import {MyDate, format_date} from '../services/my-date';
import * as download from 'downloadjs';
import {set_intersection} from '../services/set_utils';
import * as toastr from 'toastr';
import {Misc} from '../services/misc';
import {debounce} from '../services/debounce';
import {Cookies} from '../services/cookies';

const
    UTO = 'upload-time-order',
    CDO = "chronological-order",
    CDOR = "chronological-order-reverse",
    ABO = "alphabetical-order";

@autoinject()
@singleton()
export class Photos {
    filter = "";
    photos_per_line: number = 8;
    _photo_size = 128;
    photo_list = [];
    total_photos = 0;
    photos_margin = 0;
    api;
    ea: EventAggregator;
    user;
    theme;
    dialog;
    cookies: Cookies;
    misc: Misc;
    win_width;
    win_height;
    has_grouped_photographers = false;
    has_grouped_topics = false;
    params = {
        kind: "P",
        editing: false,
        selected_topics: [],
        show_untagged: false,
        selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        selected_dates_option: "dated-or-not",
        selected_order_option: "random-order",
        selected_recognition: 'recognized-or-not',
        last_photo_id: null,
        last_photo_date: null,
        photos_date_str: "",
        photos_date_span_size: 1,
        photo_ids: [],
        selected_photo_list: [],
        user_id: null,
        selected_member_ids: null,
        first_year: 1928,
        last_year: 2021,
        base_year: 1925,
        num_years: 100,
        max_photos_per_line: 8,
        rotate_clockwise: false,
        recent_photo_ids: []
    };
    topic_list = [];
    no_topics_yet = false;
    topic_groups = [];
    photographer_list = [];
    no_photographers_yet = false;
    days_since_upload_options = [];
    uploader_options = [];
    dates_options = [];
    recognition_options = [];
    order_options = [];
    i18n: I18N;
    selected_photos = new Set([]);
    router: Router;
    options_settings: MultiSelectSettings;
    photographers_settings: MultiSelectSettings;
    caller_type;
    sender;
    caller_id: number;
    with_a_member = false;
    with_a_member_text = "";
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;
    anchor = -1; //for multiple selections
    can_pair_photos = false;
    got_duplicates = false;
    working = false;
    candidates = new Set();
    after_upload = false;
    editing_filters = false;
    empty = false;
    highlight_unselectors = "";
    upload_order_stops = [];
    chronological_date_stops = [];
    scroll_area;
    scroll_top = 0;
    curr_photo_id = 0;
    update_photo_list_debounced;
    photos_date_valid = "";
    selected_photo_container;
    show_photo: ShowPhoto;

    constructor(api: MemberGateway, user: User, cookies: Cookies, dialog: DialogService, ea: EventAggregator, 
                i18n: I18N, router: Router, theme: Theme, misc: Misc, show_photo: ShowPhoto) {
        this.api = api;
        this.user = user;
        this.cookies = cookies;
        this.theme = theme;
        this.show_photo = show_photo;
        this.dialog = dialog;
        this.i18n = i18n;
        this.with_a_member_text = this.i18n.tr('photos.search-member');
        this.router = router;
        this.ea = ea;
        this.misc = misc;
        this.days_since_upload_options = [
            {value: 0, name: this.i18n.tr('photos.uploaded-any-time')},
            {value: 1, name: this.i18n.tr('photos.uploaded-today')},
            {value: 7, name: this.i18n.tr('photos.uploaded-this-week')},
            {value: 30, name: this.i18n.tr('photos.uploaded-this-month')},
            {value: 91, name: this.i18n.tr('photos.uploaded-this-quarter')},
            {value: 365, name: this.i18n.tr('photos.uploaded-this-year')}
        ];
        this.uploader_options = [
            {value: "anyone", name: this.i18n.tr('photos.uploaded-by-anyone')},
            {value: "users", name: this.i18n.tr('photos.uploaded-by-users')},
            {value: "mine", name: this.i18n.tr('photos.uploaded-by-me')}
        ];
        this.dates_options = [
            {value: "dated-or-not", name: this.i18n.tr('photos.dated-or-not')},
            {value: "dated", name: this.i18n.tr('photos.dated')},
            {value: "undated", name: this.i18n.tr('photos.undated')}
        ];
        this.recognition_options = this.misc.make_selection('photos', ['recognized', 'unrecognized', 'recognized-or-not', 'recognized-not-located']);
        this.order_options = [
            {value: "random-order", name: this.i18n.tr('photos.random-order')},
            {value: UTO, name: this.i18n.tr('photos.' + UTO)},
            {value: CDOR, name: this.i18n.tr('photos.' + CDOR)},
            {value: CDO, name: this.i18n.tr('photos.' + CDO)},
            {value: ABO, name: this.i18n.tr('photos.' + ABO)}
        ];
        this.options_settings = new MultiSelectSettings({
            clear_filter_after_select: false,
            can_set_sign: true,
            can_group: true,
            hide_higher_options: this.selected_photos.size > 0 && this.user.editing,
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            show_untagged: this.user.editing
        });
        this.photographers_settings = new MultiSelectSettings({
            clear_filter_after_select: true,
            can_set_sign: false,
            can_group: false,
            empty_list_message: this.i18n.tr('photos.no-photographers-yet')
        });
        this.update_photo_list_debounced = debounce(this.update_photo_list, 1700, false);

    }

    created(params, config) {
        this.ea.subscribe('TAGS_MERGED', () => {
            this.update_topic_list()
        });
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => {
            this.update_topic_list()
        });  //for now they are linked...
        if (this.topic_list.length > 0) {
            return;
        }
        this.update_topic_list();
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
    }

    activate(params, routeConfig) {
        this.sender = params.sender;
        this.selected_photo_container = params;
        if (routeConfig && routeConfig.name == 'associate-photos') {
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
            this.photo_list = [];
        } else if (params.photo_ids) {
            this.params.photo_ids = params.photo_ids;
            this.photo_list = [];
        } else {
            this.params.photo_ids = [];
        }
        if (params.show_recent_photo_ids) {
            this.params.recent_photo_ids = this.misc.get_recent_photo_ids();
        }
        let arr = [];
        if (params.associated_photos) {
            arr = params.associated_photos.map(i => Number(i));
            this.selected_photos = new Set(arr);
            this.params.selected_photo_list = Array.from(this.selected_photos);
            this.photo_list = [];
        }

        if (params.user_id) {
            this.params.user_id = params.user_id;
            let key = params.key;
            if (!this.misc.validate(params.user_id, key)) {
                alert("Illegal entery");
                throw "Illegal entry";
            }
            this.params.selected_uploader = "mine";
            this.params.selected_order_option = UTO;
            this.photo_list = [];
            this.user.isLoggedIn = true;
            this.user.privileges.EDITOR = true;
            this.user.privileges.RESTRICTED = true;
            //this.theme.hide_menu = true;
        }
        if (this.photo_list.length == 0)
            this.update_photo_list();
    }

    deactivate() {
        this.clear_photo_group();
        this.theme.hide_menu = false;
    }

    @computedFrom('user.editing')
    get user_editing() {
        if (this.user.editing_mode_changed) {
            this.update_topic_list();
            if (this.user.privileges.RESTRICTED) {
                this.update_photo_list();
            }
        }
        return this.user.editing;
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : {usage: 'P'};
        this.api.call_server('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.photographer_list = result.photographer_list;
                this.no_topics_yet = this.topic_list.length == 0;
                this.no_photographers_yet = this.photographer_list.length == 0;
            });
    }

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', {topic_name: new_topic_name})
            .then(() => this.update_topic_list());
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.theme.page_title = (this.caller_type) ? 'photos.' + this.caller_type : "photos.photos-store";
        if (this.scroll_area)
            this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
        if (this.sender == "photo-strip") {
            this.photo_list = [];
            this.sender = null;
        }
    }

    update_photo_list() {
        this.scroll_top = 0;
        this.curr_photo_id = 0;
        let t0 = Date.now();
        if (!this.params.user_id)
            this.params.user_id = this.user.id;
        this.params.editing = this.user.editing;
        if (this.params.last_photo_id == 'END') this.params.last_photo_id = null;
        if (this.params.last_photo_date == 'END') this.params.last_photo_date = null;
        return this.api.call_server_post('photos/get_photo_list', this.params)
            .then(result => {
                this.editing_filters = false;
                this.got_duplicates = false;
                this.candidates = new Set();
                this.after_upload = false;
                this.photo_list = result.photo_list;
                this.total_photos = result.total_photos;
                this.params.last_photo_id = result.last_photo_id;
                this.params.last_photo_date = result.last_photo_date;
                this.empty = this.photo_list.length == 0;
                this.highlight_unselectors = this.empty ? "warning" : "";
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                }
                let t1 = Date.now();
                console.log("Elapsed time is ", t1 - t0);
            });
    }

    slider_changed() {
        let el = document.getElementById("photos-container");
        let width = el.offsetWidth;
        this._photo_size = Math.floor((width - 60) / this.photos_per_line);
        if (Number(this.photos_per_line) > this.params.max_photos_per_line) {
            this.params.max_photos_per_line = Number(this.photos_per_line);
            this.update_photo_list_debounced();
        }
        this.photo_list = this.photo_list.splice(0);
    }

    @computedFrom('_photo_size', 'theme.width')
    get photo_size() {
        if (!this.theme.is_desktop) {
            let ppl = Math.floor(this.theme.width / 96)
            this._photo_size = Math.floor(this.theme.width / ppl)
        }
        return this._photo_size;
    }

    maximize_photo(slide, event, index) {
        this.scroll_top = this.scroll_area.scrollTop;
        let distance_from_right = this._photo_size - event.offsetX;
        if (slide.flipable && distance_from_right <= 12) {
            this.flip_sides(slide, event);
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
            this.curr_photo_id = slide.photo_id;
            event.stopPropagation();
            let photo_ids = this.photo_list.map(photo => photo.photo_id);
            let idx = photo_ids.findIndex(pi => pi == this.curr_photo_id);
            let n = 60;
            let i0 = Math.max(0, idx - n);
            photo_ids = photo_ids.slice(i0, i0+2*n); //limit size to prevent server errors such as "invalid gateway"
            this.show_photo.show(slide, event, photo_ids); 
        }
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options
        this.params.show_untagged = event.detail.show_untagged;
        this.update_photo_list_debounced();
    }

    handle_photographer_change(event) {
        this.params.selected_photographers = event.detail.selected_options;
        this.update_photo_list_debounced();
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
        this.api.call_server_post('topics/remove_topic', {topic_id: topic_id})
            .then(() => this.update_topic_list());
    }

    add_photographer(event) {
        let new_photographer_name = event.detail.new_name;
        this.api.call_server_post('topics/add_photographer', {photographer_name: new_photographer_name, kind: 'P'})
            .then(() => {
                this.update_topic_list();
            });
    }

    remove_photographer(event) {
        let photographer = event.detail.option;
        this.api.call_server_post('topics/remove_photographer', {photographer: photographer})
            .then(() => {
                this.update_topic_list();
            });
    }

    handle_change(event) {
        if (this.params.selected_uploader != "mine" && this.user.privileges.RESTRICTED)
            this.user.editing_enabled(false);
        this.update_photo_list();
    }

    handle_order_change(event) {
        this.params.last_photo_id = null;
        this.upload_order_stops = [];
        this.params.last_photo_date = null;
        this.chronological_date_stops = [];
        this.update_photo_list();
    }

    prev_chronological_date(event) {
        this.chronological_date_stops.pop();
        if (this.chronological_date_stops.length == 0)
            [this.params.last_photo_date, this.params.last_photo_id] = [null, null]
        else {
            [this.params.last_photo_date, this.params.last_photo_id] = this.chronological_date_stops[this.chronological_date_stops.length - 1]
        }
    }

    prev(event) {
        if (this.prev_disabled) return; //don't trust disabling...
        if (this.params.selected_order_option == UTO)
            this.prev_upload_time(event)
        else if (this.params.selected_order_option.startsWith(CDO))
            this.prev_chronological_date(event)
        this.update_photo_list();
    }

    @computedFrom('upload_order_stops.length', 'chronological_date_stops.length')
    get prev_disabled() {
        if (this.params.selected_order_option == UTO)
            return this.upload_order_stops.length < 1;
        else if (this.params.selected_order_option.startsWith(CDO))
            return this.chronological_date_stops.length < 1;
    }

    prev_upload_time(event) {
        this.upload_order_stops.pop();
        if (this.upload_order_stops.length > 0)
            this.params.last_photo_id = this.upload_order_stops[this.upload_order_stops.length - 1];
        else {
            this.params.last_photo_id = null;
        }
    }

    @computedFrom('params.last_photo_id', 'params.last_photo_date')
    get next_disabled() {
        if (this.params.selected_order_option == UTO) {
            return this.params.last_photo_id == "END"
        } else if (this.params.selected_order_option.startsWith(CDO)) {
            return this.params.last_photo_date == "END"
        }
    }

    next_upload_time(event) {
        this.upload_order_stops.push(this.params.last_photo_id);
    }

    next_chronological_date(event) {
        this.chronological_date_stops.push([this.params.last_photo_date, this.params.last_photo_id]);
    }

    next(event) {
        if (this.next_disabled) return;
        if (this.params.selected_order_option == UTO)
            this.next_upload_time(event)
        else if (this.params.selected_order_option.startsWith(CDO))
            this.next_chronological_date(event)
        this.update_photo_list();
        this.scroll_top = 0;
        this.scroll_area.scrollTop = 0;
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
        this.selected_photo_container.associated_photos = this.params.selected_photo_list;
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
            this.params.selected_member_ids = null;
            this.update_photo_list();
            this.with_a_member_text = this.i18n.tr('photos.search-member');
            return;
        }
        this.with_a_member_text = this.i18n.tr('photos.any-photo');
        this.theme.hide_title = true;
        this.dialog.open({
            viewModel: MemberPicker, model: {multi: true}, lock: false,
            rejectOnCancel: false
        }).whenClosed(response => {
            this.theme.hide_title = false;
            if (response.wasCancelled) return;
            this.params.selected_member_ids = Array.from(response.output.member_ids);
            this.update_photo_list()
                .then(response => {
                    //this.params.selected_member_id = null;
                });
        });
    }

    show_all_photos() {
        this.params.photo_ids = [];
        this.update_photo_list();
    }

    apply_to_selected() {
        this.api.call_server_post('photos/apply_to_selected_photos', this.params)
            .then(response => {
                this.clear_photo_group();
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
                this.uncheck_checked_photos();
                this.clear_selected_topics_now = true;
                this.update_photo_list();
            });
    }

    uncheck_checked_photos() {
        this.params.selected_photo_list = [];
        this.selected_photos = new Set();
        for (let photo of this.photo_list) {
            photo.checked = false;
        }
    }

    private jump_to_photo(slide) {
        this.curr_photo_id = slide.photo_id;
        this.scroll_top = this.scroll_area.scrollTop;
        this.router.navigateToRoute('photo-detail', {id: this.curr_photo_id, keywords: ""});
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
            mergeable: result != "applying-to-photos",
            name_editable: result == "photos-ready-to-edit",
            can_add: this.user.editing, //result == "photos-ready-to-edit",
            can_set_sign: result == "photos-ready-to-edit" || result == "applying-to-photos",
            can_delete: result == "photos-ready-to-edit",
            hide_higher_options: this.selected_photos.size > 0 && this.user.editing,
            show_untagged: this.user.editing,
            help_topic: 'topics-help'
        });
        this.photographers_settings.update({
            mergeable: result == "can-modify-tags" || result == "ready-to-edit",
            name_editable: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            can_group: false,
            start_open: true,
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

    set_slideshow_topics(event) {
        event.stopPropagation();
        let x = JSON.stringify(this.params.selected_topics);
        this.cookies.put('SLIDESHOW-TOPICS', x);
        let msg = this.i18n.tr('photos.slideshow-topics-saved');
        toastr.success(msg);
    }

    @computedFrom('user.editing', 'params.selected_photo_list', 'params.selected_dates_option')
    get can_set_dates() {
        return this.user.editing && this.selected_photos.size > 0
    }

    save_photo_group() {
        let photo_ids = Array.from(this.selected_photos);
        //member_ids = member_ids.map(m => Number(m));
        let caller_type = this.caller_type;
        this.caller_type = '';
        this.api.call_server_post('members/save_photo_group',
            {user_id: this.user.id, caller_id: this.caller_id, caller_type: caller_type, photo_ids: photo_ids})
            .then(response => {
                this.clear_photo_group();
                if (caller_type == 'story') {
                    this.router.navigateToRoute('story-detail', {
                        id: this.caller_id,
                        used_for: this.api.constants.story_type.STORY4EVENT
                    });
                }
                if (caller_type == 'term') {
                    this.router.navigateToRoute('term-detail', {
                        id: this.caller_id,
                        used_for: this.api.constants.story_type.STORY4TERM
                    });
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
        let dlg;
        dlg = this.dialog.open({
            viewModel: Uploader,
            model: {
                endpoint: 'photos/upload_chunk',
                object_names: 'photos.photos',
                header_str: 'photos.upload-photos'
            }, lock: true
        })
        dlg.whenClosed(result => {
            this.get_uploaded_info({duplicates: result.output.duplicates, uploaded: result.output.uploaded});
            this.theme.hide_title = false;
        });
    }

    download_photos() {
        this.api.call_server_post('photos/download_files', this.params)
            .then(response => {
                let download_url = response.download_url;
                download(download_url);
                for (let photo of this.photo_list) {
                    if (this.selected_photos.has(photo.photo_id)) {
                        photo.selected = "";
                    }
                }
                this.selected_photos = new Set();
            });
    }

    delete_selected_photos() {
        this.api.call_server_post('photos/delete_selected_photos', this.params)
            .then(() => {
                this.photo_list = this.photo_list.filter(photo => !this.selected_photos.has(photo.photo_id));
                this.params.selected_photo_list = [];
                this.selected_photos = new Set();
            });
    }

    rotate_selected_photos(event) {
        this.params.rotate_clockwise = event.ctrlKey;
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
                front_photo['back'] = {
                    square_src: back_photo.square_src,
                    photo_id: back_photo.photo_id,
                    src: back_photo.src,
                    width: back_photo.width,
                    height: back_photo.height
                };
                let idx = this.photo_list.findIndex(item => item.photo_id == back_id);
                this.photo_list.splice(idx, 1)
                this.clear_photo_group();
            })
    }

    flip_sides(photo, event) {
        photo.side = (photo.side == 'front') ? 'back' : 'front';
        if (this.user.editing) {
            this.api.call_server_post('photos/flip_photo', {
                front_id: photo.front.photo_id,
                back_id: photo.back.photo_id,
                to_unpair: event.ctrlKey
            })
                .then(response => {
                    if (response.to_unpair) {
                        this.update_photo_list();
                    }
                })
        }
    }

    photo_info_title(photo) {
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
            <li>id:&nbsp;${photo.photo_id}</li>
            <li>${pn}:&nbsp;${photographer_name}</li>
            <li>${vdr}:&nbsp;${date_range}</li>
            <li>${kw_label}:&nbsp;${keywords}</li>
        </ul>
        `
        return content;
    }

    async find_duplicates(event) {
        let selected_photos = Array.from(this.selected_photos);
        this.working = true
        let lst = (selected_photos.length > 0) ? selected_photos : null;
        if (event.altKey && lst.length == 2) {  //force marking as duplicates when the algorithm does not work
            await this.api.call_server_post('photos/mark_duplicates', {selected_photos: lst});
        }
        this.api.call_server_post('photos/find_duplicates', {selected_photos: lst})
            .then(result => {
                this.working = false
                this.got_duplicates = result.got_duplicates;
                if (!this.got_duplicates) {
                    toastr.success("<p dir='rtl'>" + this.i18n.tr('photos.no-duplicates-found') + "</p>", '', 10000);
                    return this.update_photo_list();
                }
                this.photo_list = result.photo_list;
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                    this.candidates = new Set(result.candidates);
                }
            });
    }

    get_uploaded_info(photo_lists) {
        this.api.call_server_post('photos/get_uploaded_info', photo_lists)
            .then(result => {
                this.after_upload = true;
                this.got_duplicates = result.got_duplicates;
                this.photo_list = result.photo_list;
                this.candidates = new Set(result.candidates);
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                }
            });
    }

    select_new_copies() {
        this.selected_photos = this.candidates;
        for (let photo of this.photo_list) {
            if (this.selected_photos.has(photo.photo_id)) {
                photo.selected = 'photo-selected'
            }
        }
    }

    replace_duplicate_photos() {
        let selected_photo_list = Array.from(this.selected_photos);
        this.working = true;
        this.api.call_server_post('photos/replace_duplicate_photos', {photos_to_keep: selected_photo_list})
            .then(result => {
                this.working = false;
                for (let photo of this.photo_list) {
                    photo.selected = "";
                }
                this.selected_photos = new Set();
                let photo_patches = result.photo_patches;
                for (let patch of photo_patches) {
                    if (!patch) continue;
                    let new_photo = this.photo_list.find(photo => photo.photo_id == patch.photo_to_delete)
                    let patch_target = this.photo_list.find(photo => photo.photo_id == patch.photo_to_patch);
                    let patch_target_idx = this.photo_list.findIndex(photo => photo.photo_id == patch.photo_to_patch);
                    if (patch_target) {
                        for (let property of Object.keys(patch.data)) {
                            patch_target[property] = patch.data[property]
                        }
                        patch_target.front.src = new_photo.front.src
                        patch_target.front.square_src = new_photo.front.square_src;
                        patch_target.status = 'regular';
                        patch_target.front.width = new_photo.front.width
                        patch_target.front.height = new_photo.front.height;
                    }
                    let idx = this.photo_list.findIndex(photo => photo.photo_id == patch.photo_to_delete);
                    if (idx >= 0) {
                        this.photo_list.splice(idx, 1);
                    }
                }
                let dups = this.photo_list.filter(p => p.status == 'similar');
                let uni = this.photo_list.filter(p => p.status != 'similar');
                this.photo_list = dups.concat(uni);
                this.photo_list = this.photo_list.splice(0);
            })
    }

    show_filters_only() {
        this.editing_filters = true;
    }

    exclude_from_main_slideshow(event) {
        let selected_photos = Array.from(this.selected_photos);
        let exclude = ! event.ctrlKey;
        this.api.call_server_post('photos/exclude_from_main_slideshow', {selected_photos: selected_photos, exclude: exclude});
    }

    css_height() {
        if (!this.theme.is_desktop) return '';
        return `height: ${this.win_height - 323}px;`;
    }

    @computedFrom('photos_date_valid')
    get incomplete() {
        if (this.photos_date_valid != 'valid')
            return "disabled"
        return ''
    }

    @computedFrom('params.selected_topics.length', 'params.selected_photographers.length', 'params.photos_date_str', 'photos_date_valid')
    get apply_disabled() {
        let x = this.params.selected_topics.length == 0 && this.params.selected_photographers.length != 1 && this.params.photos_date_str == '';
        if (this.photos_date_valid != 'valid') x = true;
        return x;
    }

    @computedFrom('with_a_member')
    get search_member_str() {
        if (this.with_a_member) 
            return 'photos.show-all-photos'
        return 'photos.search-member'
    }

    toggle_edit_mode() {
        this.user.editing = ! this.user.editing;
    }

}
