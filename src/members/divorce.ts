
import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {Theme} from '../services/theme';
import { MemberList } from '../services/member_list';

@autoinject()
export class Divorce {
    member_stories = {lst: [], changed: 0};
    dialogController;
    theme: Theme;
    member_id;
    member_name: string;
    spouse_name: string;
    spouse_id;
    member_list;

    constructor(dialogController: DialogController, theme: Theme, member_list: MemberList) {
        this.dialogController = dialogController;
        this.theme = theme;
        this.member_list  = member_list;
    }

    async activate(model) {
        this.member_id = model.member_id;
        this.spouse_id = model.spouse_id;
        let member;
        let spouse;
        await this.member_list.get_member_by_id(this.member_id)
            .then(result => {member = result;});
        await this.member_list.get_member_by_id(this.spouse_id)
            .then(result => {spouse = result;});
        console.log("spouse: ", spouse, " member: ", member);
        this.member_name = member.first_name;
        this.spouse_name = spouse.first_name;
    }

    do_divorce(hide_spouse=false) {
        console.log("divorce. hide? ", hide_spouse);
        this.dialogController.ok({hide_spouse: hide_spouse});
    }

    cancel() {
        this.dialogController.cancel();
    }

}
