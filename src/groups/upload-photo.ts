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
import { timingSafeEqual } from 'crypto';

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
    title;
    description;

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

}
