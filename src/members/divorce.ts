import { IDialogController } from "@aurelia/dialog";
import { ITheme } from "../services/theme";
import { IMemberList } from "../services/member_list";
export class Divorce {
    member_stories = { lst: [], changed: 0 };
    member_id;
    member_name: string;
    spouse_name: string;
    spouse_id;

    constructor(
        @IDialogController private readonly dialogController: IDialogController,
        @ITheme private readonly theme: ITheme,
        @IMemberList private readonly member_list: IMemberList
    ) {

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
