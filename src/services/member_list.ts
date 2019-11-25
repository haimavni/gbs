import { inject, noView, singleton } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import { sort_array } from '../services/sort_array';
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
        this.eventAggregator.subscribe('MEMBER_LISTS_CHANGED', payload => {
            let flds = ['id', 'name', 'title', 'first_name', 'last_name', 'former_first_name', 'former_last_name', 'nick_name', 'gender', 'visibility', 'has_profile', 'approved'];
            let mi = payload.member_rec;
            if (payload.new_member) {
                let new_member = {};
                for (let k of flds) {
                    new_member[k] = mi[k];
                }
                new_member['facePhotoURL'] = mi.facePhotoURL;
                this.members.member_list.splice(0, 0, new_member);
            } else {
                this.get_member_by_id(mi.id)
                    .then((member) => {
                        for (let k of flds) {
                            member[k] = mi[k];
                        }
                    });
            }
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
            console.time('member_list');
            return this.api.getMemberList().then(members => {
                this.members.member_list = sort_array(members.member_list, '-has_profile_photo');
                console.timeEnd('member_list');
                return this.members;
            })
        }
    }

    sort_member_list(sortby) {
        this.members.member_list = sort_array(this.members.member_list, sortby);
        //this.members.member_list.splice(0);
    }

    get_member_by_id(member_id) {
        if (!member_id) {
            return new Promise(resolve => resolve({ name: "", first_name:" ", last_name: "" }))
        }
        return this.getMemberList()
            .then(members => {
                let lst = members.member_list.filter(member => member.id == member_id);
                if (lst && lst.length > 0) {
                    return lst[0];
                }
            });
    }

    set_profile_photo(member_id, face_photo_url) {
        this.get_member_by_id(member_id)
            .then(member => {
                if (face_photo_url) {
                    member.facePhotoURL = face_photo_url;
                }
            });
    }

    add_member(member_details) {
        this.members.member_list.push(member_details);
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
