import { ICustomElementViewModel } from "aurelia";

/* eslint-disable @typescript-eslint/no-this-alias */
let YT;
enum PlayerStates {
    UNSTARTED = -1,
    ENDED,
    PLAYING,
    PAUSED,
    BUFFERING,
    CUED = 5
}

export class YtKeeper implements ICustomElementViewModel {
    player;
    player_is_ready;
    playerState;

    constructor() {
        console.log("yt keeper constructed")
        YT = this;
        //this.create();
    }


    created() {
        console.log("youtube player created. this player: ", this.player);
        if (this.player) return;
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.id = 'youtube-script';
        const firstScriptTag = document.getElementsByTagName('script')[0];
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
        return this.playerState == PlayerStates.PAUSED;
    }

    set paused(p) {
        if (p) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }

}
