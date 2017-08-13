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
                if (! this.photo_story) {
                    this.photo_story = this.i18n.tr('stories.no-story');
                }
                console.log("photo_story: ", this.photo_story);
                //also: associated members, name, photographer, time, story
            });
    }

}
