import { MemberGateway } from '../services/gateway';
import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { User } from '../services/user';
import { I18N } from 'aurelia-i18n';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { UserInfo } from './user-info';
import { Popup } from '../services/popups';
import * as toastr from 'toastr';

@autoinject
export class UploadPhoto {
    api;
    theme;
    user;
    dialog;
    i18n;
    router;
    ea;
    popup: Popup;
    misc;
    group_id;
    logo_url;
    title;
    description;
    photos = [];
    subscriber;
    status_record = {
        photo_uploaded: false,
        user_id: -1,
        photo_url: '',
        photo_id: 0,
        duplicate: false,
        photo_details_saved: false,
        old_data: '',
        photo_info: {
            photo_name: '',
            photo_story: '',
            photo_date_str: '',
            photo_date_datespan: 0,
            photographer_name: '',
            photographer_id: 0,
            photo_topics: []
        }
    }
    params = {
        selected_order_option: "upload-time-order",
        user_id: null,
        count_limit: 100,
        editing: false
    };
    photo_list = [];
    photo_height = 620;
    unknown_photographer;
    explain_gallery = "The full site will be openedin a separate window."

    constructor(api: MemberGateway, user: User, dialog: DialogService, ea: EventAggregator,
        i18n: I18N, router: Router, popup: Popup, theme: Theme, misc: Misc) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.popup = popup;
        this.ea = ea;
        this.misc = misc;
        this.unknown_photographer = this.i18n.tr('groups.unknown-photographer-name');
        this.explain_gallery = this.i18n.tr('groups.explain-gallery');
    }

    attached() {
        this.subscriber = this.ea.subscribe('GROUP-PHOTO-UPLOADED', msg => {
            this.photos = [];
            this.status_record.photo_url = msg.photo_url;
            this.status_record.photo_id = msg.photo_id;
            this.status_record.photo_info.photo_name = msg.photo_name;
            this.status_record.photo_info.photo_story = msg.photo_story;
            this.status_record.photo_info.photo_date_str = msg.photo_date_str;
            this.status_record.photo_info.photo_date_datespan = msg.photo_date_datespan;
            this.status_record.photo_info.photographer_name = msg.photographer_name || '';
            this.status_record.photo_info.photo_topics = msg.photo_topics;
            this.status_record.photo_info.photographer_id = msg.photographer_id;
            this.status_record.duplicate = msg.duplicate;
            this.status_record.old_data = this.misc.deepClone(this.status_record.photo_info);
            let el = document.getElementById('group-photo-area');
            this.photo_height = el.offsetHeight;
            this.update_photo_list();
        });
    }

    update_photo_list() {
        this.params.user_id = this.status_record.user_id;
        this.params.editing = this.user.editing;
        return this.api.call_server_post('photos/get_photo_list', this.params)
            .then(result => {
                this.photo_list = result.photo_list;
                for (let photo of this.photo_list) {
                    photo.title = '<span dir="rtl">' + photo.title + '</span>';
                }
            });
    }

   detached() {
        this.subscriber.dispose();
    }

    activate(params, config) {
        this.group_id = params.group;
        this.api.call_server('groups/get_group_info', { group_id: this.group_id })
            .then(response => {
                this.logo_url = response.logo_url;
                this.title = response.title;
                this.description = response.description;
            })
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    save() {
        this.api.uploadFiles(
            this.status_record.user_id,
            this.photos,
            'PHOTO',
            { group_id: this.group_id, ptp_key: this.api.constants.ptp_key }
        )
    }

    @computedFrom('photos', 'status_record.photo_url', 'status_record.user_id')
    get phase() {
        if (this.status_record.user_id < 1) return 'not-logged-in';
        this.status_record.photo_uploaded = this.status_record.photo_url != '';
        if (this.photos.length > 0) return 'ready-to-save';
        if (this.status_record.photo_url) {
            this.status_record.photo_uploaded = true;
            return 'photo-uploaded';
        }
        return 'ready-to-select';
    }

    @computedFrom('phase')
    get help_message() {
        let key = 'groups.' + this.phase;
        return this.i18n.tr(key);
    }

    openDialog() {
        if (this.photo_list.length == 0) return;
        let slide = this.photo_list.find(photo => photo.photo_id == this.status_record.photo_id);
        if (!slide) {
            let warning = this.i18n.tr('groups.old-photo-not-found');
            toastr.warning(warning, 20000);
            return;
        }
        document.body.classList.add('black-overlay');
        this.user.editing = true;
        let settings = { no_jump: true, no_photo_info: true };
        let model = { slide: slide, slide_list: this.photo_list, settings: settings, final_rotation: 0 }
        this.dialog.open({ viewModel: FullSizePhoto, model: model, lock: false })
            .whenClosed(response => {
                document.body.classList.remove('black-overlay');
                if (model.final_rotation) {
                    let el = document.getElementById("uploaded-photo");
                    el.style.transform = `rotate(-${model.final_rotation}deg)`;
                }
            });
    }

    view_gallery() {
        let url = `${location.pathname}#/photos/*?user_id=${this.status_record.user_id}`;
        this.popup.popup('GALLERY', url, "height=860,width=1700,left=100,top=100");
    }

}
