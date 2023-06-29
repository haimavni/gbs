// this file is obsolete now. to be deleted soon
import { MemberGateway } from '../services/gateway';
import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { User } from '../services/user';
import { I18N } from 'aurelia-i18n';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { UserInfo } from './user-info';
import { Popup } from '../services/popups';
import * as toastr from 'toastr';
// import { debounce } from '../services/debounce';
import { FullSizePhoto } from '../photos/full-size-photo';

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
        photo_width: 0,
        photo_height: 0,
        duplicate: false,
        photo_details_saved: false,
        old_data: '',
        map_visible: false,
        calibrating: false,
        photo_info: {
            photo_name: '',
            photo_story: '',
            photo_date_str: '',
            photo_date_datespan: 0,
            photographer_name: '',
            photographer_id: 0,
            photo_topics: [],
            latitude: 31.772,
            longitude: 35.217,
            zoom: 8
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
    explain_gallery = "The full site will be opened in a separate window."
    marked = false;
    back;
    map_visible = false;
    ignore = true;
    working = false;

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
            this.status_record.photo_width = msg.photo_width;
            this.status_record.photo_height = msg.photo_height;
            this.status_record.photo_id = msg.photo_id;
            this.status_record.photo_info.photo_name = msg.photo_name;
            this.status_record.photo_info.photo_story = msg.photo_story;
            this.status_record.photo_info.photo_date_str = msg.photo_date_str;
            this.status_record.photo_info.photo_date_datespan = msg.photo_date_datespan;
            this.status_record.photo_info.photographer_name = msg.photographer_name || '';
            this.status_record.photo_info.photo_topics = msg.photo_topics;
            for (let opt of this.status_record.photo_info.photo_topics)
                opt.undeletable = true;
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

    deactivate() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

    save(event: Event) {
        event.stopPropagation();
        this.working = true;
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
        if (this.status_record.photo_uploaded)
            this.working = false;
        if (this.photos.length > 0) return 'ready-to-save';
        if (this.status_record.photo_url) {
            this.status_record.photo_uploaded = true;
            return 'photo-uploaded';
        }
        return 'ready-to-select';
    }

    @computedFrom('phase', 'status_record.map_visible')
    get help_message() {
        let key;
        if (this.status_record.map_visible)
            key = 'groups.place-marker'
        else
            key = 'groups.' + this.phase;
        return this.i18n.tr(key);
    }

    view_gallery() {
        const key = this.misc.temp_encrypt(this.status_record.user_id);
        const photo_id = this.status_record.photo_id; 
        let url = this.misc.make_url('photos', `*?user_id=${this.status_record.user_id}&key=${key}`)
        //let url = this.misc.make_url('photos', `${photo_id}/*?user_id=${this.status_record.user_id}&key=${key}`)
        this.popup.popup('GALLERY', url, "height=860,width=1700,left=100,top=100");
    }

    async update_location_data(latitude, longitude, zoom) {
        this.ignore = true;
        this.marked =  longitude != null;
        this.status_record.photo_info.latitude = latitude || +31.772;
        this.status_record.photo_info.longitude = longitude || 35.217;
        this.status_record.photo_info.zoom = zoom || 8;
        await sleep(2000);
        this.ignore = false;
    }

    expose_map() {
        this.map_visible = !this.map_visible;
    }

    update_photo_location() {
        if (! this.user.editing) return;
        this.api.call_server_post('photos/update_photo_location', { 
            photo_id: this.status_record.photo_id, 
            longitude: this.status_record.photo_info.longitude, 
            latitude: this.status_record.photo_info.latitude, 
            zoom: this.status_record.photo_info.zoom });
    }

    location_changed(event) {
        event.stopPropagation();
        if (! this.user.editing) return;
        let detail = event.detail;
        let longitude = null;
        let latitude = null;
        if (detail.what == 'marker-placed') {
            longitude = this.status_record.photo_info.longitude;
            latitude = this.status_record.photo_info.latitude;
        }
        this.api.call_server_post('photos/update_photo_location',
            { photo_id: this.status_record.photo_id, longitude: longitude, latitude: latitude, zoom: this.status_record.photo_info.zoom });
    }

    @computedFrom("map_visible")
    get view_hide_map() {
        let txt = 'photos.' + (this.map_visible ? 'hide-map' : 'view-map')
        return this.i18n.tr(txt)
    }


    openDialog() {
        let slide = {
            side: 'front',
            front: {
                src: this.status_record.photo_url,
                width: this.status_record.photo_width,
                height: this.status_record.photo_height,
                photo_id: this.status_record.photo_id
            },
            back: null,
            name: this.status_record.photo_info.photo_name,
            photo_id: this.status_record.photo_id,
            has_story_text: true
        };

        const photo_ids = []; 
        this.dialog.open({
            viewModel: FullSizePhoto,
            model: {
                slide: slide, 
                slide_list: photo_ids,
                hide_details_icon: !(this.user.editing || slide.has_story_text),
                list_of_ids: true
            }, lock: false
        }).whenClosed(response => {
            document.body.classList.remove('black-overlay');
            this.misc.url_shortcut = null;  //delete it
        });
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
