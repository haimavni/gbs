import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { computedFrom } from 'aurelia-framework';

@autoinject()
export class MemberEdit {
    user;
    eventAggregator;
    api;
    router;
    i18n;
    member;
    member_orig;
    dialog;

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialog = dialog;

    }

    activate(member) {
        this.member = member;
        this.member_orig = deepClone(this.member);
    }


    @computedFrom('member.first_name', 'member.last_name', 'member.former_last_name', 'member.former_first_name', 'member.PlaceOfBirth',
        'member.birth_date', 'member.date_of_death', 'member.NickName', 'member.gender')
    get dirty() {
        return JSON.stringify(this.member) != JSON.stringify(this.member_orig);
    }

    @computedFrom('member.first_name', 'member.last_name', 'member.former_last_name', 'member.former_first_name', 'member.PlaceOfBirth',
        'member.birth_date', 'member.date_of_death', 'member.NickName', 'member.gender')
    get clean() {
        return JSON.stringify(this.member) === JSON.stringify(this.member_orig);
    }

    prev_member() {
        if (this.dirty) {
            return
        }
        this.handle_member(this.member.id, 'prev');
    }

    next_member() {
        if (this.dirty) {
            return
        }
        this.handle_member(this.member.id, 'next');
    }

    handle_member(member_id, direction) {

    }

    cancel_edit_mode() {
        this.member = deepClone(this.member_orig);
    }


    toggle_gender() {
        if (this.member.gender == 'F') {
            this.member.gender = 'M'
        }
        else if (this.member.gender == 'M') {
            this.member.gender = 'F'
        }
        else {
            this.member.gender = 'F'
        }
    }
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}
