import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { MemberEdit } from './member-edit';
import environment from '../environment';

@autoinject()
export class MemberDetail {
    user;
    eventAggregator;
    api;
    router;
    i18n;
    member;
    dialog;
    baseURL;

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialog = dialog;
        this.baseURL = environment.baseURL;
        console.log("member details constructed");
    }

    created(view) {
        console.log("member details created " + view);
    }

    activate(params, config) {
        console.log("member details activated");
        return this.api.getMemberDetails({ member_id: params.id })
            .then(member => {
                this.member = member;
                config.navModel.setTitle(this.member.fullName);
            });
    }

    detached() {
        console.log("member details detached");
    }

    tryDelete() {
        if (confirm(this.i18n.tr('members.confirmDelete'))) {
            this.api.delete(this.member.id)
                .then(() => { this.router.navigateToRoute('members'); });
        }
    }

    next_slide() //we are right to left...
    {
        let slides = this.member.slides;
        let slide = slides.shift();
        slides.push(slide);
        this.member.slides = slides;
    }

    prev_slide() {
        let slides = this.member.slides;
        slides.reverse();
        let slide = slides.shift();
        slides.push(slide);
        slides.reverse();
        this.member.slides = slides;
    }

    private openDialog(slide) {
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
            console.log(response.output);
        });
    }

    photo_clicked(slide) {
        this.openDialog(slide);
    }

    notify_change(e, editor) {
        //this is not the class this. question: how to notify the form editor
        //this.publish('EditorContentChanged'); //will not work!
    }

}
