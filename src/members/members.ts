import { autoinject, singleton } from "aurelia-framework";
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';
import { sort_array } from '../services/sort_array';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';

@autoinject()
@singleton()
export class Members {
    filter = "";
    user;
    i18n;
    router;
    eventAggregator;
    members = [];
    memberList;
    selectedId;
    faces_per_line = 8;
    win_height;
    win_width;
    theme;
    sorting_options;
    selected_members = new Set([]);
    order = '';

    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList, theme: Theme, i18n: I18N, router: Router) {
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('NewMemberAdded', member_details => {
            this.member_added(member_details);
        });
        this.sorting_options = [
            { value: "-has_profile_photo", name: this.i18n.tr('members.random-order')},
            { value: "last_name;first_name", name: this.i18n.tr('members.by-name') },
            { value: "-birth_date", name: this.i18n.tr('members.by-age-young-first') },
            { value: "birth_date", name: this.i18n.tr('members.by-age-old-first') }
        ];

    }

    created() {
        return this.memberList.getMemberList().then(members => {
            this.members = members.member_list;
            for (let member of this.members) {
                member.rand = Math.random() * 1000;
            }
            //this.members.sort((m1, m2) => m2.has_profile_photo * 10000 + m2.rand - (m1.has_profile_photo * 10000 + m1.rand));
        })
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
    }

    detached() {
        this.theme.display_header_background = false;
    }

    select(member) {

        this.selectedId = member.id;
        return true;
    }

    member_added(member_details) {
        //todo: experiments
        this.members = this.members.splice(0, 0, { name: member_details.name, gender: member_details.gender, id: member_details.id });
    }

    not_ready(member) {
       return  member.visibility<2 && ! this.user.editing;
    }

    order_changed(event) {
        this.memberList.sort_member_list(this.order);
    }

    toggle_selection(member) {
        if (member.selected) {
            member.selected = null;
            this.selected_members.delete(member.id)
        } else {
            this.selected_members.add(member.id)
            member.selected = 'selected';
        }
    }
    
    member_clicked(member, event) {
        if (event.ctrlKey) {
            this.toggle_selection(member);
        } else {
            this.router.navigateToRoute('member-details', { id: member.id });
        }
    }

    save_member_group() {
    }

    load_member_group() {
        
    }

    clear_member_group() {
        
    }



}