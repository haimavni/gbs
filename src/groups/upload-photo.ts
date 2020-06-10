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
import { debounce } from '../services/debounce';

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
    explain_gallery = "The full site will be openedin a separate window."
    //google maps data
    tracked_zoom: number = 0;
    longitude_distance = 0;
    has_location = false;
    markers = [];
    map_zoom_stops = [
        179.96079168489473,
        176.7492823600056,
        150.69030712520617,
        97.57795738362208,
        52.552012683220006,
        26.745894508089606,
        13.430570314236096,
        6.722440301673341,
        3.362112939656562,
        1.681168017396189,
        0.8405979505421683,
        0.4203007179514806,
        0.2101505768092089,
        0.10507531563373007,
        0.05253766122050152,
        0.02626883103573263,
        0.013134415571016689,
        0.0065672077921696825,
        0.0032836038969072945,
        0.0016418019485477942,
        0.0008209009742863316,
        0.00041045048714138943,
        0.00020522524357602379,
        0.00010261262179511732,
        0.00020522524357602379
    ];
    update_photo_location_debounced;

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
        //
        this.update_photo_location_debounced = debounce(this.update_photo_location, 3000, false);
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
            this.handle_geo(msg);
            this.status_record.duplicate = msg.duplicate;
            this.status_record.old_data = this.misc.deepClone(this.status_record.photo_info);
            let el = document.getElementById('group-photo-area');
            this.photo_height = el.offsetHeight;
            this.update_photo_list();
        });
    }

    async handle_geo(msg) {
        if (msg.longitude) {
            this.status_record.photo_info.longitude = msg.longitude;
            this.status_record.photo_info.latitude = msg.latitude;
            this.markers = [{latitude: this.status_record.photo_info.latitude, longitude:  this.status_record.photo_info.longitude}];
            await sleep(200);
            this.status_record.photo_info.zoom = msg.zoom - 1;
            await sleep(200);
            this.status_record.photo_info.zoom = msg.zoom;
        }
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

    @computedFrom('phase', 'status_record.map_visible')
    get help_message() {
        let key;
        if (this.status_record.map_visible)
            key = 'groups.place-marker'
        else
            key = 'groups.' + this.phase;
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

    //-----------------google maps functions--------------

    bounds_changed(event) {
        let x = event.detail.bounds.Ya;
        let longitude_distance = x.j - x.i;
        if (! longitude_distance) return;
        this.tracked_zoom = this.calc_tracked_zoom(longitude_distance);
        if (this.status_record.calibrating) {
            this.map_zoom_stops[this.status_record.photo_info.zoom] = longitude_distance;
        }
        this.update_photo_location_debounced();
    }

    calc_tracked_zoom(longitude_distance) {
        let zoom = 0;
        for (let dist of this.map_zoom_stops) {
            if (dist <= longitude_distance) {
                let r = longitude_distance / dist;
                if (r > 1.2) {
                    zoom -= 1;
                }
                return zoom
            }
            else zoom += 1;
        }
        return 24;
    }

    async create_marker(event) {
        event.stopPropagation();
        if (!this.user.editing) return;
        let tracked_zoom = this.tracked_zoom;
        this.status_record.photo_info.zoom = tracked_zoom - 1;  //black magic. without it zoom becomes extremely high
        let latLng = event.detail.latLng;
        this.status_record.photo_info.latitude = latLng.lat();
        this.status_record.photo_info.longitude = latLng.lng();
        this.markers = [{ latitude: this.status_record.photo_info.latitude, longitude: this.status_record.photo_info.longitude }];
        //for some reason, the above changes zoom to an extremely high value
        this.update_photo_location_debounced();
        await sleep(100);
        this.status_record.photo_info.zoom = tracked_zoom;
        await sleep(100);
        return false;
    }

    update_photo_location() {
        if (!this.status_record.photo_info.longitude) return;
        this.api.call_server_post('photos/update_photo_location', {
            photo_id: this.status_record.photo_id,
            longitude: this.status_record.photo_info.longitude,
            latitude: this.status_record.photo_info.latitude,
            zoom: this.tracked_zoom
        });
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
