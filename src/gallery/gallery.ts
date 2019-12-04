import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';
import { Theme } from '../services/theme';

@autoinject
export class Gallery {
    api: MemberGateway;
    frame_urls = [];
    theme;

    constructor(api: MemberGateway, theme: Theme) {
        this.api = api;
        this.theme = theme;
    }

    activate(params, routeConfig) {
        this.api.call_server('init_app/get_frame_list', {})
            .then(response => {
                this.frame_urls = response.frame_urls;
            });

    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.theme.page_title = "gallery.gallery";
    }

}
