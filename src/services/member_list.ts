import { inject, noView, singleton } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';

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
}
