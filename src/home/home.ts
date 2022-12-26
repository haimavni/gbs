import { MemberGateway } from '../services/gateway';
import { Popup } from '../services/popups';
import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { User } from '../services/user';
import { Cookies } from '../services/cookies';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { ShowPhoto } from '../services/show-photo';
import { I18N } from 'aurelia-i18n';
import { MemberList } from '../services/member_list';
import { EventAggregator } from 'aurelia-event-aggregator';

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
    cookies;
    misc;
    theme;
    show_photo: ShowPhoto;
    stories_sample;
    message_list;
    i18n;
    eventAggregator;
    subscriber1;
    scroll_area;
    active_part = 3;
    photo_strip_height = 220;
    popup;   //just to force closing all dialogs on routing

    constructor(api: MemberGateway, router: Router, user: User, cookies: Cookies, theme: Theme, i18n: I18N,
                memberList: MemberList, show_photo: ShowPhoto,
                popup: Popup, eventAggregator: EventAggregator, misc: Misc) {
        this.api = api;
        this.user = user;
        this.cookies = cookies;
        this.misc = misc;
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
        let x = this.cookies.get('SLIDESHOW-TOPICS');
        let slideshow_topics = JSON.parse(x);
        this.photo_list = this.api.call_server_post('photos/get_photo_list',
            { selected_recognition: 'recognized', selected_topics: slideshow_topics, no_slide_show: true });
        this.api.call_server_post('members/get_stories_sample').then(result => this.stories_sample = result.stories_sample);
        memberList.getMemberList(); //to load in the background
        this.api.call_server_post('members/get_message_list').then(
            result => {
                this.message_list = result.message_list;
            });
        this.api.call_server_post('videos/get_video_sample')
            .then(response => this.set_video_list(response.video_list));
        this.show_photo = show_photo
        this.popup = popup;
        this.eventAggregator = eventAggregator;
    }

    set_video_list(video_list) {
        this.video_list = video_list.map(v => this.video_data(v));
    }

    video_data(v) {
        return {
            src: v.thumbnail_url,
            video_id: v.video_id,
            name: v.name
        }
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

    pin_story(story, customEvent) {
        event = customEvent.detail;
        this.api.call_server_post('members/pin_message', { story_id: story.story_id })
            .then(response => {
                let idx = this.message_list.findIndex(item => item.story_id == story.story_id);
                if (response.pinned) {
                    let msgs = this.message_list.slice(idx, idx + 1);
                    this.message_list.splice(idx, 1);
                    msgs[0].pinned = true;
                    this.message_list.splice(0, 0, msgs[0]);
                    this.scroll_area.scrollTop = 0;
                } else {
                    this.message_list[idx].pinned = false;
                }
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
            if (! this.member_of_the_day) return;
            this.member_prefix = this.member_of_the_day.gender == 'F' ? 'home.female-member-of-the-day' : 'home.male-member-of-the-day';
            this.was_born_in = this.member_of_the_day.gender == 'F' ? 'home.female-was-born-in' : 'home.male-was-born-in';
            this.died_in = this.member_of_the_day.gender == 'F' ? 'home.female-died-in' : 'home.male-died-in';
        });
        this.subscriber1 = this.eventAggregator.subscribe('Zoom1', payload => {
            let photo_ids = payload.slide_list.map(photo => photo.photo_id);
            this.show_photo.show(payload.slide, payload.event, photo_ids);
        });
        this.photo_strip_height = Math.round(this.theme.height / 5);
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

    thumbnail(video_src) {
        return `https://i.ytimg.com/vi/${video_src}/mq2.jpg`
    }

    jump_to_video(video) {
        this.router.navigateToRoute('annotate-video', { video_id: video.video_id });
    }

}
