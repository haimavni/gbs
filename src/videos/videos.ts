import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, singleton } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { AddVideo } from './add-video';

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

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router, dialog: DialogService) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.dialog = dialog;
        this.api.call_server_post('members/get_video_sample')
            .then(response => this.set_video_list(response.video_list));
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "videos.video-clips";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    new_video() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: AddVideo, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
            if (!response.wasCancelled) {
                //do something?
            } else {
                //do something else?
            }
        });
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v =>  this.youtube_data(v));
    }

    youtube_data(video_code) {
        return { type: "youtube", src: "//www.youtube.com/embed/" + video_code + "?wmode=opaque", name: video_code, selected: false }
    }

}
