import { IMemberGateway } from "../services/gateway";
import { ITheme } from "../services/theme";
import { IUser } from "../services/user";

export class Gallery {
    app_list = [];

    constructor(
        @IMemberGateway private readonly api: IMemberGateway,
        @ITheme private readonly theme: ITheme,
        @IUser private readonly user: IUser
    ) {}

    loading(params) {
        this.api
            .call_server("gallery/apps_for_gallery", {
                developer: this.user.privileges.DEVELOPER,
                editing: this.user.editing,
            })
            .then((response) => {
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
