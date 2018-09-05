import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { AddVideo } from './add-video';
import { EventAggregator } from 'aurelia-event-aggregator';

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

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router, dialog: DialogService, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.dialog = dialog;
        this.ea = ea;
        this.api.call_server_post('members/get_video_list')
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
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
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
        if (idx >= 0 && idx < this.video_list.length) {
            return idx;
        }
        return -1;
    }

    _disabled(side) {
        if (this.video_list.length == 0) return false;
        let idx = this.new_first_index(side);
        return (idx < 0);
    }

    @computedFrom('video_list', 'first_index')
    get next_disabled() {
        return this._disabled(+1);
    }

    @computedFrom('video_list', 'first_index')
    get prev_disabled() {
        return this._disabled(-1);
    }

    toggle_selection(video) {
        if (video.selected) {
            video.selected = false;
        } else {
            video.selected = true;
        }
    }

    delete_video(video) { 

    }

    edit_video_info(video) { 

    }

}
