import { autoinject, inject, computedFrom } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';
import { DialogController } from 'aurelia-dialog';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';

@autoinject()
export class MemberPicker {

    filter = "";
    gender = "";
    face_identifier = false;
    face;
    slide;
    user;
    eventAggregator;
    members = [];
    memberList;
    selectedId;
    dialogController;
    make_profile_photo = false;
    router;
    candidates = [];
    excluded = new Set();
    api;
    child_name;
    child_id;
    member_id;
    i18n;
    agent = {size: 9999};

    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList, dialogController: DialogController, router: Router, api: MemberGateway, i18n: I18N) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        this.dialogController = dialogController;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.router = router;
        this.api = api;
        this.i18n = i18n;
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
            this.members = this.members.filter(member => member.id == this.member_id || ! this.excluded.has(member.id))
        })
    }

    activate(model) {
        this.child_id = model.child_id;
        this.gender = model.gender;
        this.child_name = model.child_name;  //the child for whom we select paent
        this.face_identifier = model.face_identifier;
        this.face = model.current_face;
        this.slide = model.slide;
        this.candidates = model.candidates ? model.candidates : [];
        this.excluded = model.excluded ? model.excluded : new Set();
        this.filter = '';
        this.member_id = model.member_id;
        if (model.member_id) {
            this.memberList.get_member_by_id(model.member_id)
                .then(result => {
                    this.filter = result.first_name + ' ' + result.last_name;
                })
        }
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
            let parent_of = (this.gender == 'M') ? this.i18n.tr('members.pa-of') : this.i18n.tr('members.ma-of');
            this.api.call_server('members/create_parent', { gender: this.gender, child_name: this.child_name, child_id: this.child_id, parent_of: parent_of })
                .then(response => {
                    this.dialogController.ok({
                        member_id: response.member_id, new_member: response.member
                    });
                })
        } else {
            let default_name = this.i18n.tr('members.default-name');
            this.api.call_server('members/create_new_member', { photo_id: this.slide.photo_id, face_x: this.face.x, face_y: this.face.y, face_r: this.face.r, name: this.filter, default_name: default_name })
                .then(response => {
                    this.dialogController.ok({
                        member_id: response.member_id, new_member: response.member
                    });
                });
        }
    }

    @computedFrom('user.editing')
    get place_holder() {
        let key = 'members.filter';
        if (this.user.editing) key += '-can-add';
        return this.i18n.tr(key);
    }

}
