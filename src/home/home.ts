import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';

@autoinject
export class Home {
    api;
    photo_list = [];

    constructor(api: MemberGateway) {
        console.log("at home. constructor.")
        this.api = api;
    }

    created(params, config) {
        this.update_photo_list();
    }

    attched() {
        console.log("at home. attached.")
        this.update_photo_list();
    }

    update_photo_list() {
        return this.api.call_server_post('members/get_photo_list')
            .then(result => {
                this.photo_list = result.photo_list;
            });
    }

}