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
    content_area_height = 600;
    stories_base = 0;
    story_0; story_1; story_2; story_3;

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
    }

    @computedFrom('dirty_info', 'dirty_story')
    get disabled_if() {
        return this.dirty_story || this.dirty_info ? "disabled" : "";
    }

    set_displayed_stories() {
        this.story_0 = this.story(0);
        this.story_1 = this.story(1);
        this.story_2 = this.story(2);
        this.story_3 = this.story(3);
    }

    activate(params, config) {
        return this.api.getMemberDetails({ member_id: params.id })
            .then(member => {
                this.member = member;
                this.set_displayed_stories();
            });
    }

    attached() {
        //todo: experiment...
        let body = document.getElementById("body");
        if (body) {
            this.content_area_height = body.clientHeight - 330;
        } else {
            this.content_area_height = 576;
        }
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

    dragend(customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        if (event.dx < 0) {
            this.prev_slide();
        } else {
            this.next_slide();
        }
    }

    move_stories(customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        if (event.dx > 0) {
            this.stories_base -= 1;
        } else {
            this.stories_base += 1;
        }
        this.stories_base = (this.stories_base + this.member.member_stories.length) % this.member.member_stories.length;
        this.set_displayed_stories();
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
        if (member.facePhotoURL) {
            return member.facePhotoURL;
        } else {
            return environment.baseURL + "/gbs/static/images/dummy_face.png";
        }
    }

    story(idx) {
        if (idx >= this.member.member_stories.length) {
            return { name: "", story_text: "" }
        }
        let i = (this.member.member_stories.length + this.stories_base + idx) % this.member.member_stories.length;
        console.log("idx=" + idx + " i= " + i);
        let rec = this.member.member_stories[i];
        rec.name = rec.name ? rec.name : ""
        return rec
    }

}
