import {autoinject, singleton} from "aurelia-framework";

let YT;

@autoinject()
@singleton()
export class YtKeeper {
    player;
    player_is_ready;
    playerState;

    constructor() {
        YT = this;
    }


    created() {
        console.log("youtube player created")
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
                videoId: 'M7lc1UVf-VE', //'OTnLL_2-Dj8', //  'M7lc1UVf-VE',
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

}
