import { autoinject, computedFrom, singleton } from 'aurelia-framework';
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
import { MemberList } from '../services/member_list';

@autoinject()
@singleton()
export class MemberDetail {
    user;
    eventAggregator;
    api;
    router;
    i18n;
    member;
    memberList;
    dialog;
    baseURL;
    dirty_info = false;
    dirty_story = false;
    content_area_height = 300;
    stories_base = 0;
    story_0 = { story_text: "" };
    story_1 = { story_text: "" };
    story_2 = { story_text: "" };
    story_3 = { story_text: "" };
    story_4 = { story_text: "" };
    life_summary;
    stories_scroll: boolean;
    source;
 

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, router: Router, i18n: I18N, dialog: DialogService, memberList: MemberList) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.memberList = memberList;
        this.router = router;
        this.i18n = i18n;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('ParentFound', (parent) => { this.set_parent(this.member, parent) });
        this.eventAggregator.subscribe('DirtyStory', dirty => { this.dirty_story = dirty });
        this.eventAggregator.subscribe('DirtyInfo', dirty => { this.dirty_info = dirty });
        this.eventAggregator.subscribe('Zoom', payload => { this.openDialog(payload.slide, payload.event, payload.slide_list) })
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
        this.source = this.api.call_server_post('members/get_member_photo_list', { member_id: params.id, what: params.what });
        this.api.getMemberDetails({ member_id: params.id, what: params.what })
            .then(member => {
                this.member = member;
                let life_story = this.member.member_stories[0];
                if (life_story) {
                    life_story.topic = this.life_summary + ' ' + this.member.member_info.name; //the first one is always the biography
                }
                this.set_displayed_stories();
            });
    }

    bind() {
        console.log("bind member detail")
    }

    attched() {
        console.log("attached member detail")
    }

    detached() {
        console.log("detached member detail");
        delete this.eventAggregator;
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
        if (confirm(this.i18n.tr('members.confirm-delete'))) {
            this.memberList.remove_member(this.member.member_info.id)
                .then(() => { this.router.navigateToRoute('members'); });
        }
    }

    next_story(event, dir = 1) {
        event.stopPropagation();
        this.stories_base += dir;
        let n =  this.member.member_stories.length - 1;
        this.stories_base = (this.stories_base + n - 1) % n + 1;
        this.set_displayed_stories();
    }

    shift_stories(customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let dir = event.dx < 0 ? 1 : -1;
        this.next_story(event, dir);
    }

    private openDialog(slide, event, slide_list) {
        event.stopPropagation();
        if (event.altKey && event.shiftKey) {
            this.detach_photo_from_member(this.member.member_info.id, slide.photo_id, slide_list);
            return;
        }
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
        });
    }

    get_profile_photo(member) {
        if (member.facePhotoURL) {
            return member.facePhotoURL;
        } else {
            return 'x' //environment.baseURL + "/gbs/static/images/dummy_face.png";
        }
    }

    story(idx) {
        let n = this.member.member_stories.length;
        let i;
        if (n <= 5) {
            i = idx
        } else if (idx == 0) {
            i = 0
        } else {
            i = (n + this.stories_base + idx) % (n - 1) + 1;
        }
        if (i < n) {
            let rec = this.member.member_stories[i];
            rec.name = rec.name ? rec.name : ""
            return rec
        } else {
            return { name: "", story_text: "" }
        }
    }

    detach_photo_from_member(member_id, photo_id, slide_list) {
        this.api.call_server_post('members/detach_photo_from_member', { member_id: member_id, photo_id: photo_id })
            .then(response => {
                if (response.photo_detached) {
                    // now delete slide #photo_id from slide_list:
                    let idx = -1;
                    for (let i=0; i < slide_list.length; i++) {
                        if (slide_list[i].photo_id==photo_id) {
                            idx = i;
                            break;
                        }
                    }
                    if (idx >= 0) {
                        slide_list.splice(idx, 1);
                    }
                } else {
                    alert("detaching photo failed!")
                }
            });
    }

    zoom_out(story, what, extra='') {
        this.dialog.open({ viewModel: StoryWindow, model: { story: story, edit: what == 'edit' }, lock: what == 'edit' }).whenClosed(response => {
            if (extra=='life' && what=='edit' && ! this.member.member_info.story_id ) {
                this.member.member_info.story_id = response.output.story_id;
                this.api.call_server_post('members/set_member_story_id', {member_id: this.member.member_info.id, story_id: response.output.story_id});
            }
            console.log("response after edit dialog: ", response.output);
        });

    }

}
