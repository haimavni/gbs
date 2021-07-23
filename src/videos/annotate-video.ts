import {autoinject, singleton, computedFrom} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {I18N} from 'aurelia-i18n';
import {MemberGateway} from '../services/gateway';
import {User} from '../services/user';
import {Theme} from '../services/theme';
import {Misc} from '../services/misc';
import {DialogService} from 'aurelia-dialog';
import {debounce} from '../services/debounce';
import {MultiSelectSettings} from '../resources/elements/multi-select/multi-select';
import {EventAggregator} from 'aurelia-event-aggregator';
import {MemberPicker} from "../members/member-picker";
import {YtKeeper} from "../services/yt-keeper";
import {highlight} from "../services/dom_utils";

class CuePoint {
    time: number;
    description: string;
    is_current;
    member_ids = [];

    constructor(time, description) {
        this.time = time;
        this.description = description;
    }
}

@autoinject()
@singleton()
export class AnnotateVideo {
    api;
    user: User;
    theme: Theme;
    misc: Misc;
    router: Router;
    i18n;
    dialog: DialogService;
    members;
    video_id;
    video_name;
    video_src = "";
    video_type = "youtube";
    video_url;
    popup;
    video_is_ready;
    options_settings: MultiSelectSettings;
    photographers_settings: MultiSelectSettings;
    topic_list = [];
    video_topics = [];
    photographer_list = [];
    topic_groups = [];
    selected_topics = [];
    no_topics_yet = false;
    no_photographers_yet = false;
    video_source;
    video_element: HTMLVideoElement;
    yt_player: any = null;
    player: any;
    player_is_ready;
    cue_points: CuePoint[] = [];
    video_story;
    chatroom_id = null;
    photographer_id;
    photographer_name = "";
    video_date_str;
    video_date_datespan;
    params = {
        selected_topics: [],
        selected_photographers: [],
    };
    undo_list = [];
    ea: EventAggregator;
    selected_member_ids = [];
    video_info;
    ytKeeper;
    keywords = [];
    advanced_search;
    curr_info = {
        video_date_str: "",
        video_date_datespan: 0,
        photographer_id: 0,
        photographer_name: "",
        video_topics: []
    };
    video_date_valid = '';


    constructor(api: MemberGateway, i18n: I18N, user: User, theme: Theme, misc: Misc,
                dialog: DialogService, router: Router, ea: EventAggregator, ytKeeper: YtKeeper) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.misc = misc;
        this.theme = theme;
        this.dialog = dialog;
        this.router = router;
        this.ea = ea;
        this.ytKeeper = ytKeeper;
        this.options_settings = new MultiSelectSettings
        ({
            hide_higher_options: true,
            clear_filter_after_select: false,
            can_set_sign: false,
            can_add: true,
            can_group: false,
            empty_list_message: this.i18n.tr('videos.no-topics-yet'),
        });
        this.photographers_settings = new MultiSelectSettings({
            clear_filter_after_select: true,
            can_add: true,
            can_set_sign: false,
            can_group: false,
            single: true,
            empty_list_message: this.i18n.tr('videos.no-photographers-yet')
        });
        //this.theme.hide_menu = true;  restore. add "edit" button if caller is logged in and has the privileges.
    }

    async activate(params, config) {
        console.log("params ", params);
        this.video_id = params.video_id;
        this.video_name = params.video_name;
        this.video_src = params.video_src;
        this.video_type = params.video_type || "youtube";
        if (this.video_type=='youtube')
            this.video_url="https://www.youtube.com/embed/" + this.video_src + "?wmode=opaque"
        this.popup = params.popup;
        if (this.video_type == 'youtube' && ! this.popup) {
            this.player = this.ytKeeper;
        }
        this.cue_points = [];
        await this.update_topic_list();
        await this.get_video_info(this.video_id);
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : {usage: 'V'};
        this.api.call_server_post('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.photographer_list = result.photographer_list;
                this.no_topics_yet = this.topic_list.length == 0;
                this.no_photographers_yet = this.photographer_list.length == 0;
            });
    }

    set_story(story) {
        this.video_story = "";
        this.video_story = story;
    }


    get_video_info(video_id) {
        return this.api.call_server_post('videos/get_video_info', {video_id: video_id})
            .then(response => {
                this.video_id = video_id;
                //this.video_id_rec.video_id = video_id;
                this.video_source = response.video_source;
                if (this.popup)
                    this.set_video_source();
                this.cue_points = response.cue_points;
                this.set_story(response.video_story)
                //this.video_name = this.video_story.name || response.video_name;
                this.photographer_name = response.photographer_name;
                this.photographer_id = response.photographer_id;
                this.video_topics = response.video_topics;
                if (this.video_story.story_id == 'new') {
                    this.video_story.name = this.i18n.tr('videos.new-story');
                    this.video_story.story_text = this.i18n.tr('videos.new-story-content');
                }
                this.video_date_str = response.video_date_str;
                this.video_date_datespan = response.video_date_datespan;
                this.chatroom_id = response.chatroom_id;
                this.init_selected_topics();
                this.init_photographer();
                this.undo_list = [];
            });
    }

    async set_video_source() {
        for (let i = 0; i < 100; i += 1) {
            if (this.ytKeeper.player_is_ready) break;
            await this.misc.sleep(50);
        }
        this.ytKeeper.videoSource = this.video_src;
    }

    init_selected_topics() {
        let selected_topics = [];
        let i = 0;
        for (let opt of this.video_topics) {
            opt.sign = '';
            let itm = {option: opt, first: i == 0, last: i == this.video_topics.length - 1, group_number: i + 1}
            selected_topics.push(itm);
            i += 1;
        }
        this.params.selected_topics = selected_topics;
    }

    @computedFrom('video_topics')
    get topic_names() {
        if (!this.video_topics) return "";
        let topic_name_list = this.video_topics.map(itm => itm.name);
        return topic_name_list.join(';');
    }

    @computedFrom('photo_story.story_text', 'story_changed', 'keywords', 'advanced_search')
    get highlightedHtml() {
        if (!this.video_story) {
            return "";
        }
        let highlighted_html = highlight(this.video_story.story_text, this.keywords, this.advanced_search);
        return highlighted_html;
    }

    init_photographer() {
        this.params.selected_photographers = [];
        if (this.photographer_id) {
            let itm = {option: {id: this.photographer_id, name: this.photographer_name}};
            this.params.selected_photographers.push(itm)
        }
    }

    add_cue_point() {
        console.log("cue points: ", this.cue_points)
        let time = Math.round(this.player.currentTime)
        let cue = new CuePoint(time, '');
        this.cue_points.push(cue);
        this.cue_points = this.cue_points.sort((cue1, cue2) => cue1.time - cue2.time);
        this.api.call_server_post('videos/update_video_cue_points', {
            video_id: this.video_id,
            cue_points: this.cue_points
        });
    }

    cue_description_changed(cue) {
        this.api.call_server_post('videos/update_video_cue_points', {
            video_id: this.video_id,
            cue_points: this.cue_points
        });
    }

    jump_to_cue(cue) {
        for (let cue of this.cue_points) {
            cue.is_current = false;
        }
        cue.is_current = true;
        this.player.currentTime = cue.time;
    }

    remove_cue(cue) {
        let idx = this.cue_points.findIndex(c => c.time == cue.time);
        this.cue_points.splice(idx, 1);
        this.api.call_server_post('videos/update_video_cue_points', {
            video_id: this.video_id,
            cue_poins: this.cue_points
        });
    }

    select_members(cue) {
        this.theme.hide_title = true;
        this.dialog.open({
            viewModel: MemberPicker,
            model: {multi: true, back_to_text: 'members.back-to-video', preselected: cue.member_ids},
            lock: false,
            rejectOnCancel: false
        }).whenClosed(response => {
            this.theme.hide_title = false;
            if (response.wasCancelled) return;
            cue.member_ids = Array.from(response.output.member_ids);
            this.api.call_server_post('videos/update_cue_members', {
                video_id: this.video_id,
                time: cue.time,
                member_ids: cue.member_ids
            });
        });

    }

    @computedFrom('player.currentTime')
    get already_in() {
        let t = Math.round(this.player.currentTime)
        let cue = this.cue_points.find(c => c.time == t)
        return Boolean(cue);
    }

    go_back(event) {
        event.stopPropagation();
        if (this.popup) {
            window.close();
        } else {
           this.router.navigateBack(); 
        }
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.selected_topics = event.detail.selected_options
        let topics = this.selected_topics.map(top => top.option);
        this.video_topics = topics;
        this.undo_list.push({what: 'topics', video_topics: this.curr_info.video_topics});
        this.curr_info.video_topics = topics.slice(0);
        console.log("handle topic change. story_id/story_topics/used4: ", this.video_story.story_id, this.video_topics, this.api.constants) //.story_type.STORY4VIDEO)
        this.api.call_server_post('members/apply_topics_to_story', {
            story_id: this.video_story.story_id,
            story_topics: this.video_topics,
            used_for: this.api.constants.story_type.STORY4VIDEO
        });
    }

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', {topic_name: new_topic_name})
            .then(() => this.update_topic_list());
    }

    update_video_date(customEvent) {
        customEvent.stopPropagation();
        if (!this.video_date_valid) return;
        let event = customEvent.detail;
        this.undo_list.push({
            what: 'story-date',
            story_date: {
                video_date_str: this.curr_info.video_date_str,
                video_date_datespan: this.curr_info.video_date_datespan
            }
        });
        this.curr_info.video_date_str = this.video_date_str.slice(0);
        this.curr_info.video_date_datespan = this.video_date_datespan;
        console.log("update video date. event: ", event);
        this.api.call_server_post('videos/update_video_date',
            {
                video_date_str: event.date_str, video_date_datespan: event.date_span,
                video_id: this.video_id
            });
    }

    undo() {
        let command = this.undo_list.pop();
        switch (command.what) {
            case "topics":
                this.video_topics = command.video_topics.slice(0);
                this.curr_info.video_topics = command.video_topics.slice(0);
                this.init_selected_topics();
                this.api.call_server_post('members/apply_topics_to_story',
                    {
                        story_id: this.video_story.story_id,
                        story_topics: this.video_topics,
                        used_for: this.video_story.used_for
                    });
                break;
            case "story-date":
                this.video_date_str = command.story_date.video_date_str;
                this.curr_info.video_date_str = command.story_date.video_date_str;
                this.video_date_datespan = command.story_date.video_date_datespan;
                this.curr_info.video_date_datespan = command.story_date.video_date_datespan;
                this.api.call_server_post('members/update_story_date',
                    {
                        story_date_str: this.video_date_str,
                        story_date_datespan: this.video_date_datespan,
                        story_id: this.video_story.story_id
                    });
                break;
        }
    }

    add_photographer(event) {
        let new_photographer_name = event.detail.new_name;
        this.api.call_server_post('topics/add_photographer', { photographer_name: new_photographer_name, kind: 'P' })
            .then(() => {
                this.update_topic_list();
            });
    }

    photographer_name_changed(event) {
        let p = event.detail.option;
        this.api.call_server_post('topics/rename_photographer', p);
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
        this.api.call_server_post('videos/assign_video_photographer', { video_id: this.video_id, photographer_id: this.photographer_id });
    }

}
