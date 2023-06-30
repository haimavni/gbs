import {autoinject, computedFrom, singleton} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {I18N} from 'aurelia-i18n';
import {MemberGateway} from '../services/gateway';
import {User} from "../services/user";
import {Misc} from "../services/misc";
import {Theme} from "../services/theme";
import {ShowPhoto} from "../services/show-photo";
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {StoryWindow} from '../stories/story_window';
import environment from '../environment';
import {MemberList} from '../services/member_list';
import {highlight} from '../services/dom_utils';
import {ConfigMemberStories} from './config-member-stories';
import {Divorce} from './divorce';
import {Videos} from '../videos/videos';

@autoinject()
@singleton()
export class MemberDetail {
    user;
    theme;
    eventAggregator;
    api;
    misc;
    show_photo: ShowPhoto;
    videos;
    router;
    i18n;
    member;
    new_member = '';
    memberList;
    dialog;
    baseURL;
    dirty_info = false;
    dirty_story = false;
    photo_strip_height = 220;
    bottom_height = 271;
    top_height = 271;
    story_box_height = 260;
    stories_base = -1;
    member_stories = {lst: [], changed: 0};
    bio;
    life_summary;
    source;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    to_story_page;
    expand;
    compress;
    life_summary_expanded = false;
    member_detail_panel;
    family_connections_panel;
    member_detail_container;
    top_panel;
    photo_strip;
    bottom_panel;
    life_summary_content;
    life_summary_box;
    life_summary_box1;
    keywords = [];
    highlight_on = "highlight-on";
    advanced_search = false;
    photo_list_changes_pending = false;
    biography_dir = "";
    member_id;
    move_to;
    story_0;
    story_1;
    story_2;
    story_3;
    story_4;

    constructor(user: User, theme: Theme, eventAggregator: EventAggregator, api: MemberGateway, videos: Videos,
                router: Router, i18n: I18N, dialog: DialogService, memberList: MemberList, misc: Misc, show_photo: ShowPhoto) {
        this.user = user;
        this.theme = theme;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.misc = misc;
        this.show_photo = show_photo;
        this.videos = videos;
        this.memberList = memberList;
        this.router = router;
        this.i18n = i18n;
        this.to_story_page = this.i18n.tr('members.to-story-page');
        this.expand = this.i18n.tr('members.expand-life-summary');
        this.compress = this.i18n.tr('members.compress-life-summary');
        this.dialog = dialog;
        this.baseURL = environment.baseURL;
        this.life_summary = this.i18n.tr('members.life-summary');
        this.eventAggregator.subscribe('STORY_WAS_SAVED', payload => {
            this.refresh_story(payload)
        });
        this.eventAggregator.subscribe('WINDOW-RESIZED', payload => {
            this.set_heights()
        });
        this.eventAggregator.subscribe('PHOTO_PHOTO_LIST_CHANGED', payload => {
            this.photo_list_changes_pending = true
        });
    }

    refresh_story(data) {
        let story_id = data.story_data.story_id;
        let story = this.member_stories.lst.find(itm => itm.story_id == story_id);
        if (story) {
            story.preview = data.story_data.preview;
            story.name = data.story_data.name;
            this.api.call_server_post('members/get_story', {story_id: story_id})
                .then(response => {
                    story.story_text = response.story.story_text;
                });
        }
    }

    @computedFrom('dirty_info')
    get disabled_if() {
        return this.dirty_info ? "disabled" : "";
    }

    @computedFrom('member')
    get member_info() {
        if (this.member) return this.member.member_info;
        return {member_info: {}};
    }

    activate(params, config) {
        this.member_id = params.id;
        this.stories_base = -1;
        this.keywords = params.keywords;
        this.advanced_search = params.search_type == 'advanced';
        if (this.member && this.member.member_info &&
            this.member.member_info.id == params.id &&
            !this.photo_list_changes_pending) {
                this.user.editing_enabled(this.member.member_info.editing_ok);
                return;
            }
        this.photo_list_changes_pending = false;
        this.new_member = params.id == 'new' ? this.i18n.tr('members.new-member') : '';
        this.init_member(); //So that changing to a new member does not display most recent one
        this.source = this.api.call_server_post('members/get_member_photo_list', {
            member_id: params.id,
            what: params.what
        });
        this.api.call_server_post('members/get_member_details', {member_id: params.id, what: params.what})
            .then(member => {
                this.member = member;
                this.user.editing_enabled(this.member.member_info.editing_ok);
                this.member_stories.lst = [];
                for (let st of this.member.member_stories) {
                    this.member_stories.lst.push(st)
                }
                let life_story = this.member_stories.lst[0];
                if (life_story) {
                    this.biography_dir = this.theme.language_dir(life_story.language);
                    life_story.topic = this.life_summary + ' ' + this.member.member_info.name; //the first one is always the biography
                }
                this.api.hit('MEMBER', this.member.member_info.id);
                this.set_heights();
                let x = this.stories_base_changed;
            });
    }

    deactivate() {
        this.user.editing_enabled(true);
    }

    init_member() {
        this.member = null;
        this.life_summary = null;
        this.life_summary_expanded = false;
    }

    @computedFrom('member', 'member.member_info.PlaceOfBirth', 'member.member_info.place_of_death', 'member.member_info.date_of_birth.date', 
        'member.member_info.date_of_death.date',
        'member.member_info.cause_of_death', 'member.member_info.gender', 'theme.rtltr')
    get life_cycle_text() {
        if (!this.member) return "";
        return this.misc.calc_life_cycle_text(this.member.member_info)
    }

    @computedFrom('member','member.member_info.name', 'member.member_info.first_name', 'member.member_info.last_name', 'member.member_info.former_first_name',
        'member.member_info.former_last_name', 'member.member_info.NickName')
    get member_display_name() {
        if (!this.member)
            return "";
        return this.misc.calc_member_display_name(this.member.member_info);
    }

    attached() {
        this.sub1 = this.eventAggregator.subscribe('EditModeChange', payload => {
            this.user = payload
        });
        this.sub2 = this.eventAggregator.subscribe('ParentFound', (data) => {
            this.set_parent(data)
        });
        this.sub6 = this.eventAggregator.subscribe('SpouseFound', (data) => {
            this.set_spouse(data)
        });
        this.sub3 = this.eventAggregator.subscribe('DirtyStory', dirty => {
            this.dirty_story = dirty
        });
        this.sub4 = this.eventAggregator.subscribe('DirtyInfo', dirty => {
            this.dirty_info = dirty
        });
        this.sub5 = this.eventAggregator.subscribe('Zoom', payload => {
            let photo_ids = payload.slide_list.map(photo => photo.photo_id);
            let offset = payload.offset;
            this.misc.save(['member_slides_offset', this.member.member_info.id], offset);
            let video_id = payload.slide.video_id;
            if (video_id) {
                this.videos.view_video_by_id(video_id, this.member_id);
            } else {
                this.show_photo.show(payload.slide, payload.event, photo_ids); //payload.slide_list);
            }
        });
        this.set_heights();
        if (! this.member) return;
        let offset = this.misc.load(['member_slides_offset', this.member.member_info.id]);
        if (offset) this.move_to = offset;
    }

    detached() {
        this.sub1.dispose();
        this.sub2.dispose();
        this.sub3.dispose();
        this.sub4.dispose();
        this.sub5.dispose();
        this.sub6.dispose();
    }

    set_parent(data) {
        let parent = data.parent;
        let gender = parent.gender;
        if (parent.deleted) {
            parent = null;
        }
        let key = gender == 'M' ? 'pa' : 'ma';
        if (data.parent_num == 2) key += 2;
        this.member.family_connections.parents[key] = parent;
        let n = 0;
        let pars = this.member.family_connections.parents;
        for (let g of ['pa', 'ma', 'pa2', 'ma2']){
            if (pars[g]) {
                n += 1;
                pars["par"+n] = pars[g];
            }
        }
        this.member.family_connections.hasFamilyConnections ||= (n > 0);
            // this.member.family_connections.parents.ma || this.member.family_connections.parents.pa;
    }

    set_spouse(data) {
        let spouses = this.member.family_connections.spouses;
        if (! spouses) spouses = [];
        spouses.push(data.spouse);
        this.member.family_connections.spouses = spouses;
        this.member.family_connections.hasFamilyConnections = true;
    }

    tryDelete() {
        if (confirm(this.i18n.tr('members.confirm-delete'))) {
            this.memberList.remove_member(this.member.member_info.id)
                .then(() => {
                    this.router.navigateToRoute('members');
                });
        }
    }

    next_story(event, dir = 1) {
        event.stopPropagation();
        this.stories_base += dir;
        let n = this.member_stories.lst.length - 1;
        this.stories_base = (this.stories_base + n - 1) % n + 1;
    }

    shift_stories(customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let dir = event.dx < 0 ? 1 : -1;
        this.next_story(event, dir);
    }

    get_profile_photo(member) {
        if (member && member.facePhotoURL) {
            return member.facePhotoURL;
        } else {
            return 'x' //environment.baseURL + "/gbs/static/images/dummy_face.png";
        }
    }

    num_displayed_stories() {
        return this.theme.is_desktop ? 4 : this.theme.width >= 992 ? 3 : this.theme.width >= 768 ? 2 : 1;
    }

    get stories_scroll() {
        if (!this.member) return false;
        let nd = this.num_displayed_stories() + 1;
        let ns = this.member_stories.lst.length;
        return nd < ns;
    }

    story(idx) {
        let empty_story = {name: "", story_text: "", dir: "rtl"};
        if (!this.member) return empty_story;
        if (this.stories_base < 0)
            this.stories_base = 0;
        let n = this.member_stories.lst.length;
        let i;
        let N = this.num_displayed_stories();
        if (n <= N + 1) {
            i = idx;
            /*if (idx > 0 && this.theme.rtltr === "rtl") {
                i = 5 - i;
            }*/
        } else if (idx == 0) {
            i = 0
        } else {
            i = (n + this.stories_base + idx) % (n - 1) + 1;
        }
        if (i < n) {
            let rec = this.member_stories.lst[i];
            rec.name = rec.name ? rec.name : "";
            rec.dir = this.theme.language_dir(rec.language);
            if (this.member_stories.lst && this.member_stories.lst.length > 0)
                this.bio = this.member_stories.lst[0];
            else this.bio = {editing_ok: true};
            return rec
        } else {
            return empty_story;
        }
    }

    @computedFrom("stories_base", "member_stories.changed")
    get stories_base_changed() {
        if (this.member_stories.changed) {
            this.member_stories.changed = 0;
            this.stories_base = -1;
        }
        this.story_0 = this.story(0);
        this.story_1 = this.story(1);
        this.story_2 = this.story(2);
        this.story_3 = this.story(3);
        this.story_4 = this.story(4);
        return false;
    }

    detach_photo_from_member(member_id, photo_id, slide_list) {
        this.api.call_server_post('photos/detach_photo_from_member', {member_id: member_id, photo_id: photo_id})
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
        this.dialog.open({
            viewModel: StoryWindow,
            model: {story: story, edit: what == 'edit'},
            lock: what == 'edit'
        }).whenClosed(response => {
            if (extra == 'life' && what == 'edit' && !this.member.member_info.story_id) {
                this.member.member_info.story_id = response.output.story_id;
                this.api.call_server_post('members/set_member_story_id', {
                    member_id: this.member.member_info.id,
                    story_id: response.output.story_id
                });
            }
        });

    }

    go_back() {
        this.router.navigateBack();
    }

    goto_story_page(story) {
        let what = story.used_for == this.api.constants.story_type.STORY4TERM ? 'term' : 'story';
        switch(story.used_for) {
            case this.api.constants.story_type.STORY4TERM: 
                this.router.navigateToRoute('story-detail', {id: story.story_id, what: 'term'});
                break;
            case this.api.constants.story_type.STORY4EVENT: 
                this.router.navigateToRoute('story-detail', {id: story.story_id, what: 'story'});
                break;
            case this.api.constants.story_type.STORY4DOC:
                this.router.navigateToRoute('doc-detail', { id: story.story_id, doc_ids: [], keywords: [], caller: 'member' });
                break;
            case this.api.constants.story_type.STORY4DOCSEGMENT:
                this.router.navigateToRoute('doc-detail', { id: story.story_id, segment_id: story.story_id, doc_ids: [], keywords: [], caller: 'member' });
                break;
            case this.api.constants.story_type.STORY4VIDEO:
                this.router.navigateToRoute('annotate-video', { video_id: story.story_id, what: 'story', keywords: [], search_type: "", caller: 'member' });
                break;
            default:
                console.log("Unsupported story type ", story.used_for);
        }
    }

    on_height_change(event) {
        event.stopPropagation();
        let {new_height} = event.detail;
        this.photo_strip_height = new_height;
        //this.panel_height = 680 - new_height;
        this.set_heights();
    }

    toggle_life_summary_size(event) {
        event.stopPropagation();
        this.life_summary_expanded = !this.life_summary_expanded;
        this.set_heights();
    }

    calc_px(s) {
        let n = s.length - 2;
        s = s.substring(0, n);
        return parseInt(s);
    }

    next_page(event) {
        let t = this.life_summary_content.scrollTop;
        let h = this.calc_px(this.life_summary_content.style.height);
        this.life_summary_content.scrollTop = t + h;
    }

    async set_heights() {
        for (let i = 0; i < 470; i++) {
            if (i > 7 && this.member) break;
            if (this.member && this.life_summary_box) break;
            await sleep(20);
        }
        if (this.member && this.life_summary_box)
             this._set_heights();
    }

    _set_heights() {
        let footer_height = 63;
        let ps_offset;
        let ps_height;
        if (this.photo_strip) {
            ps_offset = this.photo_strip.offsetTop;
            ps_height = this.photo_strip_height;
        } else {
            ps_offset = 0;
            ps_height = 0;
        }
        let panel_height = this.theme.height - ps_offset - ps_height - footer_height;
        panel_height = Math.max(panel_height, 544);
        let no_member_stories = this.member ? this.member_stories.lst.length < 2 : false;
        if (this.theme.is_desktop) {
            let n = no_member_stories ? 4 : 5;
            //this.member_detail_panel.style.height = `${panel_height - n}px`;
            this.member_detail_panel.style.marginRight = '-32px';
        }
        let tph = this.life_summary_expanded || no_member_stories ? panel_height : Math.round(panel_height / 2);
        if (this.life_summary_content && this.theme.is_desktop) {
            let lsco = this.life_summary_content.offsetTop + 16 + 16 + 2;  //16 for the top margin, 16 for bottom margin
            this.life_summary_content.style.height = `${tph - lsco}px`;
            this.family_connections_panel.style.height = `${tph - lsco}px`;
        }
        let bph = panel_height - tph;
        if (this.theme.height >= 800 && this.theme.width >= 1000) {
            let n = (this.member_stories.lst.length > 1) ? 5 : 100;
            this.top_panel.style.height = `${tph - n}px`;
            this.bottom_panel.style.height = `${bph}px`;
            this.bottom_panel.style.width = '1166px';
            this.bottom_panel.style.marginRight = '0px'
        } else {
            this.top_panel.style.height = null;
            this.bottom_panel.style.height = null;
        }
        if (ps_height > 190) bph -= 16;  //just black magic. I have no idea why this is needed
        this.story_box_height = bph - 3;
        if (this.theme.is_desktop) {
            if (this.life_summary_box)
                if (this.user.editing)
                    this.life_summary_box.style.height = '0%'// `${lsb}px`;
                else {
                    let n = no_member_stories ? 24 : 1;
                    this.life_summary_box.style.height = `${tph - n}px`;
                }
            if (this.life_summary_box1 && !this.user.editing)
                this.life_summary_box1.style.height = '99%'// `${lsb}px`;
            //this.family_connections_panel.style.height = '100%'; //`${lsh+d}px`;
        }
    }

    life_summary_contentChanged() {
        if (this.theme.is_desktop())
            this.set_heights();
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

    config_member_stories(event) {
        event.stopPropagation();
        document.body.classList.add('black-overlay');
        this.dialog.open({
            viewModel: ConfigMemberStories,
            model: {member_stories: this.member_stories, all_member_stories: this.member.member_stories},
            lock: true
        }).whenClosed(response => {
            document.body.classList.remove('black-overlay');
        });
    }

    @computedFrom('member.member_info')
    get member_is_dead() {
        if (!(this.member && this.member.member_info))
            return '';
        if (this.member.member_info.date_of_death.date)
            return 'zal';
        return '';
    }

    divorce(mem_id, who) {
        //event.stopPropagation();
        if (!this.user.editing || !this.user.privileges.ADMIN) 
            return;
        document.body.classList.add('black-overlay');
        this.dialog.open({
            viewModel: Divorce,
            model: {member_id: this.member_id, mem_id: mem_id, who: who},
            lock: true
        }).whenClosed(response => {
            const spouse_id = response.output.spouse_id
            const what = response.output.what;
            this.api.call_server('members/divorce', 
                {member_id: this.member_id, spouse_id: spouse_id, hide_spouse: response.output.hide_spouse, what: what})
                .then(response => {
                    this.member.family_connections.spouses = response.spouses;
                });
            document.body.classList.remove('black-overlay');
        });
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
