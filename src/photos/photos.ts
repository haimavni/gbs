import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

@autoinject
export class Photos {
    filter = "";
    photos_per_line = 8;
    photo_size = 128;
    photo_list = [];
    photos_margin = 0;
    api;
    user;
    dialog;
    params = {
        selected_topics: [],
        selected_photographers: [],
        uploaded_since: 0,
        only_mine: false,
        photographer: "",
        taken_before: "",
        taken_after: ""
    };
    topic_list = [];
    photographer_list = [];
    days_since_upload;
    i18n;
    selected_days_since_upload = 0;

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N) {
        this.api = api;
        this.user = user;
        this.dialog = dialog;
        this.i18n = i18n;
        this.days_since_upload = [
            { value: 0, name: this.i18n.tr('photos.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('photos.uploaded-today') },
            { value: 7, name: this.i18n.tr('photos.uploaded-this-week') }
        ];
    }

    created(params, config) {
        this.api.call_server('members/get_topic_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
                this.photographer_list = result.photographer_list;
                console.log("topic list ", this.topic_list)
            });
        this.update_photo_list();
    }

    update_photo_list() {
        return this.api.call_server_post('members/get_photo_list', this.params)
            .then(result => {
                this.photo_list = result.photo_list;
                if (this.photo_list) {
                    console.log(this.photo_list.length + " photos");
                } else {
                    console.log("no photos found");
                }
            });
    }

    slider_changed() {
        let width = document.getElementById("photos-container").offsetWidth;
        this.photo_size = Math.floor((width - 60) / this.photos_per_line);
        console.log("slider now at ", this.photos_per_line);
        console.log("photo_size: ", this.photo_size);
        this.photo_list = this.photo_list.splice(0);
    }

    private openDialog(slide) {
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
            console.log(response.output);
        });
    }

    photo_clicked(slide) {
        this.openDialog(slide);
    }

    handle_topic_change(event) {
        console.log("selection is now ", event.detail);
        this.params.selected_topics = event.detail.selected_options;
        this.update_photo_list();
    }

    handle_photographer_change(event) {
        console.log("selection is now ", event.detail);
        this.params.selected_photographers = event.detail.selected_options;
        this.update_photo_list();
    }
}