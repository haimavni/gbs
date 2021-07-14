import {bindable, bindingMode, customElement} from 'aurelia-framework';

let YT = null;

enum PlayerStates {
    UNSTARTED = -1,
    ENDED,
    PLAYING,
    PAUSED,
    BUFFERING,
    CUED = 5
}

let playerState: PlayerStates;

class Player {
    player;

    constructor(player) {
        this.player = player;
    }

    get currentTime() {
        return this.player.getCurrentTime();
    }

    set currentTime(newTime) {
        this.player.seekTo(newTime);
    }

    get playerState(): PlayerStates {
        return playerState;
    }

    get paused() {
        return this.playerState == PlayerStates.PAUSED;
    }

    loadVideo(videoId) {
        console.log("loadvideo. videoId: ", videoId, " this player: ", this.player);
        this.player.loadVideoById(videoId);
    }

    playVideo() {
        this.player.playVideo();
    }

    stopVideo() {
        this.player.stopVideo();
    }

}

@customElement('yt-player')
export class YtPlayerCustomElement {
    @bindable({defaultBindingMode: bindingMode.twoWay}) player;
    @bindable({defaultBindingMode: bindingMode.twoWay}) videoId;
    @bindable({defaultBindingMode: bindingMode.twoWay}) player_is_ready;

    constructor() {
        //console.log("yt player was constructed");
        YT = this;
    }

    created() {
        //console.log("yt player created")
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.

        (<any>window).onYouTubeIframeAPIReady = () => {
            //console.log("api is ready");
            //let element = document.getElementById('ytplayer');
            let player = new (<any>window).YT.Player('ytplayer', {
                height: '100%',
                width: '100%',
                videoId: '', //'OTnLL_2-Dj8', //  'M7lc1UVf-VE',
                playerVars: {
                    'playsinline': 1
                },
                events: {
                    'onReady': this.onPlayerReady,
                    'onStateChange': this.onPlayerStateChange
                }
            });
            this.player = new Player(player);
        }
    }


    onPlayerReady(event) {
        console.log("player is ready ", event, " this: ", YT);
        YT.player_is_ready = true;
    }

    onPlayerStateChange(event) {
        //console.log("player status changed ", event);
        playerState = event.data;
    }
}
