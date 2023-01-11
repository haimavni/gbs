import { autoinject, singleton } from "aurelia-framework";
import { User } from "../services/user";
import { Misc } from "../services/misc";
import { MemberGateway } from "../services/gateway";
import { DialogService } from "aurelia-dialog";
import { Query } from "../services/query/query";

@autoinject
@singleton()
export class TestDbForm {
    val: any;
    user: User;
    misc: Misc;
    api;
    what = 'data-entry';
    dialog;

    constructor(user: User, misc: Misc, api: MemberGateway, dialog: DialogService) {
        this.user = user;
        this.misc = misc;
        this.api = api;
        this.dialog = dialog;
    }

    select_what(what) {
        this.what = what;
    }

    open_query_editor() {
        console.log("dialog: ", this.dialog)
        this.dialog.open({ viewModel: Query, model: {}, lock: false })
    }

}
