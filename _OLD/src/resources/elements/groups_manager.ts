import { bindable, autoinject } from 'aurelia-framework';
import { User } from '../../services/user';
import { DialogService } from 'aurelia-dialog';
import { MemberGateway } from '../../services/gateway';

@autoinject()
export class GroupManager {
    user;
    dialog;
    api;
    @bindable what;
    @bindable group_id;
    new_group_name;
    groups = [];

    constructor(user: User, dialog: DialogService, api: MemberGateway) {
        this.user = user;
        this.dialog = dialog;
        this.api = api;
    }
}
