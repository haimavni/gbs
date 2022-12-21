import { bindable, IDialogService } from 'aurelia';
import { IUser } from '../../services/user';
import { IMemberGateway } from '../../services/gateway';

export class GroupManager {
    @bindable what;
    @bindable group_id;
    new_group_name;
    groups = [];

    constructor(
        @IUser readonly user: IUser,
        @IDialogService readonly dialog: IDialogService,
        @IMemberGateway readonly api: IMemberGateway
    ) {

    }
}
