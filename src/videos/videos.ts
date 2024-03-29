import {MemberGateway} from '../services/gateway';
import {User} from "../services/user";
import {Theme} from "../services/theme";
import {autoinject, singleton, computedFrom} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {Router} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {AddVideo} from './add-video';
import {EventAggregator} from 'aurelia-event-aggregator';
import {MultiSelectSettings} from '../resources/elements/multi-select/multi-select';
import {format_date} from '../services/my-date';
import {Popup} from '../services/popups';
import {Misc} from '../services/misc';
import { ReplaceThumbnail } from './replace-thumbnail';

@autoinject
@singleton()
class Video {
    photographer_name = "";
    photographer_name_label = "";
    video_date_label = "";
    keywords_label = "";
    name = "";
    src = "";
    thumbnail_url = "";
    duration = 0;
    video_type = "";
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
}

@autoinject
@singleton()
export class Videos {
    filter = "";
    video_list: Video[] = [];
    api;
    popup: Popup;
    user;
    theme;
    misc;
    i18n;
    router;
    scroll_area;
    scroll_top = 0;
    dialog;
    ea;
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
        show_untagged: false,
        videos_date_datestr: "",
        videos_date_span_size: 3,
        selected_video_list: [],
        user_id: null,
        order_option: { value: "by-name" }
    };
    order_options = [];
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

    constructor(api: MemberGateway, user: User, popup: Popup, i18n: I18N, theme: Theme, misc: Misc,
                router: Router, dialog: DialogService, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.popup = popup;
        this.i18n = i18n;
        this.theme = theme;
        this.dialog = dialog;
        this.ea = ea;
        this.router = router;
        this.misc = misc;
        this.order_options = [
            { name: i18n.tr('videos.by-name'), value: 'by-name' },
            { name: i18n.tr('videos.recently-uploaded'), value: 'recently-uploaded'},
            { name: i18n.tr('videos.new-to-old'), value: 'new-to-old' },
            { name: i18n.tr('videos.old-to-new'), value: 'old-to-new' }
        ];
    }

    video_data(video_rec) {
        switch (video_rec.video_type) {
            case 'vimeo':
                //use the sample below 
                // <iframe src="https://player.vimeo.com/video/38324835" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
                // <p><a href="https://vimeo.com/38324835">צבעונים ונוריות בשמורת הבונים</a> from <a href="https://vimeo.com/user2289719">Haim Avni</a> on <a href="https://vimeo.com">Vimeo</a>.</p>            
                video_rec.src = 'https://vimeo.com/' + video_rec.src;
                break;
            case 'google_drive':
                video_rec.src = `https://drive.google.com/file/d/${video_rec.src}/preview`;
                break;
            case 'google_photos':
                video_rec.src = `https://photos.app.goo.gl/${video_rec.src}`;
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

    async update_video_list(first_time=false) {
        if (! first_time) {
            for (let i=0; i < 100; i++) {
                if (this.scroll_area) break;
                this.misc.sleep(30);
            }
            if (this.scroll_area) {
                this.scroll_top = 0;
                this.scroll_area.scrollTo({left: 0, top: 0, behavior: 'auto'});
                await this.misc.sleep(100);
                this.scroll_area.scrollTo({left: 0, top: 0, behavior: 'auto'});
            }
        }
        this.params.editing = this.user.editing;
        this.api.call_server_post('videos/get_video_list', this.params)
            .then(response => {
                this.set_video_list(response.video_list);
                this.handle_order_change(null);
            });
    }

    async attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "videos.video-clips";
        //let el = document.getElementById('scroll-area');
        let el = this.scroll_area;
        el.scrollTo({left: 0, top: this.scroll_top, behavior: 'auto'});
        await this.misc.sleep(100);
        el.scrollTo({left: 0, top: this.scroll_top, behavior: 'auto'});
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    async created(params, config) {
        await this.update_topic_list();
        this.update_video_list(true);
        this.ea.subscribe('NEW-VIDEO', msg => {
            this.add_video(msg.new_video_rec)
        });
        this.ea.subscribe('VIDEO-INFO-CHANGED', msg => {
            this.refresh_video(msg.changes)
        });
        this.ea.subscribe('TAGS_MERGED', () => {
            this.update_topic_list()
        });
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => {
            this.update_topic_list()
        });  //for now topics and photogaphers are handled together...
        this.ea.subscribe('VIDEO-TAGS-CHANGED', response => {
            this.apply_changes(response.changes)
        });
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : {usage: 'V'};
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
        this.dialog.open({viewModel: AddVideo, model: {params: {}}, lock: true}).whenClosed(response => {
            this.theme.hide_title = false;
        });
    }

    add_video(new_video_rec) {
        new_video_rec = this.video_data(new_video_rec);
        this.video_list.splice(0, 0, new_video_rec);
    }

    refresh_video(changes) {
        let video = this.video_list.find(vid => vid.id == changes.id);
        for (let p of ['name', 'keywords', 'photographer_id', 'video_date_datestr', 'video_date_datespan']) {
            if (changes[p]) video[p] = changes[p]
        }
    }

    @computedFrom('user.editing')
    get user_editing() {
        if (this.user.editing_mode_changed)
            this.update_topic_list();
        return this.user.editing;
    }

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', {topic_name: new_topic_name})
            .then(() => this.update_topic_list());
    }

    remove_topic(event) {
        let topic_id = event.detail.option.id;
        this.api.call_server_post('topics/remove_topic', {topic_id: topic_id})
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

    delete_videos() {
        let selecterd_videos = Array.from(this.selected_videos);
        this.api.call_server('videos/delete_videos', {selected_videos: selecterd_videos})
            .then(() => {
                this.video_list = this.video_list.filter(v => ! this.selected_videos.has(v.id));
                this.video_list = this.video_list.splice(0);
                this.selected_videos = new Set();
            });
    }

    refresh_video_thumbnails() {
        let selected_videos = Array.from(this.selected_videos);
        this.api.call_server('videos/refresh_video_thumbnails', {selected_videos: selected_videos})
            .then(() => {
                const video_list = this.video_list.filter(v => this.selected_videos.has(v.id));
                for (let video of video_list) {
                    video.selected = false;
                }
                this.selected_videos = new Set();
            });

    }

    edit_video_info(video) {
        this.theme.hide_title = true;
        this.dialog.open({viewModel: AddVideo, model: {params: video}, lock: true}).whenClosed(response => {
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
            show_untagged: this.user.editing,
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
        this.api.call_server_post('videos/apply_to_selected_videos', this.params)
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
        this.api.call_server_post('topics/add_photographer', {photographer_name: new_photographer_name, kind: 'V'});
    }

    remove_photographer(event) {
        let photographer = event.detail.option;
        this.api.call_server_post('topics/remove_photographer', {photographer: photographer})
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
        this.params.show_untagged = event.detail.show_untagged;
        this.update_video_list();
    }

    promote_videos() {
        this.api.call_server_post('videos/promote_videos', {params: this.params})
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
        let kw_label = this.i18n.tr('videos.keywords');
        let duration_label = this.i18n.tr('videos.duration');
        let duration_li = '';
        if (video.duration) {
            let duration_str = this.secs_to_str(video.duration);
            duration_li = `<li if.bind="duration_str">${duration_label}:&nbsp;${duration_str}</li>`
        }
        let content = `
        <ul>
            <li>${pn}:&nbsp;${video.photographer_name}</li>
            <li>${vdr}:&nbsp;${date_range}</li>
            <li>${kw_label}:&nbsp;${keywords}</li>
            ${duration_li}
        </ul>
        `
        return content;
    }

    secs_to_str(seconds) {
        if (!seconds) return '';
        const result = new Date(seconds * 1000).toISOString();
        const start = seconds < 3600 ? 14 : 11;
        return result.slice(start, 19);
    }

    show_filters_only() {
        this.editing_filters = true;
    }

    async view_video(video, event, member_id, keywords) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        let n_cue_points = 0;
        let cuepoints_enabled = this.user.config.enable_cuepoints;
        if (cuepoints_enabled)
            await this.api.call_server_post('videos/video_cue_points', {video_id: video.id}).then(response=> {
                n_cue_points = response.cue_points.length;
            })
        if (cuepoints_enabled && (this.user.privileges.VIDEO_EDITOR || n_cue_points > 0)) {
            let url = this.misc.make_url('annotate-video', `${video.id}/*?video_src=${video.src}&video_type=${video.video_type}&video_name=${video.name}&cuepoints_enabled=true&member_id=${member_id}&keywords=${keywords}`)
            this.popup.popup('VIDEO', url, "");
        } else {
            if (this.scroll_area)
                this.scroll_top = this.scroll_area.scrollTop;
            this.router.navigateToRoute('annotate-video', {
                video_id: video.id,
                video_src: video.src,
                video_name: video.name,
                video_type: video.video_type,
                cuepoints_enabled: cuepoints_enabled,
                keywords: keywords
            });
        }
    }

    async view_video_by_id(video_id, member_id?, caller_type?, rest?) {
        if (caller_type=='story') {
            await this.api.call_server_post('videos/story_id_to_video_id', {id: video_id})
                .then(response => video_id = response.video_id);
        }
        const keywords = rest ? rest.keywords : [];
        let video;
        if (this.video_list.length > 0) {
            video = this.video_list.find(v => v.id==video_id);
            this.view_video(video, null, member_id, keywords);
            return;
        }
        this.api.call_server_post('videos/get_video_list', this.params)
            .then(response => {
                this.set_video_list(response.video_list);
                video = this.video_list.find(v => v.id==video_id);
                this.view_video(video, null, member_id, keywords);
            });
    }

    handle_order_change(event) {
        // this.params.start_name = ""; if order is done in server...
        // this.start_name_history = [];
        // this.update_doc_list();
        switch(this.params.order_option.value) {
            case 'by-name': 
                this.video_list.sort((vid1, vid2) => vid1.name < vid2.name ? -1 : vid1.name > vid2.name ? +1 : 0);
                break
            case 'old-to-new':
                this.video_list.sort((vid1, vid2) => vid1.video_date_datestr < vid2.video_date_datestr ? -1 : vid1.video_date_datestr > vid2.video_date_datestr ? -1 : 0);
                break;
            case 'new-to-old':
                this.video_list.sort((vid1, vid2) => vid1.video_date_datestr < vid2.video_date_datestr ? +1 : vid1.video_date_datestr > vid2.video_date_datestr ? -1 : 0);
                break;
            case 'recently-uploaded':
                this.video_list.sort((vid1, vid2) => vid1.id < vid2.id ? +1 : vid1.id > vid2.id ? -1 : 0);
                break;
            default:
                break;
        }
        if (event)  //order was really changed
            this.scroll_area.scrollTop = 0;
    }

    replace_thumbnail_dialog(video, event) {
        if (! this.user.editing)
            return;
        event.stopPropagation();
        this.dialog.open({
            viewModel: ReplaceThumbnail, model: { video: video }, lock: true
        });
    }

}
