import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, singleton } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';

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

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.router = router;
        this.api.call_server_post('members/get_video_sample')
            .then(response => this.set_video_list(response.video_list));
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "videos.videos";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    new_video() {

    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v =>  this.youtube_data(v));
    }

    youtube_data(video_code) {
        return { type: "youtube", src: "//www.youtube.com/embed/" + video_code + "?wmode=opaque" }
    }

}
