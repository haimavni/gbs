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
        this.api.call_server_post('members/get_video_list')
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
                console.log("new video response: ", response);
                let new_video_rec = response.output.new_video_rec;
                new_video_rec = this.video_data(new_video_rec);
                this.video_list.push(new_video_rec);
                //do something?
            } else {
                //do something else?
            }
        });
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v =>  this.video_data(v));
    }

    video_data(video_rec) {
        switch(video_rec.video_type) {
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

}
