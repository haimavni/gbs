import { autoinject, singleton } from "aurelia-framework";
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';
import { sort_array } from '../services/sort_array';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';

@autoinject()
@singleton()
export class Members {
    filter = "";
    user;
    api;
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
    member_group_list;
    caller_id;
    caller_type;

    constructor(user: User, api: MemberGateway, eventAggregator: EventAggregator, memberList: MemberList, theme: Theme, i18n: I18N, router: Router) {
        this.user = user;
        this.api = api;
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
            { value: "selected;-has_profile_photo", name: this.i18n.tr('members.random-order') },
            { value: "selected;last_name;first_name", name: this.i18n.tr('members.by-name') },
            { value: "selected;-birth_date", name: this.i18n.tr('members.by-age-young-first') },
            { value: "selected;birth_date", name: this.i18n.tr('members.by-age-old-first') }
        ];

    }

    activate(params, routeConfig) {
        console.log("activate members: params ", params, ' router config ', routeConfig);
        return this.memberList.getMemberList().then(members => {
            this.members = members.member_list;
            for (let member of this.members) {
                member.rand = Math.random() * 1000;
            }
            if (routeConfig.name == 'associate-members') {
                this.caller_id = params.caller_id;
                this.caller_type = params.caller_type;
                let arr;
                if (params.associated_members) {
                    arr = params.associated_members.map(i => Number(i));
                } else {
                    arr = [];
                }
                this.selected_members = new Set(arr);
                for (let member of this.members) {
                    if (this.selected_members.has(member.id)) {
                        member.selected = 1;
                    } else {
                        member.selected = 0;
                    }
                }

            }
            this.win_height = window.outerHeight;
            this.win_width = window.outerWidth;
            this.theme.display_header_background = true;
        });
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
        return member.visibility < 2 && !this.user.editing;
    }

    order_changed(event) {
        this.memberList.sort_member_list(this.order);
    }

    toggle_selection(member) {
        if (member.selected) {
            member.selected = 0;
            this.selected_members.delete(member.id)
        } else {
            this.selected_members.add(member.id)
            member.selected = 1;
        }
    }

    member_clicked(member, event) {
        if (event.ctrlKey) {
            this.toggle_selection(member);
        } else {
            this.router.navigateToRoute('member-details', { id: member.id });
        }
    }

    save_member_group(group_id) {
        let member_ids = Array.from(this.selected_members);
        //member_ids = member_ids.map(m => Number(m));
        this.api.call_server_post('members/save_group_members',
            { user_id: this.user.id, caller_id: this.caller_id, caller_type: this.caller_type, member_ids: member_ids })
            .then(response => {
                this.clear_member_group();
                history.back();
            });
    }

    clear_member_group() {
        for (let member of this.members) {
            member.selected = 0;
        }
        this.selected_members = new Set();
    }

}