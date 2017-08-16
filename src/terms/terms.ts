import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';

@autoinject
export class Terms {
    filter = "";
    term_list = [];
    api;
    user;
    i18n;

    constructor(api: MemberGateway, user: User, i18n: I18N) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
    }

    created(params, config) {
        this.api.call_server('members/get_term_list', {})
            .then(result => {
                this.term_list = result.term_list;
            });
    }

}
