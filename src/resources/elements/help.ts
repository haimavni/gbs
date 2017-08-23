import { bindable, autoinject, singleton } from 'aurelia-framework';
import { User } from '../../services/user';
import { MemberGateway } from '../../services/gateway';

@autoinject()
@singleton()
export class HelpCustomElement {
    @bindable topic;
    user;
    api;
    @bindable position = 'top';
    title = "Title";
    content = ""

    constructor(user: User, api: MemberGateway) {
        this.user = user;
        this.api = api;
    }

    attached() {
        this.api.call_server('help/get_help', {topic: this.topic})
        .then(response => {
            this.title = response.title;
            this.content = response.content;
        })

    }
}