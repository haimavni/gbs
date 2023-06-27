import { autoinject, computedFrom } from "aurelia-framework";
import { DialogController } from "aurelia-dialog";
import { Theme } from "../services/theme";
import { MemberList } from "../services/member_list";

@autoinject()
export class Divorce {
    member_stories = { lst: [], changed: 0 };
    dialogController;
    theme: Theme;
    member_id;
    member_name: string;
    spouse_name: string;
    spouse_id;
    member_list;

    constructor(
        dialogController: DialogController,
        theme: Theme,
        member_list: MemberList
    ) {
        this.dialogController = dialogController;
        this.theme = theme;
        this.member_list = member_list;
    }

    async activate(model) {
        this.member_id = model.member_id;
        let mem_id = model.mem_id;
        if (model.who == "spouse") this.spouse_id = model.mem_id;
        else {
            let child_rec;
            await this.member_list.get_member_by_id(mem_id).then((result) => {
                child_rec = result;
                if (child_rec.parent_ids.length != 2) this.dialogController.cancel();
                for (let mid of child_rec.parent_ids) {
                    if (mid != this.member_id)
                        this.spouse_id = mid;
                }
            });
        }
        let member;
        let spouse;
        await this.member_list
            .get_member_by_id(this.member_id)
            .then((result) => {
                member = result;
            });
        await this.member_list
            .get_member_by_id(this.spouse_id)
            .then((result) => {
                spouse = result;
            });
        this.member_name = member.first_name;
        this.spouse_name = spouse.first_name;
    }

    do_divorce(hide_spouse = false) {
        this.dialogController.ok({ hide_spouse: hide_spouse, spouse_id: this.spouse_id });
    }

    undo_divorce() {
        this.dialogController.ok({what: 'undo-divorce', spouse_id: this.spouse_id});
    }
}
