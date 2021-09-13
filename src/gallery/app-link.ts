import {Theme} from '../services/theme';
import {User} from '../services/user';
import {autoinject} from 'aurelia-framework';

@autoinject
export class AppLink {
    params = {
        host: "",
        app: "",
        app_name: "",
        app_description: "",
        logo_path: "",
        cover_photo: "",
        allow_publishing: false
    }

    activate(params) {
        this.params = params;
    }


}
