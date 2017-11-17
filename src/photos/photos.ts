import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import default_multi_select_options from '../resources/elements/multi-select';
import { Theme } from '../services/theme';

@autoinject()
@singleton()
export class Photos {
    filter = "";
    photos_per_line = 8;
    photo_size = 128;
    photo_list = [];
    photos_margin = 0;
    api;
    user;
    theme;
    dialog;
    win_width;
    win_height;
    params = {
        selected_topics: [],
        grouped_selected_topics: [],
        selected_photographers: [],
        grouped_selected_photographers: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        from_date: "",
        to_date: "",
        selected_photo_list: []
    };
    topic_list = [];
    photographer_list = [];
    days_since_upload_options;
    uploader_options;
    i18n;
    selected_photos = new Set([]);
    done_selecting = false;
    router;
    options_settings = default_multi_select_options;
    photographers_settings = default_multi_select_options;

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router, theme: Theme) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.days_since_upload_options = [
            { value: 0, name: this.i18n.tr('photos.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('photos.uploaded-today') },
            { value: 7, name: this.i18n.tr('photos.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('photos.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('photos.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('photos.uploaded-this-year') }
        ];
        this.uploader_options = [
            { value: "anyone", name: this.i18n.tr('photos.uploaded-by-anyone') },
            { value: "users", name: this.i18n.tr('photos.uploaded-by-users') },
            { value: "mine", name: this.i18n.tr('photos.uploaded-by-me') }
        ];
    }

    created(params, config) {
        if (this.topic_list.length > 0) {
            console.log("photos already created")
            return;
        }
        this.api.call_server('members/get_topic_list', { usage: 'P' })
            .then(result => {
                this.topic_list = result.topic_list;
                this.photographer_list = result.photographer_list;
                console.log("topic list ", this.topic_list)
            });
        console.log(" created. updating photo list.")
        this.update_photo_list();
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
    }

    detached() {
        this.theme.display_header_background = false;
    }

    update_photo_list() {
        console.log("before update, params: ", this.params);
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
                console.log("after update, params: ", this.params);
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
        this.params.selected_photographers = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_photographers = event.detail.grouped_selected_options;
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
        this.params.selected_photo_list = Array.from(this.selected_photos);
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        console.log("before save merges, grouped: ", this.params.grouped_selected_topics);
        this.api.call_server_post('members/save_tag_merges', this.params)
    }

    apply_to_selected() {
        this.done_selecting = false;
        this.api.call_server_post('members/apply_to_selected_photos', this.params)
    }

    private jump_to_photo(slide) {
        console.log("slide in jump: ", slide);
        let photo_id = slide.photo_id;
        this.router.navigateToRoute('photo-detail', { id: photo_id });
    }

    finish_selecting() {
        this.done_selecting = true;
    }

    @computedFrom('user.editing', 'params.selected_photo_list', 'done_selecting', 'params.grouped_selected_topics', 'params.grouped_selected_photographers', 
                  'params.selected_topics', 'params.selected_photographers')
    get phase() {
        let result = "not-editing";
        if (this.user.editing) {
            if (this.selected_photos.size > 0) {
                if (this.done_selecting) {
                    result = "applying-to-photos"
                } else {
                    result = "selecting-photos";
                }
            } else {
                this.done_selecting = false;
                if (this.params.grouped_selected_topics.length > 0 || this.params.grouped_selected_photographers.length > 0) {
                    result = "can-modify-tags";
                }  else {
                    result = "ready-to-edit"
                }
            }
        }
        this.options_settings = { clear_filter_after_select: false, 
                                  mergeable: result != "applying-to-photos" && result != "selecting-photos", 
                                  name_editable: result == "ready-to-edit", 
                                  can_set_sign: result == "ready-to-edit", 
                                  can_add: result == "ready-to-edit", 
                                  can_delete: result == "ready-to-edit" };
        this.photographers_settings = { clear_filter_after_select: true, 
                                  mergeable: result == "can-modify-tags" || result == "ready-to-edit", 
                                  name_editable: result == "ready-to-edit", 
                                  can_set_sign: false, 
                                  can_add: result == "ready-to-edit", 
                                  can_delete: result == "ready-to-edit" };
        return result; 
    }

}