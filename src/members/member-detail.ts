import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { computedFrom } from 'aurelia-framework';
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
    dirty_info = false;
    dirty_story = false;

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('ParentFound', (parent) => { this.set_parent(this.member, parent) });
        this.eventAggregator.subscribe('DirtyStory', dirty => { this.dirty_story = dirty });
        this.eventAggregator.subscribe('DirtyInfo', dirty => { this.dirty_info = dirty });
        this.dialog = dialog;
        this.baseURL = environment.baseURL;
        console.log("member details constructed");
    }

    @computedFrom('dirty_info', 'dirty_story')
    get disabled_if() {
        return this.dirty_story || this.dirty_info ? "disabled" : "";
    }

    created(view) {
        console.log("member details created " + view);
    }

    activate(params, config) {
        console.log("member details activated");
        if (params.id == 'new') {  //todo: wip. see in "Learning Aurelia"
          this.member = {fullName: 'New Member'};
          config.navModel.setTitle(this.member.fullName);
          return;
        }

        return this.api.getMemberDetails({ member_id: params.id })
            .then(member => {
                this.member = member;
                config.navModel.setTitle(this.member.fullName);
            });
    }

    detached() {
        console.log("member details detached");
    }

    set_parent(member, parent) {
        if (parent.gender == 'M') {
            this.member.family_connections.parents.pa = parent
        } else {
            this.member.family_connections.parents.ma = parent
        }
        this.member.family_connections.hasFamilyConnections = true;
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

    
    get_profile_photo(member) {
        if (member.has_profile_photo) {
            return environment.baseURL + "/gbs/static/gb_photos/profile_photos/PP-" + member.id + '.jpg';
        } else {
           return environment.baseURL + "/gbs/static/images/dummy_face.png";
        }
    }

}
