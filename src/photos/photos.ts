import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';


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
    win_width;
    win_height;
    params = {
        selected_topics: [],
        grouped_selected_topics: [],
        //selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "",
        from_date: "",
        to_date: "",
    };
    topic_list = [];
    photographer_list = [];
    days_since_upload_options;
    uploader_options;
    i18n;
    selected_photos = new Set([]);
    router;

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router) {
        this.api = api;
        this.user = user;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.days_since_upload_options = [
            { value: 0, name: this.i18n.tr('photos.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('photos.uploaded-today') },
            { value: 7, name: this.i18n.tr('photos.uploaded-this-week') }
        ];
        this.uploader_options = [
            { value: "mine", name: this.i18n.tr('photos.uploaded-by-me') },
            { value: "users", name: this.i18n.tr('photos.uploaded-by-users') },
            { value: "anyone", name: this.i18n.tr('photos.uploaded-by-anyone') }
        ];
    }

    created(params, config) {
        this.api.call_server('members/get_topic_list', { usage: 'P' })
            .then(result => {
                this.topic_list = result.topic_list;
                this.photographer_list = result.photographer_list;
                console.log("topic list ", this.topic_list)
            });
        this.update_photo_list();
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
    }

    update_photo_list() {
        return this.api.call_server_post('members/get_photo_list', this.params)
            .then(result => {
                this.photo_list = result.photo_list;
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                }
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

    photo_clicked(slide, event) {
        console.log("photo clicked. event: ", event);
        if (event.ctrlKey) {
            this.toggle_selection(slide);
        } else {
            this.jump_to_photo(slide)
        }
    }

    maximize_photo(slide, event) {
        console.log("maximize photo clicked. event: ", event);
        this.openDialog(slide);
    }

    handle_topic_change(event) {
        console.log("selection is now ", event.detail);
        if (!event.detail) return;
        console.log("selected_topics: ", event.detail.ungrouped_selected_options);
        this.params.selected_topics = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_topics = event.detail.grouped_selected_options;
        this.update_photo_list();
    }

    handle_photographer_change(event) {
        console.log("selection is now ", event.detail);
        //this.params.selected_photographers = event.detail.selected_options;
        this.update_photo_list();
    }

    handle_change(event) {
        console.log("handle change");
        this.update_photo_list();
    }

    toggle_selection(photo) {
        if (this.selected_photos.has(photo.photo_id)) {
            this.selected_photos.delete(photo.photo_id);
            photo.selected = "";
        } else {
            this.selected_photos.add(photo.photo_id);
            photo.selected = "photo-selected";
        }
        console.log("check/uncheck photo ", this.selected_photos);
    }

    private jump_to_photo(slide) {
        console.log("slide in jump: ", slide);
        let photo_id = slide.photo_id;
        this.router.navigateToRoute('photo-detail', { id: photo_id });
    }

}