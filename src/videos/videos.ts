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
import { format_date } from '../services/my-date';

@autoinject
class Video {
    photographer_name = "";
    photographer_name_label = "";
    video_date_label = "";
    keywords_label = "";
    name = "";
    src = "";
    id = 0;
    keywords = "";
    video_date_datestr = "";
    video_date_datespan = 0;
    selected: boolean = false;

    constructor(photographer_name, photographer_name_label, video_date_label, keywords_label) {
        this.photographer_name = photographer_name;
        this.photographer_name_label = photographer_name_label;
        this.video_date_label = video_date_label;
        this.keywords_label = keywords_label;
    }

    get video_info_content() {
        let date_range = format_date(this.video_date_datestr, this.video_date_datespan);
        let content = `
        <ul>
            <li>${this.photographer_name_label}:&nbsp;${this.photographer_name}</li>
            <li>${this.video_date_label}:&nbsp;${date_range}</li>
            <li>${this.keywords_label}:&nbsp;${this.keywords}</li>
        </ul>
        `
        return content;
    }

}

@autoinject
@singleton()
export class Videos {
    filter = "";
    video_list: Video[] = [];
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
    topic_groups = [];
    selected_videos = new Set();
    has_grouped_photographers = false;
    has_grouped_topics = false;
    params = {
        kind: "V",
        editing: false,
        selected_topics: [],
        selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        selected_dates_option: "dated-or-not",
        videos_date_datestr: "",
        videos_date_span_size: 3,
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
        len: 0
    }
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;
    anchor = -1; //for multiple selections
    empty = false;
    highlight_unselectors = "";
    editing_filters = false;
    no_topics_yet = false;
    no_photographers_yet = false;

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router, dialog: DialogService, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.dialog = dialog;
        this.ea = ea;
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
        //video_rec.selected = false;
        let photographer = this.photographer_list.find(p => p.id == video_rec.photographer_id);
        let photographer_name = photographer ? photographer.name : this.i18n.tr('videos.unknown-photographer');
        let vr = new Video(
            photographer_name,
            this.i18n.tr('videos.photographer-name'),
            this.i18n.tr('videos.video-date-range'),
            this.i18n.tr('videos.keywords'));
        for (let key of Object.keys(vr)) {
            if (video_rec[key])
                vr[key] = video_rec[key];
        }
        return vr;
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v => this.video_data(v));
        this.empty = this.video_list.length == 0;
        this.highlight_unselectors = this.empty ? "warning" : "";
        this.length_keeper.len = this.video_list.length;
        this.editing_filters = false;
    }

    update_video_list() {
        this.params.editing = this.user.editing;
        this.api.call_server_post('photos/get_video_list', this.params)
            .then(response => this.set_video_list(response.video_list));
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "videos.video-clips";
    }

    async created(params, config) {
        await this.update_topic_list();
        this.update_video_list();
        this.ea.subscribe('NEW-VIDEO', msg => {
            this.add_video(msg.new_video_rec)
        });
        this.ea.subscribe('VIDEO-INFO-CHANGED', msg => {
            this.refresh_video(msg.changes)
        });
        this.ea.subscribe('TAGS_MERGED', () => { this.update_topic_list() });
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => { this.update_topic_list() });  //for now topics and photogaphers are handled together...
        this.ea.subscribe('VIDEO-TAGS-CHANGED', response => {
            this.apply_changes(response.changes)
        });
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : { usage: 'V' };
        this.api.call_server('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.photographer_list = result.photographer_list;
                this.no_topics_yet = this.topic_list.length == 0;
                this.no_photographers_yet = this.photographer_list.length == 0;
            });
    }

    apply_changes(changes) {
        for (let change of changes) {
            let video = this.video_list.find(v => v.id == change.video_id);
            if (change.photographer_name) {
                video.photographer_name = change.photographer_name;
            }
            video.keywords = change.keywords;
        }
    }

    new_video() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: AddVideo, model: { params: {} }, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
        });
    }

    add_video(new_video_rec) {
        new_video_rec = this.video_data(new_video_rec);
        this.video_list.push(new_video_rec);
        let n = this.video_list.length;
        let r = n % this.videos_per_page
        this.first_index = n - r;
    }

    refresh_video(changes) {
        let video = this.video_list.find(vid => vid.id == changes.id);
        for (let p of ['name', 'keywords', 'photographer_id', 'video_date_datestr', 'video_date_datespan']) {
            if (changes[p]) video[p] = changes[p]
        }
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

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', { topic_name: new_topic_name })
            .then(() => this.update_topic_list());
    }

    remove_topic(event) {
        let topic_id = event.detail.option.id;
        this.api.call_server_post('topics/remove_topic', { topic_id: topic_id })
            .then(() => this.update_topic_list());
    }

    topic_name_changed(event) {
        let t = event.detail.option;
        this.api.call_server_post('topics/rename_topic', t);
    }

    toggle_selection(video, event, index) {
        if (this.anchor < 0) this.anchor = index;
        if (event.altKey) {
            this.selected_videos = new Set();
            if (video.selected)
                this.selected_videos.add(video.id);
            for (let vid of this.video_list) {
                if (vid.id != video.id)
                    vid.selected = false;
            }
        } else if (event.shiftKey) {
            this.toggle_video_selection(video);
            let checked = video.selected;
            let i0, i1;
            if (this.anchor < index) {
                i0 = this.anchor;
                i1 = index;
            } else {
                i0 = index;
                i1 = this.anchor;
            }
            for (let i = i0; i < i1; i++) {
                let video = this.video_list[i];
                if (video) {
                    video.selected = checked;
                    if (checked) {
                        this.selected_videos.add(video.id)
                    } else {
                        this.selected_videos.delete(video.id)
                    }
                } else {
                    console.log("no itm. i is: ", i);
                }
            }
        } else if (video.selected) {
            video.selected = false;
            this.selected_videos.delete(video.id);
        } else {
            video.selected = true;
            this.selected_videos.add(video.id);
        }
        this.params.selected_video_list = Array.from(this.selected_videos);
    }

    toggle_video_selection(video) {
        if (this.selected_videos.has(video.id)) {
            this.selected_videos.delete(video.id);
            video.selected = false;
        } else {
            this.selected_videos.add(video.id);
            video.selected = true;
        }
        this.params.selected_video_list = Array.from(this.selected_videos);
    }

    delete_video(video) {
        this.api.call_server('photos/delete_video', { video_id: video.id })
            .then(() => {
                let idx = this.video_list.findIndex(v => v.id == video.id);
                this.video_list.splice(idx, 1);
            });
    }

    edit_video_info(video) {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: AddVideo, model: { params: video }, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
        });
    }

    @computedFrom('user.editing', 'params.selected_video_list', 'params.selected_topics', 'params.selected_photographers', 'params.videos_date_datestr', 'params.videos_date_datespan', 'selected_videos',
        'has_grouped_photographers', 'has_grouped_topics')
    get phase() {
        let result = "photos-not-editing";
        if (this.user.editing) {
            if (this.selected_videos.size > 0) {
                result = "videos-were-selected";
            } else {
                result = this.topics_action();
            }
        }
        this.options_settings.update({
            mergeable: result != "videos-were-selected",
            name_editable: result == "photos-ready-to-edit",
            can_set_sign: true, //result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            hide_higher_options: this.selected_videos.size > 0 && this.user.editing,
            help_topic: 'topics-help'
        });
        this.photographers_settings.update({
            mergeable: result == "can-modify-tags" || result == "ready-to-edit",
            name_editable: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            can_group: this.user.editing,
            empty_list_message: this.i18n.tr('photos.no-photographers-yet'),
            help_topic: 'photographers-help'
        });
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

    apply_to_selected() {
        this.api.call_server_post('photos/apply_to_selected_videos', this.params)
            .then(response => {
                this.clear_selected_videos();
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
                this.clear_selected_topics_now = true;
            });
    }

    clear_selected_videos() {
        for (let video of this.video_list) {
            video.selected = false;
        }
        this.selected_videos = new Set();
        this.params.selected_video_list = [];
    }

    add_photographer(event) {
        let new_photographer_name = event.detail.new_name;
        this.api.call_server_post('topics/add_photographer', { photographer_name: new_photographer_name, kind: 'V' });
    }

    remove_photographer(event) {
        let photographer = event.detail.option;
        this.api.call_server_post('topics/remove_photographer', { photographer: photographer })
        .then(() => {
            this.update_topic_list();
        });
    }

    handle_photographer_change(event) {
        this.params.selected_photographers = event.detail.selected_options;
        this.update_video_list();
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options;
        this.update_video_list();
    }

    promote_videos() {
        this.api.call_server_post('photos/promote_videos', { params: this.params })
            .then(response => {
                this.clear_selected_videos();
            });
    }

    video_info_title(video) {
        let title = `<h3>${video.name}</h3>`
        return title;
    }

    video_info_content(video) {
        let pn = this.i18n.tr('videos.photographer-name');
        let vdr = this.i18n.tr('videos.video-date-range');
        let date_range = format_date(video.video_date_datestr, video.video_date_datespan);
        let keywords = video.keywords ? video.keywords : "";
        let kw_label = this.i18n.tr('videos.keywords')
        let content = `
        <ul>
            <li>${pn}:&nbsp;${video.photographer_name}</li>
            <li>${vdr}:&nbsp;${date_range}</li>
            <li>${kw_label}:&nbsp;${keywords}</li>
        </ul>
        `
        return content;
    }

    show_filters_only() {
        this.editing_filters = true;
    }

}
