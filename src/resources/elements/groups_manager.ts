import { IUser } from "../../services/user";
import { IDialogService } from "@aurelia/dialog";
import { IMemberGateway } from "../../services/gateway";
import { bindable } from "aurelia";

export class GroupManager {
    @bindable what;
    @bindable group_id;
    new_group_name;
    groups = [];

    constructor(
        @IUser private readonly user: IUser,
        @IDialogService private readonly dialog: IDialogService,
        @IMemberGateway private readonly api: IMemberGateway
    ) {}
}
