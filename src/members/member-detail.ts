import { autoinject, computedFrom, singleton } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Misc } from "../services/misc";
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { StoryWindow } from '../stories/story_window';
import { MemberEdit } from './member-edit';
import environment from '../environment';
import { MemberList } from '../services/member_list';
import { highlight } from '../services/dom_utils';

@autoinject()
@singleton()
export class MemberDetail {
    user;
    theme;
    eventAggregator;
    api;
    misc;
    router;
    i18n;
    member;
    memberList;
    dialog;
    baseURL;
    dirty_info = false;
    dirty_story = false;
    photo_strip_height = 220;
    bottom_height = 271;
    top_height = 271;
    story_box_height = 260;
    stories_base = 0;
    story_0 = { story_text: "" };
    story_1 = { story_text: "" };
    story_2 = { story_text: "" };
    story_3 = { story_text: "" };
    story_4 = { story_text: "" };
    life_summary;
    stories_scroll: boolean;
    source;
    sub1; sub2; sub3; sub4; sub5;
    panel_height = 566;
    to_story_page;
    expand;
    compress;
    life_summary_expanded = false;
    member_detail_panel;
    family_connections_panel;
    member_detail_container;
    top_panel;
    bottom_panel;
    life_summary_content;
    life_summary_box;
    keywords = [];
    highlight_on="highlight-on";
    advanced_search = false;

    constructor(user: User, theme: Theme, eventAggregator: EventAggregator, api: MemberGateway,
        router: Router, i18n: I18N, dialog: DialogService, memberList: MemberList, misc: Misc) {
        this.user = user;
        this.theme = theme;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.misc = misc;
        this.memberList = memberList;
        this.router = router;
        this.i18n = i18n;
        this.to_story_page = this.i18n.tr('members.to-story-page');
        this.expand = this.i18n.tr('members.expand-life-summary');
        this.compress = this.i18n.tr('members.compress-life-summary');
        this.dialog = dialog;
        this.baseURL = environment.baseURL;
        this.life_summary = this.i18n.tr('members.life-summary');
        this.eventAggregator.subscribe('STORY_WAS_SAVED', payload => { this.refresh_story(payload) });
    }

    refresh_story(data) {
        let story_id = data.story_data.story_id;
        let idx = this.member.member_stories.findIndex(itm => itm.story_id==story_id);
        if (idx >= 0) {
            this.member.member_stories[idx].story_preview = data.story_data.story_preview;
            this.api.call_server_post('members/get_story', {story_id: story_id})
                .then(response => {
                    this.member.member_stories[idx].story_text = response.story.story_text;
                    this.set_displayed_stories();
            });
        }
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
        this.keywords = params.keywords;
        this.advanced_search = params.search_type == 'advanced';
        this.source = this.api.call_server_post('members/get_member_photo_list', { member_id: params.id, what: params.what });
        this.api.getMemberDetails({ member_id: params.id, what: params.what })
            .then(member => {
                this.member = member;
                let life_story = this.member.member_stories[0];
                if (life_story) {
                    life_story.topic = this.life_summary + ' ' + this.member.member_info.name; //the first one is always the biography
                }
                this.set_displayed_stories();
                this.api.hit('MEMBER', this.member.member_info.id);
            });
    }

    @computedFrom('member.member_info.PlaceOfBirth', 'member.member_info.place_of_death', 'member.member_info.date_of_birth.date', 'member.member_info.date_of_death.date',
        'member.member_info.cause_of_death', 'member.member_info.gender')
    get life_cycle_text() {
        if (!this.member) return "";
        return this.misc.calc_life_cycle_text(this.member.member_info)
    }

    @computedFrom('member.member_info.Name', 'member.member_info.first_name', 'member.member_info.last_name', 'member.member_info.former_first_name',
        'member.member_info.former_last_name', 'member.member_info.NickName')
    get member_display_name() {
        if (!this.member)
            return "";
        return this.misc.calc_member_display_name(this.member.member_info);
    }

    attached() {
        this.sub1 = this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.sub2 = this.eventAggregator.subscribe('ParentFound', (parent) => { this.set_parent(this.member, parent) });
        this.sub3 = this.eventAggregator.subscribe('DirtyStory', dirty => { this.dirty_story = dirty });
        this.sub4 = this.eventAggregator.subscribe('DirtyInfo', dirty => { this.dirty_info = dirty });
        this.sub5 = this.eventAggregator.subscribe('Zoom', payload => { this.openDialog(payload.slide, payload.event, payload.slide_list) });
        this.set_heights();
    }

    detached() {
        this.sub1.dispose();
        this.sub2.dispose();
        this.sub3.dispose();
        this.sub4.dispose();
        this.sub5.dispose();
    }

    set_parent(member, parent) {
        let gender = parent.gender;
        if (parent.deleted) {
            parent = null;
        }
        if (gender == 'M') {
            this.member.family_connections.parents.pa = parent
        } else {
            this.member.family_connections.parents.ma = parent
        }
        this.member.family_connections.hasFamilyConnections =
            this.member.family_connections.parents.ma || this.member.family_connections.parents.pa;
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
        let n = this.member.member_stories.length - 1;
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
        if (member && member.facePhotoURL) {
            return member.facePhotoURL;
        } else {
            return 'x' //environment.baseURL + "/gbs/static/images/dummy_face.png";
        }
    }

    story(idx) {
        let n = this.member.member_stories.length;
        let i;
        if (n <= 5) {
            i = idx;
            if (idx > 0 && this.theme.rtltr === "rtl") {
                i = 5 - i;
            }
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
                    for (let i = 0; i < slide_list.length; i++) {
                        if (slide_list[i].photo_id == photo_id) {
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

    zoom_out(story, what, extra = '') {
        this.dialog.open({ viewModel: StoryWindow, model: { story: story, edit: what == 'edit' }, lock: what == 'edit' }).whenClosed(response => {
            if (extra == 'life' && what == 'edit' && !this.member.member_info.story_id) {
                this.member.member_info.story_id = response.output.story_id;
                this.api.call_server_post('members/set_member_story_id', { member_id: this.member.member_info.id, story_id: response.output.story_id });
            }
        });

    }

    go_back() {
        history.back();
    }

    goto_story_page(story) {
        this.router.navigateToRoute('story-detail', { id: story.story_id, what: 'story' });
    }

    on_height_change(event) {
        event.stopPropagation();
        let { new_height } = event.detail;
        this.photo_strip_height = new_height;
        //this.panel_height = 680 - new_height;
        this.set_heights();
    }

    toggle_life_summary_size(event) {
        event.stopPropagation();
        this.life_summary_expanded = !this.life_summary_expanded;
        this.set_heights();
    }

    _set_heights() {
        try {
            let panel_height = this.theme.height - this.photo_strip_height - 188;
            panel_height = Math.max(panel_height, 566);
            this.member_detail_panel.style.height = `${panel_height}px`;
            let tph = this.life_summary_expanded ? panel_height : Math.round(panel_height / 2);
            let lsh = tph - 100;
            this.life_summary_content.style.height = `${lsh}px`;
            this.top_panel.style.height = `${tph}px`;
            let bph = panel_height - tph - 6;
            this.bottom_panel.style.height = `${bph}px`;
            this.story_box_height = bph - 12;
            let mdch = panel_height + this.photo_strip_height - 12;
            this.member_detail_container.style.height = `${mdch}px`;
            let lsb = tph - 30;
            this.life_summary_box.style.height = `${lsb}px`;
            this.family_connections_panel.style.height = `${lsh+34}px`;
        } catch (e) {
            return false;
        }
        return true;
    }

    set_heights() {
        setTimeout(() => {
            if (this._set_heights()) return;
            this.set_heights();
        }, 5)
    }

    @computedFrom("story_0.story_text")
    get biography() {
        let highlighted_html = highlight(this.story_0.story_text, this.keywords, this.advanced_search);
        return highlighted_html;
    }

    toggle_highlight_on() {
        if (this.highlight_on) {
            this.highlight_on = ""
        } else {
            this.highlight_on = "highlight-on"
        }
        document.getElementById("word-highlighter").blur();
    }

}
