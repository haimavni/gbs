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
    html5_player;
    use_html5 = true;
    curr_vid_idx = 0;
    yt_urls = ["GBpibo4TEdE", "WhuzYxmaPlc", "OTnLL_2-Dj8"];
    html5_source = "http://tol.com:8000/gbs__test/static/apps_data/gbs/videos/vid003.mp4";

    make_step(event) {
        this.current += 100;
        let cur_player: any;
        if (this.use_html5) {
            cur_player = this.html5_player;
            console.log("html5 player: ", this.html5_player);
        } else {
            cur_player = this.yt_player;
            console.log("yt player: ", cur_player);
        }
        if (event.ctrlKey) {
            // let ct = this.player.getCurrentTime();
            // this.player.seekTo(ct + 180);
            // let ct = this.player.currentTime;
            let ct = cur_player.currentTime;
            //this.player.currentTime = ct + 180;
            cur_player.currentTime = ct + 180;
        } else {
            cur_player.loadVideo(this.yt_urls[this.curr_vid_idx]);
            this.curr_vid_idx = ((this.curr_vid_idx + 1) % this.yt_urls.length);
            cur_player.stopVideo();
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
