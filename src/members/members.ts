import { autoinject } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberList } from '../services/member_list';

@autoinject()
export class Members {

    filter = "";
    user;
    eventAggregator;
    members = [];
    memberList;
    selectedId;

    constructor(user: User, eventAggregator: EventAggregator, memberList: MemberList) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.members = [];
        console.log("user " + " editing: " + this.user.editing);
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('NewMemberAdded', member_details => {
            this.member_added(member_details);
        });

    }

    created() {
        return this.memberList.getMemberList().then(members => {
            this.members = members.member_list;
            console.log("members created. length: ", this.members.length);
        })
    }

    select(member) {

        this.selectedId = member.id;
        return true;
    }

    member_added(member_details) {
        //todo: experiments
        console.log("member added ", member_details);
        this.members = this.members.splice(0, 0, { name: member_details.name, gender: member_details.gender, id: member_details.id });
    }

}