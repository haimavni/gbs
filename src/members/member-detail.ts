import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { MemberEdit } from './member-edit';

@autoinject()
export class MemberDetail {
    user;
    eventAggregator;
    api;
    router;
    i18n;
    member;
    dialog;

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialog = dialog;

    }

    activate(params, config) {
        return this.api.getMemberDetails({ member_id: params.id })
            .then(member => {
                this.member = member;
                config.navModel.setTitle(this.member.fullName);
            });
    }

    tryDelete() {
        if (confirm(this.i18n.tr('members.confirmDelete'))) {
            this.api.delete(this.member.id)
                .then(() => { this.router.navigateToRoute('members'); });
        }
    }

    next_slide() //we are right to left...
    {
        let slides = this.member.images;
        let slide = slides.shift();
        slides.push(slide);
        this.member.images = slides;
    }

    prev_slide() {
        let slides = this.member.images;
        slides.reverse();
        let slide = slides.shift();
        slides.push(slide);
        slides.reverse();
        this.member.images = slides;
    }

    private openDialog(image) {
        this.dialog.open({ viewModel: FullSizePhoto, model: { image: image }, lock: false }).whenClosed(response => {
            console.log(response.output);
        });
    }

    photo_clicked(image) {
        this.openDialog(image);
    }

}
