import {bindable, BindingMode, customElement, ICustomElementViewModel} from 'aurelia';

@customElement('html-player')
export class HtmlPlayerCustomElement implements ICustomElementViewModel {
    @bindable video_source;
    @bindable({mode: BindingMode.twoWay}) player: HTMLVideoElement;

    constructor() {
        console.log("construct html5 player")
    }

    created() {
        console.log("zevel created");
    }

    attached() {
        console.log("attached. element: ", this.player);
        //console.log("duration: ", this.video_element.duration);
        //this.video_element.play();
        this.player = document.getElementById('video-element') as HTMLVideoElement;
        this.player.currentTime = 0;
        //element.play();
        //console.log("element is ", element, element.src);
    }


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
        this.player.currentTime = ct;
    }
}
