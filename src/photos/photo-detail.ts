import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';
import { highlight } from '../services/dom_utils';
import { debounce } from '../services/debounce';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { EventAggregator } from 'aurelia-event-aggregator';
 
@autoinject()
export class PhotoDetail {
    api;
    user;
    i18n;
    members;
    photos;
    curr_photo;
    source;
    photo_id;
    true_photo_id;
    photo_src;
    photo_name;
    photo_story;
    photo_date_str;
    photo_date_datespan;
    orig_photo_width = 0;
    orig_photo_height = 0;
    photo_width = 600;
    photo_margin = 0;
    MAX_WIDTH = 600;  //todo: use dynamic info about the screen?
    MAX_HEIGHT = 550;
    dialog;
    router;
    keywords;
    advanced_search;
    highlight_on = "highlight-on";
    photographer_name = '';
    photographer_id = null;
    chatroom_id = null;
    options_settings: MultiSelectSettings;
    photographers_settings: MultiSelectSettings;
    topic_list = [];
    photographer_list = [];
    no_topics_yet = false;
    no_photographers_yet = false;
    topic_groups = [];
    photo_topics;
    params = {
        selected_topics: [],
        selected_photographers: [],
        photo_ids: []
    };
    photo_id_rec = {photo_id: 0};
    photo_ids = [];
    what = '';
    can_go_forward = false;
    can_go_backward = false;
    //------------------google maps data----------------
    has_location = false;
    longitude = null;
    latitude = null;
    zoom = 12;
    tracked_zoom: number = 0;
    longitude_distance = 0;
    map_visible = false;
    visibility_changed = false;
    markers = [];
    map_zoom_stops = [
        176.32497445272955,
        148.8754982449835,
        95.38534383424921,
        51.15962888165051,
        26.011174973799804,
        13.058516541061568,
        6.535832712495857,
        3.2687367661950795,
        1.6344708899971288,
        0.8172482569694353,
        0.4086257299375582,
        0.20431306514901948,
        0.10215655759700581,
        0.05107828192631203,
        0.025539141354123274,
        0.012769570725943424,
        0.006384785369075274,
        0.003192392685303247,
        0.0015961963427422177,
        0.0007980981713835433,
        0.00039904908570420616,
        0.00019952454285032672,
        0.00009976227141450522,
        0.000049881135698370827
    ];
    update_photo_location_debounced;
    undo_list = [];
    curr_info = {
        photo_date_str: "",
        photo_date_datespan: 0,
        photo_topics: [],
        photographer_id: 0,
        photographer_name: ""
    }
    photo_date_valid = '';
    ea: EventAggregator;
    sub1;

    constructor(api: MemberGateway, i18n: I18N, user: User, dialog: DialogService, router: Router, ea: EventAggregator) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.dialog = dialog;
        this.router = router;
        this.ea = ea;
        this.options_settings = new MultiSelectSettings
            ({
                hide_higher_options: true,
                clear_filter_after_select: false,
                can_set_sign: false,
                can_add: true,
                can_group: false,
                empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            });
        this.photographers_settings = new MultiSelectSettings({
            clear_filter_after_select: true,
            can_add: true,
            can_set_sign: false,
            can_group: false,
            single: true,
            empty_list_message: this.i18n.tr('photos.no-photographers-yet')
        });
        this.update_photo_location_debounced = debounce(this.update_photo_location, 1500, false);
    }

    async activate(params, config) {
        this.keywords = params.keywords;
        this.photo_ids = params.photo_ids;
        this.advanced_search = params.search_type == 'advanced';
        this.what = params.what ? params.what : "";
        await this.update_topic_list();
        await this.get_photo_info(params.id);
        if (params.pop_full_photo) {
            this.open_full_size_photo()
        }
    }

    attached() {
        this.sub1 = this.ea.subscribe('PHOTO_WAS_ROTATED', msg => {
            if (msg.photo_id == this.photo_id) {
                this.get_photo_info(this.photo_id);
            }
        });
    }

    detached() {
        this.sub1.dispose();
    }

    set_story(story) {
        this.photo_story = "";
        this.photo_story = story;
    }

    get_photo_info(photo_id) {
        return this.api.getPhotoDetail({ photo_id: photo_id, what: this.what })
            .then(response => {
                this.visibility_changed = true;
                this.photo_id = photo_id;
                this.photo_id_rec.photo_id = photo_id;
                this.photo_src = response.photo_src;
                this.set_story(response.photo_story)
                this.photo_name = this.photo_story.name || response.photo_name;
                this.photographer_name = response.photographer_name;
                this.photographer_id = response.photographer_id;
                this.photo_topics = response.photo_topics;
                this.init_selected_topics();
                this.init_photographer();
                this.true_photo_id = response.photo_id; //this.photo_id may be associated story id
                if (this.photo_story.story_id == 'new') {
                    this.photo_story.name = this.i18n.tr('photos.new-story');
                    this.photo_story.story_text = this.i18n.tr('photos.new-story-content');
                }
                this.photo_date_str = response.photo_date_str;
                this.photo_date_datespan = response.photo_date_datespan;
                this.orig_photo_width = response.width;
                this.orig_photo_height = response.height;
                this.chatroom_id = response.chatroom_id;
                this.has_location = response.longitude;
                this.latitude = response.latitude || +31.772;
                this.longitude = response.longitude || 35.217;
                this.zoom = response.zoom || 12;
                if (this.has_location) {
                    this.markers = [{ latitude: this.latitude, longitude: this.longitude }];
                } else {
                    this.markers = [];
                }
                this.calc_photo_width();
                this.curr_info = {
                    photographer_id: this.photographer_id,
                    photographer_name: this.photographer_name,
                    photo_topics: this.photo_topics.slice(0),
                    photo_date_str: this.photo_date_str.slice(0),
                    photo_date_datespan: this.photo_date_datespan
                }
            });
    }

    init_selected_topics() {
        this.params.selected_topics = [];
        let i = 0;
        for (let opt of this.photo_topics) {
            opt.sign = '';
            let itm = { option: opt, first: i == 0, last: i == this.photo_topics.length - 1, group_number: i + 1 }
            this.params.selected_topics.push(itm);
            i += 1;
        }
    }

    init_photographer() {
        this.params.selected_photographers = [];
        if (this.photographer_id) {
            let itm = { option: { id: this.photographer_id, name: this.photographer_name } };
            this.params.selected_photographers.push(itm)
        }
    }

    @computedFrom('photo_topics')
    get topic_names() {
        if (!this.photo_topics) return "";
        let topic_name_list = this.photo_topics.map(itm => itm.name);
        return topic_name_list.join(';');
    }

    async calc_photo_width() {
        let pw = this.orig_photo_width / this.MAX_WIDTH;
        let ph = this.orig_photo_height / this.MAX_HEIGHT;
        if (pw >= ph) {
            this.photo_width = this.MAX_WIDTH;
        } else {
            this.photo_width = this.orig_photo_width / ph;
        }
        let el;
        for (let i = 0; i < 150; i++) {
            el = document.getElementById('photo-box');
            if (el) break;
            await sleep(20);
        }
        let width;
        if (el) {
            width = el.clientWidth;
        }
        else {
            width = 1200;
            console.log("el was not defined...");
        }
        el.style.paddingRight = `${width - this.photo_width - 15}px`;
    }

    update_photo_caption(event) {
        this.api.call_server_post('photos/update_photo_caption', { caption: this.photo_name, photo_id: this.photo_id })
            .then(() => { alert('changed') });
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options
        let topics = this.params.selected_topics.map(top => top.option);
        this.photo_topics = topics;
        this.undo_list.push({ what: 'topics', photo_topics: this.curr_info.photo_topics });
        this.curr_info.photo_topics = topics.slice(0);
        this.api.call_server_post('photos/apply_topics_to_photo', { photo_id: this.true_photo_id, topics: this.photo_topics });
    }

    handle_photographer_change(event) {
        this.params.selected_photographers = event.detail.selected_options;
        if (this.params.selected_photographers.length == 1) {
            this.photographer_name = this.params.selected_photographers[0].option.name;
            this.photographer_id = this.params.selected_photographers[0].option.id;
        } else {
            this.photographer_name = '';
            this.photographer_id = null;
        }
        this.undo_list.push({ what: 'photographer', 'photographer': {id: this.curr_info.photographer_id, name: this.curr_info.photographer_name} });
        this.curr_info.photographer_id = this.photographer_id;
        this.curr_info.photographer_name = this.photographer_name.slice(0);
        this.api.call_server_post('photos/assign_photo_photographer', { photo_id: this.true_photo_id, photographer_id: this.photographer_id });
    }

    update_photo_date(customEvent) {
        customEvent.stopPropagation();
        if (this.photo_date_valid != 'valid') return;
        let event = customEvent.detail;
        let s = typeof event;
        this.undo_list.push({ what: 'photo-date', photo_date: { photo_date_str: this.curr_info.photo_date_str, photo_date_datespan: this.curr_info.photo_date_datespan } });
        this.curr_info.photo_date_str = this.photo_date_str.slice(0);
        this.curr_info.photo_date_datespan = this.photo_date_datespan;
        this.api.call_server_post('photos/update_photo_date', { photo_date_str: event.date_str, photo_date_datespan: event.date_span, photo_id: this.photo_id });
    }

    undo() {
        let command = this.undo_list.pop();
        switch (command.what) {
            case "photographer": 
                this.curr_info.photographer_id = this.photographer_id = command.photographer.id;
                this.curr_info.photographer_name = this.photographer_name = command.photographer.name;
                this.init_photographer();
                this.api.call_server_post('photos/assign_photo_photographer', { photo_id: this.true_photo_id, photographer_id: this.photographer_id });
                break;
            case "topics": 
                this.photo_topics = command.photo_topics.slice(0);
                this.curr_info.photo_topics = this.photo_topics.slice(0);
                this.init_selected_topics();
                this.api.call_server_post('photos/apply_topics_to_photo', { photo_id: this.true_photo_id, topics: this.photo_topics });
                break;
            case "photo-date": 
                this.curr_info.photo_date_str = this.photo_date_str = command.photo_date.photo_date_str;
                this.photo_date_datespan = command.photo_date.photo_date_datespan;
                this.api.call_server_post('photos/update_photo_date', { photo_date_str: this.photo_date_str, photo_date_datespan: this.photo_date_datespan, photo_id: this.photo_id });
                break;
        }
    }

    private openDialog(slide, slide_list) {
        document.body.classList.add('black-overlay');
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide, slide_list: slide_list, list_of_ids: true, photo_id_rec: this.photo_id_rec }, lock: false })
            .whenClosed(response => {
                this.get_photo_info(this.photo_id_rec.photo_id);
                document.body.classList.remove('black-overlay');
            });
    }

    open_full_size_photo() {
        let slide = {
            side: 'front',
            front: {
                src: this.photo_src,
                width: this.orig_photo_width,
                height: this.orig_photo_height,
                photo_id: this.true_photo_id
            },
            name: this.photo_name,
            photo_id: this.true_photo_id
        };
        this.openDialog(slide, this.photo_ids);
    }

    go_back() {
        this.router.navigateBack();
    }

    @computedFrom('photo_story.story_text', 'story_changed', 'keywords', 'advanced_search')
    get highlightedHtml() {
        if (!this.photo_story) {
            return "";
        }
        let highlighted_html = highlight(this.photo_story.story_text, this.keywords, this.advanced_search);
        return highlighted_html;
    }

    toggle_highlight_on() {
        if (this.highlight_on) {
            this.highlight_on = ""
        } else {
            this.highlight_on = "highlight-on"
        }
        document.getElementById("word-highlighter").blur();
    }

    create_chatroom() {
        this.api.call_server_post('chats/add_chatroom', { story_id: this.photo_story.story_id, new_chatroom_name: this.i18n.tr('user.chats') })
            .then((data) => {
                this.chatroom_id = data.chatroom_id;
            });
    }

    chatroom_deleted(event) {
        this.api.call_server_post('chats/chatroom_deleted', { story_id: this.photo_story.story_id });
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

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', { topic_name: new_topic_name })
            .then(() => this.update_topic_list());
    }

    slide_idx() {
        return this.photo_ids.findIndex(pid => pid == this.photo_id);
    }

    public has_next(step) {
        let idx = this.slide_idx();
        return 0 <= (idx + step) && (idx + step) < this.photo_ids.length;
    }

    @computedFrom('photo_id')
    get prev_class() {
        if (this.has_next(-1)) return '';
        return 'disabled'
    }

    @computedFrom('photo_id')
    get next_class() {
        if (this.has_next(+1)) return '';
        return 'disabled'
    }
    get_slide_by_idx(idx) {
        let pid = this.photo_ids[idx];
        this.get_photo_info(pid);
    }

    public go_next(event) {
        event.stopPropagation();
        this.map_visible = false;
        let idx = this.slide_idx();
        if (idx + 1 < this.photo_ids.length) {
            this.get_slide_by_idx(idx + 1);
            this.can_go_forward = idx + 2 < this.photo_ids.length;
            this.can_go_backward = true;
        }
    }

    public go_prev(event) {
        event.stopPropagation();
        this.map_visible = false;
        let idx = this.slide_idx();
        if (idx > 0) {
            this.get_slide_by_idx(idx - 1)
            this.can_go_forward = true;
            this.can_go_backward = idx > 1;
        }
    }

    async expose_map() {
        this.map_visible = !this.map_visible;
        this.visibility_changed = true;
        if (! this.map_visible) return;

        if (this.has_location) {
            let old_zoom = this.zoom || 8;  //some black magic for buggy behaviour of the component - it changes to extreme zoom 
            await sleep(50);
            this.zoom = old_zoom + 1;
            await sleep(50);
            this.zoom = old_zoom;
            await sleep(50);
        } else {
            this.zoom = 8;
        }
    }

    bounds_changed(event) {
        if (this.visibility_changed) {
            this.visibility_changed = false;
        }
        if (! this.map_visible) return;
        let x = event.detail.bounds.Za;
        if (!x) return;
        let longitude_distance = x.j - x.i;
        if (longitude_distance < 0.00000001) return;
        this.tracked_zoom = this.calc_tracked_zoom(longitude_distance);
        if (! this.tracked_zoom) return;
        this.zoom = this.tracked_zoom;
        this.update_photo_location_debounced();
    }

    calc_tracked_zoom(longitude_distance) {
        let zoom = 0;
        for (let dist of this.map_zoom_stops) {
            if (dist <= longitude_distance) {
                if (longitude_distance / dist > 1.2)
                    zoom -= 1;
                return zoom
            }
            else zoom += 1;
        }
        return 24;
    }

    async create_marker(event) {
        event.stopPropagation();
        if (!this.user.editing) return;
        let tracked_zoom = this.tracked_zoom;
        this.zoom = tracked_zoom - 1;
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.markers = [{ latitude: this.latitude, longitude: this.longitude }];
        //for some reason, the above changes zoom to an extremely high value
        await sleep(400);
        this.zoom = tracked_zoom;
        await sleep(400);
        this.update_photo_location_debounced();
        return false;
    }

    update_photo_location() {
        if (! this.user.editing) return;
        this.api.call_server_post('photos/update_photo_location', { photo_id: this.photo_id, longitude: this.longitude, latitude: this.latitude, zoom: this.tracked_zoom });
    }

    @computedFrom("map_visible")
    get view_hide_map() {
        let txt = 'photos.' + (this.map_visible ? 'hide-map' : 'view-map')
        return this.i18n.tr(txt)
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
