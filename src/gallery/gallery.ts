import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';
import { Theme } from '../services/theme';
import { User } from '../services/user';

@autoinject
export class Gallery {
    api: MemberGateway;
    app_list = [];
    theme: Theme;
    user: User;

    constructor(api: MemberGateway, theme: Theme, user: User) {
        this.api = api;
        this.theme = theme;
        this.user = user;
    }

    activate(params, routeConfig) {
        this.api.call_server('gallery/apps_for_gallery', {developer: this.user.privileges.DEVELOPER, editing: this.user.editing})
            .then(response => {
                this.app_list = response.app_list;
            });

    }

    attached() {
        // this.theme.display_header_background = true;
        // this.theme.hide_title = true;
        // this.theme.hide_menu = true;
        this.theme.page_title = "gallery.gallery";
    }

}
