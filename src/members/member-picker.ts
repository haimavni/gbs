import { autoinject, inject } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';
import { DialogController } from 'aurelia-dialog';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';

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
    candidates = [];
    api;
    child_name;

    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList, dialogController: DialogController, router: Router, api: MemberGateway) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        this.dialogController = dialogController;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialogController = dialogController;
        this.router = router;
        this.api = api;
    }

    created() {
        return this.memberList.getMemberList().then(members => {
            let parents = members.member_list.slice();
            if (this.gender) {
                parents = parents.filter(member => member.gender == this.gender);
            }
            this.members = parents;
            if (this.candidates) {
                this.reorder_members_candidates_first();
            }
        })
    }

    activate(model) {
        this.gender = model.gender;
        this.child_name = model.child_name;
        this.face_identifier = model.face_identifier;
        this.candidates = model.candidates ? model.candidates : [];
        /*this.filter = this.memberList.member_name(model.member_id)*/
        this.memberList.get_member_by_id(model.member_id)
            .then(result => this.filter = result.name)
    }

    reorder_members_candidates_first() {
        let cand_ids = this.candidates.map(cand => cand.member_id);
        let cand_set = new Set(cand_ids);
        for (let m of this.members) {
            m.score = cand_set.has(m.id) ? 0 : 1;
        }
        this.members.sort((a, b) => a.score - b.score);
    }

    select(member) {
        this.dialogController.ok({ member_id: member.id, make_profile_photo: this.make_profile_photo });
    }

    create_new_member() {
        if (this.gender) {
            this.api.call_server('members/create_parent', { gender: this.gender, child_name: this.child_name }).then(response => {
                this.dialogController.ok({ member_id: response.member_id, new_member: response.member });
            })
        } else {
            this.api.call_server('members/create_new_member', {})  //todo: not ready. when ready, remove if.bind in the html file
        }
    }

}