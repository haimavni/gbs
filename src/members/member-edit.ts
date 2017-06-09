import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { computedFrom } from 'aurelia-framework';
import { MemberPicker } from "../members/member-picker";
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
    }

    activate(member) {
        this.member = member;
        this.member_info_orig = deepClone(this.member.member_info);
        this.life_story_orig = member.story_info.story_text.slice();
    }

    @computedFrom('member.member_info.first_name', 'member.member_info.last_name', 'member.member_info.former_last_name', 'member.member_info.former_first_name', 'member.member_info.PlaceOfBirth',
        'member.member_info.birth_date', 'member.member_info.date_of_death', 'member.member_info.NickName', 'member.member_info.gender', 'member.story_info.life_story')
    get dirty_info() {
        let dirty = JSON.stringify(this.member.member_info) != JSON.stringify(this.member_info_orig);
        this.eventAggregator.publish('DirtyInfo', dirty);
        return dirty;
    }

    @computedFrom('member.story_info.story_text')
    get dirty_story() {
        let dirty = this.member.story_info.story_text != this.life_story_orig;
        this.eventAggregator.publish('DirtyStory', dirty);
        console.log('dirty story? ' + dirty);
        return dirty;
    }

    prev_member() {
        this.handle_member(this.member.member_info.id, 'prev');
    }

    next_member() {
        this.handle_member(this.member.member_info.id, 'next');
    }

    handle_member(member_id, direction) {

    }

    cancel_edit_mode() {
        this.member.member_info = deepClone(this.member_info_orig);
    }

    save_edited_data() {
        let data = {};
        if (this.dirty_info) {
            data['member_info'] = this.member.member_info;
        } else {
            data['member_id'] = this.member.member_info.id;
        }
        if (this.dirty_story) {
            let story_info = { story_id: this.member.member_info.story_id, story_text: this.member.story_info.story_text.replace(/\&/g, '~1').replace(/;/g, '~2') }
            data['story_info'] = story_info;
        }
        this.api.call_server_post('stories/save_member_info', data)
            .then(response => {
                this.member_info_orig = deepClone(this.member.member_info);

                this.life_story_orig = this.member.story_info.story_text;
                this.member = deepClone(this.member);
                this.eventAggregator.publish('MemberDetailsUpdated', this.member.member_info);
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
        this.dialog.open({ viewModel: MemberPicker, model: { gender: 'M' }, lock: false, position: this.setup, rejectOnCancel: true }).whenClosed(response => {

            this.member.member_info.father_id = response.output.member_id;
            this.member.member_info = deepClone(this.member.member_info);
            let father = this.get_member_data(this.member.member_info.father_id);
            this.eventAggregator.publish('ParentFound', father);
        });
    }

    find_mother() {
        this.dialog.open({ viewModel: MemberPicker, model: { gender: 'F' }, lock: false, position: this.setup, rejectOnCancel: true }).whenClosed(response => {
            this.member.member_info.mother_id = response.output.member_id;
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
        console.log("Hi, I am in setup!")
    }

}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}
