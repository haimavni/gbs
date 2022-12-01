import {Theme} from '../services/theme';
import {User} from '../services/user';
import {autoinject} from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';

@autoinject
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
    api: MemberGateway;

    constructor(api: MemberGateway) {
        this.api = api;
    }

    loading(params) {
        this.params = params;
    }

    set_app_activity() {
        this.api.call_server_post('gallery/modify_app_state', {active: this.params.active, app: this.params.app});
    }


}
