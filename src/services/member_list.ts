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
        this.eventAggregator.subscribe('NewMemberAdded', member_details => {
            this.member_added(member_details.id, member_details);
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

    update_member_details(member_id: number, member_info: any) {
        this.get_member_by_id(member_id)
            .then(member => { 
                member.name = member_info.name; 
                member.gender = member_info.gender;
            });
    }

    member_added(member_id: number, member_info: any) {
        //todo: experiments
        console.log("adding member ", member_id, ': ", member_info');
        this.members = this.members.splice(0, 0, {name: member_info.name, gender: member_info.gender, id: member_id});
    }


    set_profile_photo(member_id) {
        this.get_member_by_id(member_id)
            .then(member => { member.facePhotoURL = environment.baseURL + "/gbs/static/gb_photos/gbs/photos/profile_photos/PP-" + member_id + '.jpg'; });
    }

}
