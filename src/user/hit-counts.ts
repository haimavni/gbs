import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';


@autoinject()
export class HitCounts {

    theme;
    api;
    router;
    popup: Popup;
    total_count;
    itemized_counts;

    constructor(theme: Theme, router: Router, api: MemberGateway, popup: Popup) {
        this.theme = theme;
        this.router = router;
        this.api = api;
        this.popup = popup;
    }

    attached() {
        this.api.call_server('default/get_hit_statistics')
            .then(response => {
                this.total_count = response.total_count;
                this.itemized_counts = response.itemized_counts;
            })
    }

}
