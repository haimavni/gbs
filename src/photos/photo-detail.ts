import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';
import { this_page_url } from '../services/dom_utils';

@autoinject()
export class PhotoDetail {
    api;
    user;
    i18n;
    story;
    members;
    photos;
    curr_photo;
    source;
    photo_id;
    true_photo_id;
    photo_src;
    photo_name;
    photo_story;
    photo_date_str;
    photo_date_span;
    orig_photo_width = 0;
    orig_photo_height = 0;
    photo_width = 600;
    MAX_WIDTH = 600;  //todo: use dynamic info about the screen?
    MAX_HEIGHT = 750;
    photo_page_url;
    dialog;

    constructor(api: MemberGateway, i18n: I18N, user: User, dialog: DialogService) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.dialog = dialog;
    }

    activate(params, config) {
        this.photo_page_url = this_page_url();
        this.api.getPhotoDetail({ photo_id: params.id, what: params.what })
            .then(response => {
                this.photo_id = params.id;
                this.photo_src = response.photo_src;
                this.photo_name = response.photo_name;
                this.photo_story = response.photo_story;
                this.true_photo_id = response.photo_id; //this.photo_id may be associated story id
                if (this.photo_story.story_id=='new') {
                    this.photo_story.name = this.i18n.tr('photos.new-story');
                    this.photo_story.story_text = this.i18n.tr('photos.new-story-content');
                }
                this.photo_date_str = response.photo_date_str;
                this.photo_date_span = response.photo_date_span;
                this.orig_photo_width = response.width;
                this.orig_photo_height = response.height;
                /*if (! this.photo_story) {
                    this.photo_story = {story_text: this.i18n.tr('stories.no-story')};
                }*/
                let pw = this.orig_photo_width / this.MAX_WIDTH;
                let ph = this.orig_photo_height / this.MAX_HEIGHT;
                if (pw >= ph) {
                    this.photo_width = this.MAX_WIDTH;
                } else {
                    this.photo_width = this.orig_photo_width / ph;
                }

                //also: associated members, name, photographer, time, story
            });
    }

    update_photo_caption(event) {
        this.api.call_server('members/update_photo_caption', {caption: this.photo_name, photo_id: this.photo_id});
    }

    update_photo_date(customEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let s = typeof event;
        this.api.call_server('members/update_photo_date', {photo_date_str: event.date_str, photo_date_span: event.date_span, photo_id: this.photo_id});
    }
    
    private openDialog(slide) {
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false })
            .whenClosed(response => {
                console.log(response.output);
            });
    }


    open_full_size_photo() {
        let slide = {
            src: this.photo_src, 
            width: this.orig_photo_width, 
            height: this.orig_photo_height,
            name: this.photo_name,
            photo_id: this.true_photo_id
        };
        this.openDialog(slide)
    }

    go_back() {
        history.back();
    }
    
}
