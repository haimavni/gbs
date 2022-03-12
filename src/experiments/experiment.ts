import { autoinject, singleton } from 'aurelia-framework';
import { User } from '../services/user';
import {YtKeeper} from '../services/yt-keeper';

@autoinject
@singleton()
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
    ytKeeper: YtKeeper;
    youtube_player;

    make_step(event) {
        this.current += 100;
        let cur_player: any;
        if (this.use_html5) {
            cur_player = this.html5_player;
            console.log("html5 player: ", this.html5_player);
        } else {
            //cur_player = this.yt_player;
            //cur_player = this.ytKeeper.player;
            //console.log("yt player: ", cur_player);
            //console.log("youtube_player: ", this.youtube_player);
            cur_player = this.ytKeeper.player;
            console.log("cur player: ", cur_player);
            cur_player.seekTo(600);
            cur_player.pauseVideo();
        }
        if (event.ctrlKey) {
            // let ct = this.player.getCurrentTime();
            // this.player.seekTo(ct + 180);
            // let ct = this.player.currentTime;
            //let ct = cur_player.getCurrentTime();
            //this.player.currentTime = ct + 180;
            //cur_player.seekTo(ct + 180);
            this.ytKeeper.currentTime = this.ytKeeper.currentTime + 300;
        } else {
            if (this.use_html5)
                cur_player.loadVideoById(this.yt_urls[this.curr_vid_idx]);
            else {
                this.ytKeeper.videoSource = this.yt_urls[this.curr_vid_idx];
                this.ytKeeper.paused = false;
                this.ytKeeper.paused = true;
            }
            this.curr_vid_idx = ((this.curr_vid_idx + 1) % this.yt_urls.length);
            cur_player.stopVideo();
        }
    }

    constructor(user: User, ytKeeper: YtKeeper) {
        this.user = user;
        this.ytKeeper = ytKeeper;
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
