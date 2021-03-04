import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { Theme } from  '../services/theme';
import { Misc } from '../services/misc';
import { DialogService } from 'aurelia-dialog';
import { debounce } from '../services/debounce';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { EventAggregator } from 'aurelia-event-aggregator';
import {MemberPicker} from "../members/member-picker";

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
export class VideoDetail {
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
    options_settings: MultiSelectSettings;
    photographers_settings: MultiSelectSettings;
    topic_list = [];
    video_topics = [];
    photographer_list = [];
    no_topics_yet = false;
    no_photographers_yet = false;
    video_source;
    video_element: HTMLVideoElement;
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


    constructor(api: MemberGateway, i18n: I18N, user: User, theme: Theme, misc: Misc, dialog: DialogService, router: Router, ea: EventAggregator) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.misc = misc;
        this.theme = theme;
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
    }

    async activate(params, config) {
        this.cue_points = [];
        await this.update_topic_list();
        await this.get_video_info(params.id);
    }

    attached() {
        console.log("attached. element: ", this.video_element);
        //console.log("duration: ", this.video_element.duration);
        //this.video_element.play();
        this.video_element = document.getElementById('video-element') as HTMLVideoElement;
        this.video_element.currentTime = 0;
        //element.play();
        //console.log("element is ", element, element.src);
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : { usage: 'V' };
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
        return this.api.call_server_post('videos/get_video_info', { video_id: video_id})
            .then(response => {
                this.video_id = video_id;
                //this.video_id_rec.video_id = video_id;
                this.video_source = response.video_source;
                this.cue_points = response.cue_points;
                this.set_story(response.video_story)
                this.video_name = this.video_story.name || response.video_name;
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
                //this.init_selected_topics();
                //this.init_photographer();
                this.undo_list = [];
            });

    }

    init_selected_topics() {
        let selected_topics = [];
        let i = 0;
        for (let opt of this.video_topics) {
            opt.sign = '';
            let itm = { option: opt, first: i == 0, last: i == this.video_topics.length - 1, group_number: i + 1 }
            selected_topics.push(itm);
            i += 1;
        }
        this.params.selected_topics = selected_topics;
    }

    init_photographer() {
        this.params.selected_photographers = [];
        if (this.photographer_id) {
            let itm = { option: { id: this.photographer_id, name: this.photographer_name } };
            this.params.selected_photographers.push(itm)
        }
    }

    add_cue_point() {
        console.log("cue points: ", this.cue_points)
        let time = Math.round(this.video_element.currentTime)
        let cue = new CuePoint(time, '');
        this.cue_points.push(cue);
        this.cue_points = this.cue_points.sort((cue1, cue2) => cue1.time - cue2.time);
        this.api.call_server_post('videos/update_video_cue_points', {video_id: this.video_id, cue_points: this.cue_points});
    }

    cue_description_changed(cue) {
        this.api.call_server_post('videos/update_video_cue_points', {video_id: this.video_id, cue_points: this.cue_points});
    }

    jump_to_cue(cue) {
        for (let cue of this.cue_points) {
            cue.is_current = false;
        }
        cue.is_current = true;
        this.video_element.currentTime = cue.time;
    }

    remove_cue(cue) {
        let idx = this.cue_points.findIndex(c => c.time == cue.time);
        this.cue_points.splice(idx, 1);
        this.api.call_server_post('videos/update_video_cue_points', {video_id: this.video_id, cue_poins: this.cue_points});
    }

    select_members(cue) {
        this.theme.hide_title = true;
        this.dialog.open({
            viewModel: MemberPicker, model: {multi: true, back_to_text: 'members.back-to-video', preselected: cue.member_ids}, lock: false,
            rejectOnCancel: false
        }).whenClosed(response => {
            this.theme.hide_title = false;
            if (response.wasCancelled) return;
            cue.member_ids = Array.from(response.output.member_ids);
            this.api.call_server_post('videos/update_cue_members', {video_id: this.video_id, time: cue.time, member_ids: cue.member_ids});
        });

    }

    @computedFrom('video_element.currentTime')
    get already_in() {
        let t = Math.round(this.video_element.currentTime)
        let cue = this.cue_points.find(c => c.time == t)
        return Boolean(cue);
    }

}
