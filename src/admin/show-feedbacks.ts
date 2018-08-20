import { autoinject } from "aurelia-framework";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';

@autoinject()
export class ShowFeedbacks {

    theme;
    api;
    router;
    items = [];
    pageSize = 15;

    constructor(theme: Theme, api: MemberGateway) {
        this.theme = theme;
        this.api = api;
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.theme.page_title = "User Feedbacks";
        this.get_feedbacks();
    }

    get_feedbacks() {
        this.api.call_server('default/get_feedbacks')
            .then(response => {
                this.items = response.feedbacks;
                for (let item of this.items) {
                    item.bad = item.bad.replace('\n', '<br>');
                    item.good = item.good.replace('\n', '<br>');
                }
            })
    }

}
