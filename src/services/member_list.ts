import { inject, noView, singleton } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import environment from '../environment';

@inject(EventAggregator, MemberGateway)
@noView()
@singleton()
export class MemberList {

    eventAggregator;
    members = { member_list: null };
    api;

    constructor(eventAggregator, api) {
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.eventAggregator.subscribe('MemberDetailsUpdated', member_details => {
            this.update_member_details(member_details.id, member_details);
        });
        this.eventAggregator.subscribe('NewMemberAdded', member => {
            this.member_added(member);
        });

        this.eventAggregator.subscribe('MEMBER_LISTS_CHANGED', payload => {
            console.log("ws tells change ", payload);
        });

        this.eventAggregator.subscribe('MemberGotProfilePhoto', payload => {
            this.set_profile_photo(payload.member_id, payload.face_photo_url);
        });
    }

    getMemberList(refresh: boolean = false) {
        if (this.members.member_list && !refresh) {
            return new Promise(resolve => {
                resolve(this.members)
            })
        } else {
            return this.api.getMemberList().then(members => {
                this.members.member_list = members.member_list;
                return this.members;
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

    member_added(new_member: any) {
        let new_list_item = { name: new_member.name, facePhotoURL: new_member.facePhotoURL, gender: new_member.member_info.gender, id: new_member.member_info.id };
        this.members.member_list.splice(0, 0, new_list_item);
    }

    set_profile_photo(member_id, face_photo_url) {
        this.get_member_by_id(member_id)
            .then(member => {
                if (face_photo_url) {
                    member.facePhotoURL = face_photo_url;
                }
            });
    }

    remove_member(member_id) {
       return this.api.call_server('members/remove_member', { member_id: member_id })
            .then(response => {
                if (response.deleted) {
                    let mem_ids = this.members.member_list.map(member => member.id)
                    let idx = mem_ids.indexOf(member_id);
                    this.members.member_list.splice(idx, 1);
                }
            })
    }

}
