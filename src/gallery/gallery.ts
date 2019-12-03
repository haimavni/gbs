import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';

@autoinject
export class Gallery {
    api: MemberGateway;
    frame_urls = [];

    constructor(api: MemberGateway) {
        this.api = api;
    }

    activate(params, routeConfig) {
        this.api.call_server('init_app/get_frame_list', {})
            .then(response => {
                this.frame_urls = response.frame_urls;
            });

    }

    zevel() { }

}
