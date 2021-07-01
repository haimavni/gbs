import {bindable, bindingMode, customElement} from 'aurelia-framework';

class Html5PlayerCustomElement {
    @bindable video_source;
    player;

    loadVideo(videoId) {
        this.video_source = videoId;
    }

    get paused() {
        return this.player.paused;
    }

    get currentTime() {
        return this.player.currentTime;
    }

    set currentTime(ct) {
        this.player.current_time = ct;
    }
}
