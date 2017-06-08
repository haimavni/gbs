import { inject, noView, singleton } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import environment from '../environment';

@inject(EventAggregator, MemberGateway)
@noView()
@singleton()
export class MemberList {

    eventAggregator;
    members = [];
    api;

    constructor(eventAggregator, api) {
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.members = null;
        this.eventAggregator.subscribe('MemberDetailsUpdated', member_details => {
            this.update_member_details(member_details.id, member_details);
        });
        this.eventAggregator.subscribe('MemberGotProfilePhoto', payload => {
            this.set_profile_photo(payload.member_id);
        });
    }

    getMemberList(refresh: boolean = false) {
        if (this.members && !refresh) {
            return new Promise(resolve => {
                resolve(this.members)
            })
        } else {
            return this.api.getMemberList().then(members => {
                this.members = members;
                return members;
            })
        }
    }

    get_member_by_id(member_id) {
        if (!member_id) {
            return new Promise(resolve => resolve({ name: "" }))
        }
        return this.getMemberList()
            .then(members => {
                let lst = members.member_list.filter(member => member.id == member_id);
                if (lst && lst.length > 0) {
                    return lst[0];
                }
            });
    }

    update_member_details(member_info) {
        //work in progress
        this.get_member_by_id(member_info.id)
            .then(member => { member.name = member_info.name; });
    }

    set_profile_photo(member_id) {
        this.get_member_by_id(member_id)
            .then(member => { member.facePhotoURL = environment.baseURL + "/gbs/static/gb_photos/profile_photos/PP-" + member_id + '.jpg'; });
    }

}
