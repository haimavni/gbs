import { bindable, BindingMode, customElement } from 'aurelia';
import { YtKeeper } from '../../../services/yt-keeper';

enum PlayerStates {
    UNSTARTED = -1,
    ENDED,
    PLAYING,
    PAUSED,
    BUFFERING,
    CUED = 5,
}

let playerState: PlayerStates;

class Player {
    _player;
    ytKeeper;

    constructor(ytKeeper) {
        this.ytKeeper = ytKeeper;
        //this.ytKeeper.player = ytKeeper.player;
        console.log(
            'creating Player, this.player: ',
            this.ytKeeper.player,
            ' ytkeeper==',
            this.ytKeeper
        );
    }

    get currentTime() {
        return this.ytKeeper.player.getCurrentTime();
    }

    set currentTime(newTime) {
        this.ytKeeper.player.seekTo(newTime);
    }

    get playerState(): PlayerStates {
        return this.ytKeeper.player.getPlayerState();
    }

    get paused() {
        return this.playerState == PlayerStates.PAUSED;
    }

    set paused(p) {
        if (p) {
            this.ytKeeper.player.pauseVideo();
        } else {
            this.ytKeeper.player.playVideo();
        }
    }

    set videoSource(src) {
        this.ytKeeper.player.loadVideoById(src);
    }

    playVideo() {
        this.ytKeeper.player.playVideo();
    }

    stopVideo() {
        this.ytKeeper.player.stopVideo();
    }

    pauseVideo() {
        this.ytKeeper.player.pauseVideo();
    }
}

@customElement('yt-player')
export class YtPlayerCustomElement {
    @bindable({ mode: BindingMode.twoWay }) player;
    @bindable({ mode: BindingMode.twoWay }) videoId;
    @bindable({ mode: BindingMode.twoWay }) player_is_ready;
    @bindable({ mode: BindingMode.twoWay }) currentTime;
    ytKeeper;

    constructor(ytKeeper: YtKeeper) {
        console.log('yt player was constructed');
        this.ytKeeper = ytKeeper;
        console.log('ytKeeper: ', ytKeeper);
        this.player = new Player(ytKeeper);
        console.log('in yt-player, this.player: ', this.player);
    }

    onPlayerReady(event) {
        this.ytKeeper.player_is_ready = true;
    }

    onPlayerStateChange(event) {
        //console.log("player status changed ", event);
        playerState = event.data;
    }
}
