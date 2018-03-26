import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { computedFrom } from 'aurelia-framework';
import { MemberPicker } from "./member-picker";
import { MemberList } from '../services/member_list';

@autoinject()
export class MemberEdit {
    user;
    eventAggregator;
    api;
    router;
    i18n;
    member;
    memberList;
    members;
    member_info_orig;
    life_story_orig;
    dialog;

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService, memberList: MemberList) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('EditorContentChanged', () => { this.handle_editor_changed() });
        this.dialog = dialog;
        this.memberList = memberList;
        this.memberList.getMemberList().then(members => {
            this.members = members;
        });
    }

    activate(member) {
        this.member = member;
        this.member_info_orig = deepClone(this.member.member_info);
        this.life_story_orig = member.story_info.story_text.slice();
    }

    @computedFrom('member.member_info.first_name', 'member.member_info.last_name', 'member.member_info.former_last_name', 'member.member_info.former_first_name', 
                  'member.member_info.PlaceOfBirth', 'member.member_info.place_of_death', 'member.member_info.NickName', 
                  'member.member_info.date_of_birth.date', 'member.member_info.date_of_death.date', 'member.member_info.cause_of_death',
                  'member.member_info.gender', 'member.story_info.life_story', 'member.member_info.visibility')
    get dirty_info() {
        let dirty = JSON.stringify(this.member.member_info) != JSON.stringify(this.member_info_orig);
        this.eventAggregator.publish('DirtyInfo', dirty);
        return dirty;
    }

    prev_member() {
        this.handle_member(this.member.member_info.id, 'prev');
    }

    next_member() {
        this.handle_member(this.member.member_info.id, 'next');
    }

    handle_member(member_id, direction) {
        if (this.dirty_info) return;
        let dif = direction == "next" ? +1 : -1;
        let member_idx = this.members.member_list.findIndex(mem => mem.id == member_id);
        let n = this.members.member_list.length;
        member_idx = (member_idx + n + dif) % n;
        member_id = this.members.member_list[member_idx].id;
        this.router.navigateToRoute('member-details', { id: member_id });
    }

    cancel_edit_mode() {
        this.member.member_info = deepClone(this.member_info_orig);
    }

    save_edited_data() {
        let data = { user_id: this.user.id };
        if (this.dirty_info) {
            data['member_info'] = this.member.member_info;
        } else {
            data['member_id'] = this.member.member_info.id;
        }
        let id = this.member.member_info.id;
        this.api.call_server_post('members/save_member_info', data)
            .then(response => {
                this.member_info_orig = deepClone(this.member.member_info);

                this.life_story_orig = this.member.story_info.story_text;
                this.member = deepClone(this.member);
           });
    }

    toggle_gender() {
        if (this.member.member_info.gender == 'F') {
            this.member.member_info.gender = 'M'
        }
        else if (this.member.member_info.gender == 'M') {
            this.member.member_info.gender = 'F'
        }
        else {
            this.member.member_info.gender = 'F'
        }
    }

    handle_editor_changed() {
        alert('editor content changed');
    }

    find_father() {
        this.dialog.open({
            viewModel: MemberPicker, model: { gender: 'M', child_name: this.member.member_info.full_name }, lock: false,
            position: this.setup, rejectOnCancel: true
        }).whenClosed(response => {
            this.member.member_info.father_id = response.output.member_id;
            if (response.output.new_member) {
                this.memberList.member_added(response.output.new_member);
            }
            this.member.member_info = deepClone(this.member.member_info);
            let father = this.get_member_data(this.member.member_info.father_id);
            this.eventAggregator.publish('ParentFound', father);
        });
    }

    find_mother() {
        this.dialog.open({
            viewModel: MemberPicker, model: { gender: 'F', child_name: this.member.member_info.full_name }, lock: false,
            position: this.setup, rejectOnCancel: true
        }).whenClosed(response => {
            this.member.member_info.mother_id = response.output.member_id;
            if (response.output.new_member) {
                this.memberList.member_added(response.output.new_member);
            }
            this.member.member_info = deepClone(this.member.member_info);
            let mother = this.get_member_data(this.member.member_info.mother_id);
            this.eventAggregator.publish('ParentFound', mother);
        });
    }

    get_member_data(member_id) {
        let candidates = this.memberList.members.member_list.filter(member => member.id == member_id);
        if (candidates) {
            return candidates[0]
        }
        else {
            return {}
        }
    }

    setup(modalContainer: Element, modalOverlay: Element) {
    }

}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}
