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

@autoinject
export class UploadPhoto {
    api;
    theme;
    user;
    dialog;
    i18n;
    router;
    ea;
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
            photographer_name: ''
        }
    }
    params = {
        selected_uploader: "mine",
        selected_order_option: "upload-time-order",
        user_id: null,
        count_limit: 10
    };
    photo_list = [];
    unknown_photographer;

    constructor(api: MemberGateway, user: User, dialog: DialogService, ea: EventAggregator, i18n: I18N, router: Router, theme: Theme, misc: Misc) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.ea = ea;
        this.misc = misc;
        this.unknown_photographer = this.i18n.tr('groups.unknown-photographer-name')
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
            this.status_record.photo_info.photographer_name = msg.photographer_name || this.unknown_photographer;
            this.status_record.duplicate = msg.duplicate;
            this.status_record.old_data = deepClone(this.status_record.photo_info);
            this.update_photo_list();
        });
    }

    update_photo_list() {
        this.params.user_id = this.status_record.user_id;
        return this.api.call_server_post('photos/get_photo_list', this.params)
        .then(result => {
            //this.after_upload = false;
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

    openDialog() {
        if (this.photo_list.length == 0) return;
        document.body.classList.add('black-overlay');
        this.user.editing = true;
        let slide = this.photo_list.find(photo => photo.photo_id==this.status_record.photo_id);
        let settings = {no_jump: true, no_photo_info: true};
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide, slide_list: this.photo_list, settings: settings }, lock: false })
            .whenClosed(response => {
                document.body.classList.remove('black-overlay');
                this.user.editing = false;
                //this.theme.page_title = title;
            });
    }

}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}
