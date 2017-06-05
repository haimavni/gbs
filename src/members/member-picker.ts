import { autoinject, inject } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';
import { DialogController } from 'aurelia-dialog';

@autoinject()
export class MemberPicker {

    filter = "";
    gender = "";
    user;
    eventAggregator;
    members = [];
    memberList;
    selectedId;
    dialogController;


    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList, dialogController: DialogController) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        this.dialogController = dialogController;
        console.log("user " + " editing: " + this.user.editing);
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialogController = dialogController;
    }

    created() {
        return this.memberList.getMemberList().then(members => {
            let parents = members.member_list.slice();
            if (this.gender) {
                parents = parents.filter(member => member.gender == this.gender);
            }
            this.members = parents;
        })
    }

    activate(model) {
        this.gender = model.gender;
    }

    select(member) {
        console.log("selected member ${member.id}");
        this.dialogController.ok({ member_id: member.id });
    }

}