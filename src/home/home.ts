import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';

@autoinject
export class Home {
    api;
    photo_list;

    constructor(api: MemberGateway) {
        console.log("at home. constructor.")
        this.api = api;
        this.photo_list = this.api.call_server_post('members/get_photo_list');
    }

    action(slide, event) {
        console.log(" action on slide: ", slide, " event: ", event);
    }

}