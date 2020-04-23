import { MemberGateway } from '../services/gateway';
import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { User } from '../services/user';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { I18N } from 'aurelia-i18n';
import { MemberList } from '../services/member_list';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';

@autoinject
export class Home {
    api;
    photo_list;
    video_list = [];
    member_of_the_day = { gender: '', name: '' };
    member_prefix;
    was_born_in;
    died_in;
    router;
    user;
    misc;
    theme;
    stories_sample;
    message_list;
    i18n;
    dialog;
    eventAggregator;
    subscriber1;
    scroll_area;
    active_part = 3;
    photo_strip_height = 220;

    constructor(api: MemberGateway, router: Router, user: User, theme: Theme, i18n: I18N, memberList: MemberList, dialog: DialogService, eventAggregator: EventAggregator, misc: Misc) {
        this.api = api;
        this.user = user;
        this.misc = misc;
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
        this.photo_list = this.api.call_server_post('photos/get_photo_list', { selected_recognition: 'recognized' });
        this.api.call_server_post('members/get_stories_sample').then(result => this.stories_sample = result.stories_sample);
        memberList.getMemberList(); //to load in the background
        this.api.call_server_post('members/get_message_list').then(
            result => {
                this.message_list = result.message_list;
            });
        this.api.call_server_post('photos/get_video_sample')
            .then(response => this.set_video_list(response.video_list));
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v => this.youtube_data(v));
    }

    youtube_data(video_code) {
        return { type: "youtube", src: "//www.youtube.com/embed/" + video_code + "?wmode=opaque" }
    }

    add_message() {
        let name = this.i18n.tr('home.new-message');
        this.message_list.splice(0, 0, { story_id: null, name: name, used_for: this.api.constants.story_type.STORY4MESSAGE, story_text: "", preview: "" });
    }

    push_story(story, customEvent) {
        event = customEvent.detail;
        this.api.call_server_post('members/push_message_up', { story_id: story.story_id })
            .then(response => {
                let idx = this.message_list.findIndex(item => item.story_id == story.story_id);
                let msgs = this.message_list.slice(idx, idx + 1);
                this.message_list.splice(idx, 1);
                this.message_list.splice(0, 0, msgs[0]);
                this.scroll_area.scrollTop = 0;
            })
    }

    hande_story_change(story, customEvent) {
        event = customEvent.detail;
        if (story.deleted) {
            this.api.call_server_post('members/delete_story', { story_id: story.story_id })
                .then(response => {
                    let idx = this.message_list.findIndex(item => item.story_id == story.story_id);
                    this.message_list.splice(idx, 1);
                })
        }
    }

    attached() {
        this.api.call_server_post('members/get_random_member').then(result => {
            this.member_of_the_day = result.member_data;
            this.member_prefix = this.member_of_the_day.gender == 'F' ? 'home.female-member-of-the-day' : 'home.male-member-of-the-day';
            this.was_born_in = this.member_of_the_day.gender == 'F' ? 'home.female-was-born-in' : 'home.male-was-born-in';
            this.died_in = this.member_of_the_day.gender == 'F' ? 'home.female-died-in' : 'home.male-died-in';
        });
        this.subscriber1 = this.eventAggregator.subscribe('Zoom1', payload => { this.openDialog(payload.slide, payload.event, payload.slide_list) });
        this.photo_strip_height = Math.round(this.theme.height / 5);
        //this.panel_height = this.theme.height - 700;
    }

    get member_of_the_day_life_cycle_text() {
        return this.misc.calc_life_cycle_text(this.member_of_the_day);
    }

    detached() {
        this.subscriber1.dispose();
    }

    jump_to_member_of_the_day_page(member_id) {
        this.router.navigateToRoute('member-details', { id: member_id, keywords: "" });
    }

    goto_full_collection() {
        this.router.navigateToRoute('stories');
    }

    jump_to_the_full_story(story) {
        this.router.navigateToRoute('story-detail', { id: story.id, what: 'story' });
    }

    private openDialog(slide, event, slide_list) {
        event.stopPropagation();
        document.body.classList.add('black-overlay');
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide, slide_list: slide_list }, lock: false }).whenClosed(response => {
            document.body.classList.remove('black-overlay');
        });
    }

    on_height_change(event) {
        event.stopPropagation();
        let { new_height } = event.detail;
    }

    @computedFrom('theme.height', 'photo_strip_height')
    get panel_height() {
        return this.theme.height - this.photo_strip_height - 205;
    }

    drag_end_panel(customEvent) {
        if (this.theme.is_desktop) return;
        let event = customEvent.detail;
        let dx = event.dx;
        let dy = event.dy;
        if (Math.abs(dy * 5) >= Math.abs(dx)) return true;
        if (dx < -30 && this.active_part < 3) {
            this.active_part += 1
        } else if (dx > 30 && this.active_part > 1) {
            this.active_part -= 1;
        }
    }

}
