import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';

@autoinject()
export class PhotoDetail {
    api;
    i18n;
    story;
    members;
    photos;
    curr_photo;
    photo_idx = 0;
    source;
    photo_src;
    photo_name;
    photo_story;
    orig_photo_width = 0;
    orig_photo_height = 0;
    photo_width = 600;
    MAX_WIDTH = 600;  //todo: use dynamic info about the screen?
    MAX_HEIGHT = 750;

    constructor(api: MemberGateway, i18n: I18N) {
        this.api = api;
        this.i18n = i18n;
    }

    activate(params, config) {
        console.log("activate photo detail. params: ", params);
        this.api.getPhotoDetail({ photo_id: params.id, what: params.what })
            .then(response => {
                this.photo_src = response.photo_src;
                this.photo_name = response.photo_name;
                this.photo_story = response.photo_story;
                this.orig_photo_width = response.width;
                this.orig_photo_height = response.height;
                if (! this.photo_story) {
                    this.photo_story = this.i18n.tr('stories.no-story');
                }
                let pw = this.orig_photo_width / this.MAX_WIDTH;
                let ph = this.orig_photo_height / this.MAX_HEIGHT;
                if (pw >= ph) {
                    this.photo_width = this.MAX_WIDTH;
                } else {
                    this.photo_width = this.orig_photo_width / ph;
                }

                console.log("photo_story: ", this.photo_story);
                //also: associated members, name, photographer, time, story
            });
    }

}
