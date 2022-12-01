import { ITheme } from '../services/theme';
import { IMemberGateway } from '../services/gateway';

export class ShowFeedbacks {
    items = [];
    pageSize = 15;

    constructor(@ITheme readonly theme: ITheme, @IMemberGateway readonly api: IMemberGateway) {
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
                for (const item of this.items) {
                    item.bad = item.bad.replace('\n', '<br>');
                    item.good = item.good.replace('\n', '<br>');
                }
            })
    }

}
