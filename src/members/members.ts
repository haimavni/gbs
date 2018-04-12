import { autoinject, singleton, computedFrom } from "aurelia-framework";
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
    _members = [];
    memberList;
    selectedId;
    faces_per_line = 8;
    win_width;
    theme;
    sorting_options;
    selected_members = new Set([]);
    order = '';
    member_group_list;
    caller_id;
    caller_type;
    relatives_mode = false;
    relative_list;
    relatives_path;
    origin_member_id;
    other_member_id;
    only_unapproved = "";
    approval_options;

    constructor(user: User, api: MemberGateway, eventAggregator: EventAggregator, memberList: MemberList, theme: Theme, i18n: I18N, router: Router) {
        this.user = user;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this._members = [];
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('NewMemberAdded', member_details => {
            this.member_added(member_details);
        });
        this.sorting_options = [
            { value: "selected;-has_profile_photo", name: this.i18n.tr('members.random-order') },
            { value: "selected;last_name;first_name", name: this.i18n.tr('members.by-last-name') },
            { value: "selected;first_name;last_name;first_name", name: this.i18n.tr('members.by-first-name') },
            { value: "selected;-birth_date", name: this.i18n.tr('members.by-age-young-first') },
            { value: "selected;birth_date", name: this.i18n.tr('members.by-age-old-first') }
        ];
        this.approval_options = [
            {value: '', name: this.i18n.tr('members.all-members')},
            {value: 'x', name: this.i18n.tr('members.unapproved-only')}
        ];

    }

    activate(params, routeConfig) {
        return this.memberList.getMemberList().then(members => {
            this._members = members.member_list;
            for (let member of this._members) {
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
                for (let member of this._members) {
                    if (this.selected_members.has(member.id)) {
                        member.selected = 1;
                    } else {
                        member.selected = 0;
                    }
                }

            }
            this.win_width = window.outerWidth;
            this.theme.display_header_background = true;
        });
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = (this.caller_type) ?  'members.' + this.caller_type : "members.members";
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    select(member) {

        this.selectedId = member.id;
        return true;
    }

    member_added(member_details) {
        //todo: experiments
        this._members = this._members.splice(0, 0, { name: member_details.name, gender: member_details.gender, id: member_details.id });
    }

    not_ready(member) {
        return member.visibility < 2 && !this.user.editing;
    }

    order_changed(event) {
        this.memberList.sort_member_list(this.order);
    }

    toggle_selection(member, event) {
        if (member.selected) {
            member.selected = 0;
            this.selected_members.delete(member.id)
        } else {
            this.selected_members.add(member.id)
            member.selected = 1;
        }
        if (this.relatives_mode) {
            let n = this.selected_members.size;
            if (n == 2) {
                this.other_member_id = member.id;
                this.get_relatives_path();
            } else if (n == 1 && member.selected == 0) { //we just unselected the other member
                this.relatives_path = null; // only one member is selected now
                if (member.id == this.origin_member_id) { //other member becomes origin,
                    this.origin_member_id = member.id;
                    this.calc_relative_list();
                }
                this.other_member_id = null;
            } else {
                this.relatives_mode = false;
                this.relatives_path = null;
                this.relative_list = null;
            }
        }
    }

    get_relatives_path() {
        this.api.call_server_post('members/get_relatives_path', { origin_member_id: this.origin_member_id, other_member_id: this.other_member_id })
            .then(response => {
                this.build_relatives_path(response.relatives_path);
            });
    }

    calc_relative_list() {
        let lst = Array.from(this.selected_members);
        let member_id = lst[0];
        this.origin_member_id = member_id;
        this.api.call_server_post('members/get_all_relatives', { member_id: member_id })
            .then(response => {
                this.build_relative_list(response.relative_list);
                this.relatives_mode = true;
            });
    }

    toggle_relatives_mode() {
        if (this.relatives_mode) {
            this.relative_list = null;
            this.relatives_path = null;
            this.relatives_mode = false;
        } else {
            this.filter = "";
            this.calc_relative_list();
        }
    }

    private build_relative_list(lst) {
        let member_index = this.build_member_index();
        let relatives = [];
        for (let level of lst) {
            for (let member_id of level) {
                relatives.push(member_index[member_id])
            }
        }
        this.relative_list = relatives;;
    }

    build_relatives_path(lst) {
        let member_index = this.build_member_index();
        let relatives_path = [];
        for (let mid of lst) {
            relatives_path.push(member_index[mid])
        }
        this.relatives_path = relatives_path;
    }

    private build_member_index() {
        let result = {};
        for (let member of this._members) {
            result[member.id] = member;
        }
        return result;
    }

    member_clicked(member, event) {
        if (event.ctrlKey) {
            this.toggle_selection(member, event);
        } else {
            event.stopPropagation();
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
        for (let member of this._members) {
            member.selected = 0;
        }
        this.selected_members = new Set();
    }

    @computedFrom('_members', 'relative_list', 'relatives_path')
    get members() {
        if (this.relatives_path) {
            return { ignore: true, arr: this.relatives_path }
        }
        if (this.relative_list) {
            return this.relative_list
        }
        return this._members;
    }

}