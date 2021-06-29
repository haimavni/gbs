import { autoinject, computedFrom } from 'aurelia-framework';
import { User } from '../services/user';

@autoinject
export class Experiment {
    longitude: number = 35.22;
    latitude: number = 31.77;
    zoom: number = 10;
    can_mark = true;
    user: User;
    to_show = false;
    final = 3000;
    current = 0;
    player;
    yt_player;
    curr_vid_idx = 0;
    yt_urls = ["GBpibo4TEdE", "WhuzYxmaPlc", "OTnLL_2-Dj8"];

    make_step(event) {
        this.current += 100;
        if (event.ctrlKey) {
            let ct = this.player.getCurrentTime();
            this.player.seekTo(ct + 180);
        } else {
            this.player.loadVideoById(this.yt_urls[this.curr_vid_idx]);
            this.curr_vid_idx = ((this.curr_vid_idx + 1) % this.yt_urls.length);
            this.player.stopVideo();
        }
    }

    constructor(user: User) {
        this.user = user;
    }

    location_changed(event) {
        let detail = event.detail;
        console.log(detail);
        this.longitude = detail.longitude;
        this.latitude = detail.latitude;
        this.zoom = detail.zoom;
        //this.markers = detail.markers;
    }

}
