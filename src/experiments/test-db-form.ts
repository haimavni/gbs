import { IUser } from "../services/user";
import { IMisc } from "../services/misc";
import { IMemberGateway } from "../services/gateway";
import { IDialogService } from "@aurelia/dialog";
import { Query } from "../services/query/query";

export class TestDbForm {
    val: any;
    what = "data-entry";

    constructor(
        @IUser private readonly user: IUser,
        @IMisc private readonly misc: IMisc,
        @IMemberGateway private readonly api: IMemberGateway,
        @IDialogService private readonly dialog: IDialogService
    ) {}

    select_what(what) {
        this.what = what;
    }

    open_query_editor() {
        console.log("dialog: ", this.dialog);
        this.dialog.open({ component: () => Query, model: {}, lock: false });
    }
}
