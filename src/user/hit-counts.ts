import { autoinject } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';


@autoinject()
export class HitCounts {

    theme;
    api;
    router;
    i18n;
    popup: Popup;
    total_count;
    itemized_counts;
    what_options;
    what_option = 'MEMBER';

    constructor(theme: Theme, router: Router, api: MemberGateway, i18n: I18N, popup: Popup) {
        this.theme = theme;
        this.router = router;
        this.api = api;
        this.popup = popup;
        this.i18n = i18n;
        this.what_options = [
            { value: "MEMBER", name: this.i18n.tr('members.members') },
            { value: "PHOTO", name: this.i18n.tr('photos.photos') },
            { value: "EVENT", name: this.i18n.tr('stories.storires') },
            { value: "TERM", name: this.i18n.tr('terms.terms') }
        ];
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "user.number-of-hits";
        this.api.call_server('default/get_hit_statistics')
            .then(response => {
                this.total_count = response.total_count;
                this.itemized_counts = response.itemized_counts;
            })
    }

}
