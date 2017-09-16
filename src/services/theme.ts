import { autoinject, singleton, noView } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';

@autoinject()
@singleton()
@noView()
export class Theme {
    api;
    files: {};

    constructor(api: MemberGateway) {
        this.api = api;
        this.api.call_server('members/get_theme_data')
            .then(response => this.files = response.files);
    }
}

