import { IUser } from '../services/user';
import { IYtKeeper } from '../services/yt-keeper';

export class Experiment {
    longitude = 35.22;
    latitude = 31.77;
    zoom = 10;
    can_mark = true;
    to_show = false;
    final = 3000;
    current = 0;
    player;
    yt_player;
    html5_player;
    use_html5 = true;
    curr_vid_idx = 0;
    yt_urls = ['GBpibo4TEdE', 'WhuzYxmaPlc', 'OTnLL_2-Dj8'];
    html5_source =
        'http://tol.com:8000/gbs__test/static/apps_data/gbs/videos/vid003.mp4';
    youtube_player;

    make_step(event) {
        this.current += 100;
        let cur_player: any;
        if (this.use_html5) {
            cur_player = this.html5_player;
            console.log('html5 player: ', this.html5_player);
        } else {
            cur_player = this.ytKeeper.player;
            cur_player.seekTo(600);
            cur_player.pauseVideo();
        }
        if (event.ctrlKey) {
            this.ytKeeper.currentTime = this.ytKeeper.currentTime + 300;
        } else {
            if (this.use_html5)
                cur_player.loadVideoById(this.yt_urls[this.curr_vid_idx]);
            else {
                this.ytKeeper.videoSource = this.yt_urls[this.curr_vid_idx];
                this.ytKeeper.paused = false;
                this.ytKeeper.paused = true;
            }
            this.curr_vid_idx = (this.curr_vid_idx + 1) % this.yt_urls.length;
            cur_player.stopVideo();
        }
    }

    constructor(
        @IUser readonly user: IUser,
        @IYtKeeper readonly ytKeeper: IYtKeeper
    ) {}

    location_changed(event) {
        const detail = event.detail;
        console.log(detail);
        this.longitude = detail.longitude;
        this.latitude = detail.latitude;
        this.zoom = detail.zoom;
        //this.markers = detail.markers;
    }
}
