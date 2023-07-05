import {ITheme} from '../services/theme';
import {IUser} from '../services/user';
import { IMemberGateway } from '../services/gateway';

export class AppLink {
    params = {
        host: "",
        app: "",
        app_name: "",
        app_description: "",
        logo_path: "",
        cover_photo: "",
        allow_publishing: false,
        active: false
    }

    constructor(@IMemberGateway private readonly api: IMemberGateway) {

    }

    activate(params) {
        this.params = params;
    }

    set_app_activity() {
        this.api.call_server_post('gallery/modify_app_state', {active: this.params.active, app: this.params.app});
    }


}
