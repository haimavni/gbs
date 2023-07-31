import {autoinject, singleton} from "aurelia-framework";
import { Misc } from '../services/misc';

let YT;
enum PlayerStates {
    UNSTARTED = -1,
    ENDED,
    PLAYING,
    PAUSED,
    BUFFERING,
    CUED = 5
}

@autoinject()
@singleton()
export class YtKeeper {
    player;
    player_is_ready;
    playerState;
    misc;

    constructor(misc: Misc) {
        console.log("yt keeper constructed");
        this.misc = misc;
        YT = this;
        //this.create();
    }


    created() {
        console.log("youtube player created. this player: ", this.player);
        if (this.player) return;
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.id = 'youtube-script';
        let firstScriptTag = document.getElementsByTagName('script')[0];
        //let firstScriptTag = document.getElementById('youtube-script');
        console.log("firstScriptTag: ", firstScriptTag);
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        (<any>window).onYouTubeIframeAPIReady = () => {
            //let element = document.getElementById('ytplayer');
            console.log("first window.YT ", (<any>window).YT);
            this.player = new (<any>window).YT.Player('ytplayer', {
                height: '100%',
                width: '100%',
                videoId: '', //'M7lc1UVf-VE', //'OTnLL_2-Dj8', //  'M7lc1UVf-VE',
                playerVars: {
                    'playsinline': 1
                },
                events: {
                    'onReady': this.onPlayerReady,
                    'onStateChange': this.onPlayerStateChange
                }
            });
            console.log("---API is ready. player is ", this.player);
        }
    }

    onPlayerReady(event) {
        console.log("--------------===player is ready?")
        YT.player_is_ready = true;
    }

    onPlayerStateChange(event) {
        YT.playerState = event.data;
    }

    get currentTime() {
        return this.player.getCurrentTime();
    }

    set currentTime(ct) {
        this.player.seekTo(ct);
    }

    set videoSource(src) {
        console.log("set video source ", src);
        this.player.loadVideoById(src);
    }

    get state() {
        return this.playerState;
    }

    get paused() {
        return this.playerState != PlayerStates.PLAYING;
    }

    get buffering() {
        return this.playerState == PlayerStates.BUFFERING;
    }

    set paused(p) {
        if (p) {
            this.pause();
        } else {
            this.player.playVideo();
        }
    }

    async pause() {
        console.log("Pause now!")
        for (let i=0; i<100; i+=1) {
            if (YT.player_is_ready) break;
            console.log("waiting ", i*10)
            await this.misc.sleep(10);
        }
        this.player.pauseVideo();
    }

}
