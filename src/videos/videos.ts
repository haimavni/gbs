import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { AddVideo } from './add-video';
import { EventAggregator } from 'aurelia-event-aggregator';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';

@autoinject
@singleton()
export class Videos {
    filter = "";
    video_list = [];
    api;
    user;
    theme;
    i18n;
    router;
    scroll_area;
    scroll_top = 0;
    dialog;
    ea;
    first_index = 0;
    videos_per_page = 9;
    photographer_list = [];
    topic_list = [];
    selected_videos = new Set();
    has_grouped_photographers = false;
    has_grouped_topics = false;
    params = {
        kind: "V",
        selected_topics: [],
        selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        selected_dates_option: "dated-or-not",
        photos_date_str: "",
        photos_date_span_size: 3,
        selected_video_list: [],
        user_id: null,
    };
    options_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        can_group: true
    });
    photographers_settings = new MultiSelectSettings({
        clear_filter_after_select: true,
        can_set_sign: false
    });
    length_keeper = {
        len:  0
    }
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router, dialog: DialogService, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.dialog = dialog;
        this.ea = ea;
        this.api.call_server_post('members/get_video_list', this.params)
            .then(response => this.set_video_list(response.video_list));
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "videos.video-clips";
    }

    created(params, config) {
        this.ea.subscribe('NEW-VIDEO', msg => {
            this.add_video(msg.new_video_rec)
        });
        this.update_topic_list();
        this.ea.subscribe('TAGS_MERGED', () => { this.update_topic_list() });
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => { this.update_topic_list() });  //for now topics and photogaphers are handled together...
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    update_topic_list() {
        let usage = this.user.editing ?  {} : {usage: 'V'};
        this.api.call_server('members/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.photographer_list = result.photographer_list;
            });
    }

    new_video() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: AddVideo, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
        });
    }

    add_video(new_video_rec) {
        new_video_rec = this.video_data(new_video_rec);
        this.video_list.push(new_video_rec);
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v => this.video_data(v));
        this.length_keeper.len = this.video_list.length;
    }

    video_data(video_rec) {
        switch (video_rec.video_type) {
            case 'youtube':
                video_rec.src = "//www.youtube.com/embed/" + video_rec.src + "?wmode=opaque";
                break;
            case 'vimeo':
                //use the sample below 
                // <iframe src="https://player.vimeo.com/video/38324835" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
                // <p><a href="https://vimeo.com/38324835">צבעונים ונוריות בשמורת הבונים</a> from <a href="https://vimeo.com/user2289719">Haim Avni</a> on <a href="https://vimeo.com">Vimeo</a>.</p>            
                video_rec.src = 'https://vimeo.com/' + video_rec.src;
                break;
        }
        video_rec.selected = false;
        return video_rec;
    }

    page(step, event) {
        let idx = this.new_first_index(step);
        if (idx >= 0) {
            this.first_index = idx;
        }
        event.target.parentElement.blur();
    }

    new_first_index(step) {
        let idx = this.first_index + step * this.videos_per_page;
        if (idx >= 0 && idx < this.length_keeper.len) {
            return idx;
        }
        return -1;
    }

    _disabled(side) {
        if (this.length_keeper.len == 0) return true;
        if (this.first_index >= this.length_keeper.len) {
            this.first_index = 0;
        }
        let idx = this.new_first_index(side);
        return (idx < 0);
    }

    @computedFrom('length_keeper.len', 'first_index')
    get next_disabled() {
        return this._disabled(+1);
    }

    @computedFrom('length_keeper.len', 'first_index')
    get prev_disabled() {
        return this._disabled(-1);
    }

    @computedFrom('user.editing')
    get user_editing() {
        this.update_topic_list();
        return this.user.editing;
    }

    toggle_selection(video) {
        if (video.selected) {
            video.selected = false;
            this.selected_videos.delete(video.id);
        } else {
            video.selected = true;
            this.selected_videos.add(video.id);
        }
        this.params.selected_video_list = Array.from(this.selected_videos);
    }

    delete_video(video) { 

    }

    edit_video_info(video) { 

    }

    @computedFrom('user.editing', 'params.selected_video_list', 'params.selected_topics', 'params.selected_photographers', 'params.photos_date_str', 'selected_videos', 'has_grouped_photographers', 'has_grouped_topics')
    get phase() {
        let result = "photos-not-editing";
        if (this.user.editing) {
            if (this.selected_videos.size > 0) {
                result = "videos-were-selected";
            } else {
                if (this.has_grouped_topics ||
                    this.has_grouped_photographers) {
                    result = "can-modify-tags";
                } else {
                    result = "photos-ready-to-edit"
                }
            }
        }
        this.options_settings.update({
            mergeable: result != "videos-were-selected",
            name_editable: result == "photos-ready-to-edit",
            can_set_sign: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit"
        });
        this.photographers_settings.update({
            mergeable: result == "can-modify-tags" || result == "ready-to-edit",
            name_editable: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            can_group: this.user.editing
        });
        if (this.has_grouped_photographers) {
            console.log("has grouped photographers. result is ", result);
        }
        return result;
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api.call_server_post('members/save_tag_merges', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_phototgraphers_now = true;
                this.clear_selected_topics_now = true;
            });
    }

    apply_to_selected() {
        this.api.call_server_post('members/apply_to_selected_videos', this.params)
            .then(response => {
                this.clear_video_group();
            });
    }

    clear_video_group() {
        for (let video of this.video_list) {
            video.selected = 0;
        }
        this.selected_videos = new Set();
    }

    add_photographer(event) {
        let new_photographer_name = event.detail.new_name;
        this.api.call_server_post('members/add_photographer', { photographer_name: new_photographer_name, kind: 'V' });
    }

    handle_photographer_change(event) {
        this.params.selected_photographers = event.detail.selected_options;
        this.update_video_list();
    }

    update_video_list() {
        this.params.user_id = this.user.id;
        return this.api.call_server_post('members/get_video_list', this.params)
            .then(response => this.set_video_list(response.video_list));
    }

}
