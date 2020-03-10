import { MemberGateway } from '../services/gateway';
import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { User } from '../services/user';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { I18N } from 'aurelia-i18n';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { UserInfo } from './user-info';

@autoinject
export class UploadPhoto {
    api;
    user;
    theme;
    dialog;
    i18n;
    router;
    ea;
    misc;
    group_id;
    logo_url;
    photo_url = '';
    duplicate;
    title;
    description;
    photos = [];
    subscriber;
    photo_story;
    status_record = {
        photo_loaded: false,
        is_logged_in: false
    }

    constructor(api: MemberGateway, user: User, dialog: DialogService, ea: EventAggregator, i18n: I18N, router: Router, theme: Theme, misc: Misc) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.ea = ea;
        this.misc = misc;
    }

    attached() {
        this.subscriber = this.ea.subscribe('GROUP-PHOTO-UPLOADED', msg => {
            this.photos = [];
            this.photo_url = msg.photo_url;
            this.duplicate=msg.duplicate;
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
            this.user.id,
            this.photos,
            'PHOTO',
            { group_id: this.group_id, ptp_key: this.api.constants.ptp_key }
        )
    }

    @computedFrom('photos', 'photo_url')
    get phase() {
        this.status_record.photo_loaded = this.photo_url != '';
        if (this.photos.length > 0) return 'ready-to-save';
        if (this.photo_url) {
            this.status_record.photo_loaded = true;
            return 'photo-uploaded';
        }
        return 'ready-to-select';
    }

}
