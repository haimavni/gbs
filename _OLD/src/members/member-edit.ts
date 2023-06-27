import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Misc } from '../services/misc';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
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
    update_info = '';
    misc;
    date_of_birth_valid = "";
    date_of_death_valid = "";
    check_before_saving = false;
    family_type = "mf";

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService, memberList: MemberList, misc: Misc) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.misc = misc;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('EditorContentChanged', () => { this.handle_editor_changed() });
        this.dialog = dialog;
        this.memberList = memberList;
        this.memberList.getMemberList().then(members => {
            this.members = members;
        });
    }

    activate(model) {
        this.member = model.member;
        let parents = this.member.family_connections.parents;
        if (parents) {
            if (parents.pa2) this.family_type = "mm";
            if (parents.ma2) this.family_type = "ff";
        }
        const m = this.member.member_info;
        this.member_info_orig = this.misc.deepClone(m);
        if (this.user.privileges.DATA_AUDITOR)
            m.approved = true;
        this.life_story_orig = this.member.story_info.story_text.slice();
        if (this.user.privileges.DATA_AUDITOR && m.updater_id) {
            let s = ' ' + this.i18n.tr('members.updated-on-date') + ' ';
            this.update_info = m.updater_name + s + m.update_time;
        } else {
            this.update_info = "";
        }
    }

    @computedFrom('member.member_info.first_name', 'member.member_info.last_name', 'member.member_info.former_last_name', 'member.member_info.former_first_name',
        'member.member_info.PlaceOfBirth', 'member.member_info.place_of_death', 'member.member_info.NickName', 'member.member_info.mother_id', 'member.member_info.father_id',
        'member.member_info.date_of_birth.date', 'member.member_info.date_of_death.date', 'member.member_info.cause_of_death',
        'member.member_info.gender', 'member.story_info.life_story', 'member.member_info.visibility', 'member.member_info.approved', 'member.member_info.title',
        'member.member_info.spouse_id')
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
        this.router.navigateToRoute('member-details', { id: member_id, keywords: "" });
    }

    cancel_edit_mode() {
        this.member.member_info = this.misc.deepClone(this.member_info_orig);
    }

    save_edited_data() {
        let data = { user_id: this.user.id };
        if (this.check_before_saving && ! this.dirty_info) {
            this.check_before_saving = false;
            return;
        }
        if (this.dirty_info) {
            if (this.member.member_info.last_name)
                this.member.member_info.last_name = this.member.member_info.last_name.trim();
            this.member.member_info.first_name = this.member.member_info.first_name.trim();
            data['member_info'] = this.member.member_info;
        } else {
            data['member_id'] = this.member.member_info.id;
        }
        let id = this.member.member_info.id;
        const new_member = ! id;
        this.api.call_server_post('members/save_member_info', data)
            .then(response => {
                this.member_info_orig = this.misc.deepClone(this.member.member_info);

                this.life_story_orig = this.member.story_info.story_text;
                this.member = this.misc.deepClone(this.member);
                if (new_member) this.router.navigateToRoute('members');
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

    gender_class(gender) {
        if (this.member.member_info.gender == gender) return "btn-primary";
        if (!this.member.member_info.gender) return "mandatory-missing";
        return "btn-default";
    }

    @computedFrom('member.member_info.gender')
    get gender_class_f() {
        return this.gender_class("F");
    }

    @computedFrom('member.member_info.gender')
    get gender_class_m() {
        return this.gender_class("M");
    }

    set_gender(gender) {
        this.member.member_info.gender = gender;
    }

    trim_first_name() {
        let old = this.member.member_info.first_name;
        this.member.member_info.first_name = this.member.member_info.first_name.trim();
        if (old != this.member.member_info.first_name)
            this.check_before_saving = true;
    }

    trim_last_name() {
        let old = this.member.member_info.last_name;
        this.member.member_info.last_name = this.member.member_info.last_name.trim();
        if (old != this.member.member_info.last_name)
            this.check_before_saving = true;
    }

    handle_editor_changed() {
        alert('editor content changed');
    }

    find_parent(event, parent_gender, parent_num) {
        if (event.ctrlKey)
            return this.remove_parent(parent_gender, parent_num)
        this.dialog.open({
            viewModel: MemberPicker, model: { 
                gender: parent_gender,
                what: "parent",
                child_name: this.member.member_info.full_name, 
                child_id: this.member.member_info.id }, 
                lock: false,
                position: this.setup, 
                rejectOnCancel: true
        }).whenClosed(response => {
            let which_parent = parent_gender == 'M' ? 'father' : 'mother';
            if (parent_num == 2) which_parent += '2'
            const key = which_parent + '_id'
            this.member.member_info[key] = response.output.member_id;
            if (response.output.new_member) {
                let new_member = {
                    gender: parent_gender, 
                    id: this.member.member_info[key], 
                    name: response.output.new_member.name, 
                    facePhotoURL: response.output.new_member.face_url};
                this.memberList.add_member(new_member);
            }
            let parent = this.get_member_data(this.member.member_info[key]);
            this.eventAggregator.publish('ParentFound', {parent: parent, parent_num: parent_num});
        });
    }

    find_spouse(event) {
        const spouses = this.member.family_connections.spouses.map(mem => mem.id);
        const spouse_set = new Set(spouses);
        spouse_set.add(this.member.member_info.id);
        this.dialog.open({
            viewModel: MemberPicker, model: { 
                gender: this.spouse_gender(),
                what: "spouse",
                excluded: spouse_set,
                child_name: this.member.member_info.full_name, 
                child_id: this.member.member_info.id }, 
                lock: false,
                position: this.setup, 
                rejectOnCancel: true
        }).whenClosed(response => {
            if (response.wasCancelled) return;
            this.member.member_info.spouse_id = response.output.member_id;
            let spouse;
            this.memberList.get_member_by_id(this.member.member_info.spouse_id)
            .then(spouse1 => {
                spouse = spouse1;
                this.eventAggregator.publish('SpouseFound', {spouse: spouse});
            });
        });
    }


    remove_parent(parent_gender, parent_num) {
        let who = parent_gender == 'M' ? 'pa' : 'ma';
        if (parent_num == 2) who += '2';
        this.member.family_connections.parents[who] = null;
        this.api.call_server_post('members/remove_parent', {
            member_id: this.member.member_info.id, who: who
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

    @computedFrom('date_of_birth_valid', 'date_of_death_valid', "member.member_info.gender", "member.member_info.first_name", "member.member_info.visibility")
    get incomplete() {
        if (!this.member.member_info.visibility) return '';
        if (this.date_of_birth_valid != 'valid' || this.date_of_death_valid != 'valid' || (this.member.member_info.gender != "F" && this.member.member_info.gender != "M") || ! this.member.member_info.first_name)
            return "disabled"
        if (!this.member.member_info.gender) return "disabled";
        return ''
    }

    setup(modalContainer: Element, modalOverlay: Element) {
    }
    
    set_family_type(ft) {
        this.family_type = ft;
    }

    spouse_gender() {
        if (this.family_type == "ff") return "F";
        if (this.family_type == "mm") return "M";
        if (this.member.member_info.gender == "F") return "M";
        return "F";
    }

    @computedFrom('family_type', 'member.member_info.gender')
    get spouse_label() {
        const gender = this.spouse_gender();
        if (gender == "M") return "husband";
        return "wife";
    }

}
