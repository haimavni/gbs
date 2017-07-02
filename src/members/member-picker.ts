import { autoinject, inject } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';
import { DialogController } from 'aurelia-dialog';
import { Router } from 'aurelia-router';

@autoinject()
export class MemberPicker {

    filter = "";
    gender = "";
    face_identifier = false;
    user;
    eventAggregator;
    members = [];
    memberList;
    selectedId;
    dialogController;
    make_profile_photo = false;
    router;

    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList, dialogController: DialogController, router: Router) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        this.dialogController = dialogController;
        console.log("user " + " editing: " + this.user.editing);
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialogController = dialogController;
        this.router = router;
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
        this.face_identifier = model.face_identifier;
        /*this.filter = this.memberList.member_name(model.member_id)*/
        this.memberList.get_member_by_id(model.member_id)
            .then(result => this.filter = result.name)
    }

    select(member) {
        console.log("selected member ${member.id}");
        this.dialogController.ok({ member_id: member.id, make_profile_photo: this.make_profile_photo });
    }

    create_new_member() {
        this.router.navigateToRoute('member-details', {id: 'new'});
        this.dialogController.ok();
    }

}