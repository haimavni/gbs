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
    }

    created() {
        return this.memberList.getMemberList().then(members => {
            this.members = members.member_list;
        })
      }
        
    select(member) {
        this.selectedId = member.id;
        return true;
    }

}