import {bindable, bindingMode, customElement, DOM} from 'aurelia-framework';

const YT = undefined;

@customElement('yt-player')
export class YtPlayerCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) player;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) videoId;

    constructor() {
        console.log("yt player was constructed");
    }

    created() {
        console.log("yt player created")
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.

        (<any>window).onYouTubeIframeAPIReady = () => {
            console.log("api is ready");
            //let element = document.getElementById('ytplayer');
            this.player = new (<any>window).YT.Player('ytplayer', {
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
            })
        }
    }

    get currentTime() {
        return this.player.getCurrentTime();
    }

    set currentTime(newTime) {
        this.player.seekTo(newTime);
    }


    onPlayerReady(event) {
        console.log("player is ready ", event);
    }

    onPlayerStateChange(event) {
        console.log("player status changed ", event);
    }
}
