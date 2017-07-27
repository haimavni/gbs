import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { StoryWindow } from '../stories/story_window';
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
    content_area_height = 300;
    stories_base = 0;
    story_0; story_1; story_2; story_3; story_4;
    life_summary;
    stories_scroll: boolean;
    slides;
    source;

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
        this.eventAggregator.subscribe('Zoom', payload => {this.openDialog(payload.slide, payload.event)})
        this.dialog = dialog;
        this.baseURL = environment.baseURL;
        this.life_summary = this.i18n.tr('members.life-summary');
    }

    @computedFrom('dirty_info')
    get disabled_if() {
        return this.dirty_info ? "disabled" : "";
    }

    set_displayed_stories() {
        this.stories_scroll = (this.member.member_stories.length > 5);
        this.story_0 = this.story(0);
        this.story_1 = this.story(1);
        this.story_2 = this.story(2);
        this.story_3 = this.story(3);
        this.story_4 = this.story(4);
    }

    activate(params, config) {
        console.log("member details activate");
        this.source = this.api.call_server_post('members/get_member_photo_list', {member_id: params.id});
        this.api.getMemberDetails({ member_id: params.id })
            .then(member => {
                this.member = member;
                //this.slides = member.slides;
                this.member.member_stories[0].topic = this.life_summary + ' ' + this.member.member_info.name; //the first one is always the biography
                this.set_displayed_stories();
            });
    }

    bind() {
        console.log("member details bind");
    }

    attched() {
        console.log("member details dattached");
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

/*    shift_photos(slide, customEvent: CustomEvent) {
        let event = customEvent.detail;
        customEvent.stopPropagation();
        if (event.dx < 0) {
            this.prev_slide();
        } else {
            this.next_slide();
        }
    }

*/    next_story(event, dir = 1) {
        event.stopPropagation();
        this.stories_base += dir;
        this.stories_base = (this.stories_base + this.member.member_stories.length) % this.member.member_stories.length;
        this.set_displayed_stories();
    }

    shift_stories(customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let dir = event.dx < 0 ? 1 : -1;
        this.next_story(event, dir);
    }

/*    next_slide() //we are right to left...
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
*/
    private openDialog(slide, event) {
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
            console.log(response.output);
        });
    }

    photo_clicked(slide) {
        this.openDialog(slide, null);
    }

    get_profile_photo(member) {
        if (member.facePhotoURL) {
            return member.facePhotoURL;
        } else {
            return environment.baseURL + "/gbs/static/images/dummy_face.png";
        }
    }

    story(idx) {
        let n = this.member.member_stories.length;
        let i;
        if (n <= 5) {
            i = idx
        } else {
            i = (n + this.stories_base + idx) % n;
        }
        if (i < n) {
            let rec = this.member.member_stories[i];
            rec.name = rec.name ? rec.name : ""
            return rec
        } else {
            return { name: "", story_text: "" }
        }

    }

    zoom_out(story, what) {
        console.log("zoom out what ", what);
        this.dialog.open({ viewModel: StoryWindow, model: { story: story, edit: what == 'edit' }, lock: what == 'edit' }).whenClosed(response => {
            console.log("response after edit dialog: ", response.output);
        });

    }

}
