import { autoinject, singleton } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';

@autoinject()
@singleton()
export class Members {

    filter = "";
    user;
    eventAggregator;
    members = [];
    memberList;
    selectedId;
    faces_per_line = 8;
    win_height;
    win_width;

    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('NewMemberAdded', member_details => {
            this.member_added(member_details);
        });

    }

    created() {
        return this.memberList.getMemberList().then(members => {
            this.members = members.member_list;
            for (let member of this.members) {
                member.rand = Math.random() * 1000;
            }
            this.members.sort((m1, m2) => m2.has_profile_photo * 10000 + m2.rand - (m1.has_profile_photo * 1000 + m1.rand));
        })
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
    }

    detached() {
    }

    select(member) {

        this.selectedId = member.id;
        return true;
    }

    member_added(member_details) {
        //todo: experiments
        this.members = this.members.splice(0, 0, { name: member_details.name, gender: member_details.gender, id: member_details.id });
    }

}