import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from '../services/theme'
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import default_multi_select_options from '../resources/elements/multi-select';

@autoinject()
@singleton()
export class Videos {
    filter = "";
    videos_per_line = 8;
    video_size = 128;
    video_list = [];
    videos_margin = 0;
    api;
    user;
    theme;
    dialog;
    win_width;
    win_height;
    params = {
        selected_topics: [],
        grouped_selected_topics: [],
        selected_videographers: [],
        grouped_selected_videographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        from_date: "",
        to_date: "",
        selected_video_list: []
    };
    topic_list = [];
    videographer_list = [];
    days_since_upload_options;
    uploader_options;
    i18n;
    selected_videos = new Set([]);
    done_selecting = false;
    router;
    options_settings = default_multi_select_options;
    videographers_settings = default_multi_select_options;

    constructor(api: MemberGateway, user: User, theme: Theme, dialog: DialogService, i18n: I18N, router: Router) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.days_since_upload_options = [
            { value: 0, name: this.i18n.tr('videos.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('videos.uploaded-today') },
            { value: 7, name: this.i18n.tr('videos.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('videos.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('videos.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('videos.uploaded-this-year') }
        ];
        this.uploader_options = [
            { value: "anyone", name: this.i18n.tr('videos.uploaded-by-anyone') },
            { value: "users", name: this.i18n.tr('videos.uploaded-by-users') },
            { value: "mine", name: this.i18n.tr('videos.uploaded-by-me') }
        ];
    }

    created(params, config) {
        if (this.topic_list.length > 0) {
            console.log("videos already created")
            return;
        }
        this.api.call_server('members/get_topic_list', { usage: 'P' })
            .then(result => {
                this.topic_list = result.topic_list;
                this.videographer_list = result.videographer_list;
                console.log("topic list ", this.topic_list)
            });
        console.log(" created. updating video list.")
        this.update_video_list();
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
    }

    detached() {
        this.theme.display_header_background = false;
    }

    update_video_list() {
        console.log("before update, params: ", this.params);
        return this.api.call_server_post('members/get_video_list', this.params)
            .then(result => {
                this.video_list = result.video_list;
                for (let video of this.video_list) {
                    video.title = '<span dir="rtl">' + video.title + '</span>';
                }
                if (this.video_list) {
                    console.log(this.video_list.length + " videos");
                } else {
                    console.log("no videos found");
                }
                console.log("after update, params: ", this.params);
            });
    }

    slider_changed() {
        let width = document.getElementById("videos-container").offsetWidth;
        this.video_size = Math.floor((width - 60) / this.videos_per_line);
        console.log("slider now at ", this.videos_per_line);
        console.log("video_size: ", this.video_size);
        this.video_list = this.video_list.splice(0);
    }

    video_clicked(slide, event) {
        console.log("video clicked. event: ", event);
        if (event.ctrlKey) {
            this.toggle_selection(slide);
        } else {
            this.jump_to_video(slide)
        }
    }

    handle_topic_change(event) {
        console.log("selection is now ", event.detail);
        if (!event.detail) return;
        console.log("selected_topics: ", event.detail.ungrouped_selected_options);
        this.params.selected_topics = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_topics = event.detail.grouped_selected_options;
        this.update_video_list();
    }

    handle_videographer_change(event) {
        console.log("selection is now ", event.detail);
        this.params.selected_videographers = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_videographers = event.detail.grouped_selected_options;
        this.update_video_list();
    }

    handle_change(event) {
        console.log("handle change");
        this.update_video_list();
    }

    toggle_selection(video) {
        if (this.selected_videos.has(video.video_id)) {
            this.selected_videos.delete(video.video_id);
            video.selected = "";
        } else {
            this.selected_videos.add(video.video_id);
            video.selected = "video-selected";
        }
        this.params.selected_video_list = Array.from(this.selected_videos);
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        console.log("before save merges, grouped: ", this.params.grouped_selected_topics);
        this.api.call_server_post('members/save_tag_merges', this.params)
    }

    apply_to_selected() {
        this.done_selecting = false;
        this.api.call_server_post('members/apply_to_selected_videos', this.params)
    }

    private jump_to_video(slide) {
        console.log("slide in jump: ", slide);
        let video_id = slide.video_id;
        this.router.navigateToRoute('video-detail', { id: video_id });
    }

    finish_selecting() {
        this.done_selecting = true;
    }

    @computedFrom('user.editing', 'params.selected_video_list', 'done_selecting', 'params.grouped_selected_topics', 'params.grouped_selected_videographers', 
                  'params.selected_topics', 'params.selected_videographers')
    get phase() {
        let result = "not-editing";
        if (this.user.editing) {
            if (this.selected_videos.size > 0) {
                if (this.done_selecting) {
                    result = "applying-to-videos"
                } else {
                    result = "selecting-videos";
                }
            } else {
                this.done_selecting = false;
                if (this.params.grouped_selected_topics.length > 0 || this.params.grouped_selected_videographers.length > 0) {
                    result = "can-modify-tags";
                }  else {
                    result = "ready-to-edit"
                }
            }
        }
        this.options_settings = { clear_filter_after_select: false, 
                                  mergeable: result != "applying-to-videos" && result != "selecting-videos", 
                                  name_editable: result == "ready-to-edit", 
                                  can_set_sign: result == "ready-to-edit", 
                                  can_add: result == "ready-to-edit", 
                                  can_delete: result == "ready-to-edit" };
        this.videographers_settings = { clear_filter_after_select: true, 
                                  mergeable: result == "can-modify-tags" || result == "ready-to-edit", 
                                  name_editable: result == "ready-to-edit", 
                                  can_set_sign: false, 
                                  can_add: result == "ready-to-edit", 
                                  can_delete: result == "ready-to-edit" };
        return result; 
    }

}