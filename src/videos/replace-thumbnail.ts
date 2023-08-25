import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { I18N, TCustomAttribute } from 'aurelia-i18n';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { User } from '../services/user';

@autoinject
export class ReplaceThumbnail {
    api: MemberGateway;
    i18n: I18N;
    controller: DialogController;
    error_message = "";
    title: string;
    name_placeholder = "Thumbnail URL";
    misc: Misc;
    theme: Theme;
    user: User;
    video: any;
    thumbnail_url: string = "";
    curr_thumbnail_url: string = "";
    
    constructor(controller: DialogController, api: MemberGateway, i18n: I18N, misc: Misc, theme: Theme, user: User) {
        this.controller = controller;
        this.api = api;
        this.i18n = i18n;
        this.misc = misc;
        this.theme = theme;
        this.user = user;
    }

    activate(params) {
        this.video = params.video;
        console.log("------this video is ", this.video);
        this.curr_thumbnail_url = this.video.thumbnail_url;
        this.title = this.i18n.tr('videos.enter-thumbnail') + this.video.name;
    }

    url_changed(event) {
        console.log("url changned. ")
        this.curr_thumbnail_url = this.thumbnail_url;
    }

    save() {
       this.video.thumbnail_url = this.thumbnail_url;
       this.api.call_server_post("videos/replace_thumbnail_url", {"video_id": this.video.id, "thumbnail_url": this.thumbnail_url});
    }

    cancel() {
        this.controller.cancel();
    }

    @computedFrom('thumbnail_url')
    get ready_to_save() {
        if (! this.thumbnail_url) return false;
        return true;
    }

}
