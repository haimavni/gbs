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
    member_of_the_day_life_cycle_text;
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
    panel_height = 380;
    photo_strip_height = 360;
    subscriber1;
        
    constructor(api: MemberGateway, router: Router, user: User, theme: Theme, i18n: I18N, memberList: MemberList, dialog: DialogService, eventAggregator: EventAggregator, misc: Misc) {
        this.api = api;
        this.user = user;
        this.misc = misc;
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
        this.photo_list = this.api.call_server_post('members/get_photo_list');
        this.api.call_server_post('members/get_stories_sample').then(result => this.stories_sample = result.stories_sample);
        memberList.getMemberList(); //to load in the background
        this.api.call_server_post('members/get_message_list').then(
            result => {
                this.message_list = result.message_list;
            });
        this.api.call_server_post('members/get_video_sample')
            .then(response => this.set_video_list(response.video_list));
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;   
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v =>  this.youtube_data(v));
    }

    youtube_data(video_code) {
        return { type: "youtube", src: "//www.youtube.com/embed/" + video_code + "?wmode=opaque" }
    }

    add_message() {
        let name = this.i18n.tr('home.new-message');
        this.message_list.splice(0, 0, { story_id: null, name: name, used_for: this.api.constants.story_type.STORY4MESSAGE, story_text: "" });
    }

    hande_story_change(story, customEvent) {
        event = customEvent.detail;
        if (story.deleted) {
            this.api.call_server_post('members/delete_story', {story_id: story.story_id})
                .then(response => {
                    let idx = this.message_list.findIndex(item => item.story_id==story.story_id);
                    this.message_list.splice(idx, 1);
                })
        }
    }

    attached() {
        this.api.call_server_post('members/get_random_member').then(result => {
            this.member_of_the_day = result.member_data;
            this.member_of_the_day_life_cycle_text = this.misc.calc_life_cycle_text(this.member_of_the_day);
            this.member_prefix = this.member_of_the_day.gender == 'F' ? 'home.female-member-of-the-day' : 'home.male-member-of-the-day';
            this.was_born_in = this.member_of_the_day.gender == 'F' ? 'home.female-was-born-in' : 'home.male-was-born-in';
            this.died_in = this.member_of_the_day.gender == 'F' ? 'home.female-died-in' : 'home.male-died-in';
        });
        this.subscriber1 = this.eventAggregator.subscribe('Zoom1', payload => { this.openDialog(payload.slide, payload.event, payload.slide_list) });
    }

    detached() {
        this.subscriber1.dispose();
    }

    jump_to_member_of_the_day_page(member_id) {
        this.router.navigateToRoute('member-details', { id: member_id });
    }

    goto_full_collection() {
        this.router.navigateToRoute('stories');
    }

    jump_to_the_full_story(story) {
        this.router.navigateToRoute('story-detail', { id: story.id, what: 'story' });
    }

    private openDialog(slide, event, slide_list) {
        event.stopPropagation();
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
        });
    }

    on_height_change(event) {
        event.stopPropagation();
        let { new_height } = event.detail;
        this.panel_height = 680 - new_height;
    }

}
