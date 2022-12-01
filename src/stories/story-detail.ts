import { autoinject, computedFrom } from 'aurelia-framework';
import { I18N } from '@aurelia/i18n';
import { MemberGateway } from '../../_OLD/src/services/gateway';
import { User } from '../../_OLD/src/services/user';
import { Theme } from '../../_OLD/src/services/theme';
import { Misc } from '../../_OLD/src/services/misc';
import { highlight } from '../../_OLD/src/services/dom_utils';
import { MemberList } from "../../_OLD/src/services/member_list";
import { ArticleList } from '../../_OLD/src/services/article_list';
import { IRouter } from '@aurelia/router';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import {ShowPhoto} from "../../_OLD/src/services/show-photo";
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import {MemberPicker} from "../../_OLD/src/members/member-picker";
import {ArticlePicker} from "../../_OLD/src/articles/article-picker";
import {PhotoPicker} from "../../_OLD/src/photos/photo-picker";

@autoinject()
export class StoryDetail {
    api;
    i18n;
    story;
    members = [];
    member_list: MemberList;
    article_list: ArticleList;
    articles = [];
    candidates = [];
    article_candidates = [];
    has_associated_photos = false;
    photos;
    curr_photo;
    photo_idx = 0;
    source;
    restart_slides = 0;
    user;
    theme;
    show_photo: ShowPhoto;
    misc: Misc;
    story_dir;
    new_story = false;
    keywords;
    story_list; //for prev / next
    story_idx = -1;
    highlight_on = "highlight-on";
    router: Router;
    eventAggregator;
    dialog;
    subscriber;
    subscriber1;
    story_type;
    used_for;
    advanced_search;
    search_type;
    story_changed = false;
    story_box;
    chatroom_id;
    sorting_key = ['', '', '', '', ''];
    topic_list = [];
    no_topics_yet = false;
    topic_groups = [];
    selected_topics = [];
    options_settings: MultiSelectSettings;
    story_topics;
    undo_list = [];
    story_date_str = "";
    story_date_datespan = 0;
    curr_info = {
        story_date_str: "",
        story_date_datespan: 0,
        story_topics: [],
        sorting_key: []
    };
    last_filled_idx = 0;
    nudnik;
    book_id;
    book_name = "";
    btn_prev;
    btn_next;
    story_date_valid = '';
    move_to;
    ready_to_edit = false;

    constructor(api: MemberGateway, i18n: I18N, user: User, router: Router, member_list: MemberList, article_list: ArticleList,
                theme: Theme, misc: Misc, eventAggregator: EventAggregator, dialog: DialogService, show_photo: ShowPhoto) {
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
        this.show_photo = show_photo;
        this.misc = misc;
        this.dialog = dialog;
        this.member_list = member_list;
        this.article_list = article_list;
        this.eventAggregator = eventAggregator;
        this.options_settings = new MultiSelectSettings
            ({
                hide_higher_options: true,
                clear_filter_after_select: false,
                can_set_sign: false,
                can_add: true,
                can_group: false,
                empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            });
    }

    attached() {
        this.nudnik = setInterval(() => this.calc_last_filled(), 50);
        this.subscriber = this.eventAggregator.subscribe('Zoom2', payload => {
            //this.openDialog(payload.slide, payload.event, payload.slide_list)
            let offset = payload.offset;
            this.misc.save(['story_slides_offset', this.story.story_id], offset);
            if (payload.event.ctrlKey) {
                this.openDialog(payload.slide, payload.event, payload.slide_list)
                return;
            }
            let photo_ids = payload.slide_list.map(photo => photo.photo_id);
            this.show_photo.show(payload.slide, payload.event, photo_ids);
        });
        this.subscriber1 = this.eventAggregator.subscribe('STORY_WAS_SAVED', payload => { this.refresh_story(payload.story_data.story_id) });
    }

    refresh_story(story_id) {
        if (this.new_story) {
            this.story_list.push(story_id);
            this.router.navigateToRoute('story-detail', { id: story_id, what: this.story_type });
            return;
        }
        let sid = this.story ? this.story.story_id : null;
        if (sid != story_id) return; //otherwise one user saves story and another's story changes to the saved one!
        this.api.call_server_post('members/get_story', { story_id: story_id })
            .then(response => {
                this.story = response.story;
                this.story_changed = true;
            });
    }

    detached() {
        this.subscriber.dispose();
        this.subscriber1.dispose();
        this.nudnik = 0;
    }

    async loading(params, config) {
        this.keywords = params.keywords;
        this.search_type = params.search_type;
        this.advanced_search = params.search_type == 'advanced';
        let used_for = params.used_for
        if (used_for) {
            this.used_for = parseInt(used_for)
        } else {
            this.used_for = (params.what && params.what == 'term') ?
                this.api.constants.story_type.STORY4TERM : (params.what && params.what == 'help') ?
                    this.api.constants.story_type.STORY4HELP : this.api.constants.story_type.STORY4EVENT;
        }
        this.story_list = params.story_list || [];
        let story_id = params.id;
        this.story_idx = this.story_list.findIndex(itm => itm == story_id)
        await this.update_topic_list();
        this.story_type = (this.used_for == this.api.constants.story_type.STORY4TERM) ? 'term' : (this.used_for == this.api.constants.story_type.STORY4ELP) ? 'help' : 'story';
        this.get_story_details(story_id);
        let offset = this.misc.load(['story_slides_offset', story_id]);
        if (offset) this.move_to = offset;

    }

    get_story_details(story_id) {
        let what = this.story_type == 'story' ? 'EVENT' : this.story_type == 'help' ? 'HELP' : 'TERM';
        this.api.getStoryDetail({ story_id: story_id })
            .then(response => {
                this.api.hit(what, story_id);
                this.story = response.story;
                this.chatroom_id = this.story.chatroom_id;
                if (this.story.story_id == 'new') {
                    this.story.name = this.i18n.tr('stories.new-story');
                    this.story.story_text = this.i18n.tr('stories.new-story-content');
                    this.story.used_for = this.used_for;
                    this.story_dir = this.theme.rtltr;
                    this.new_story = true;
                } else {
                    this.story_dir = this.theme.language_dir(this.story.language);
                    this.new_story = false;
                }
                this.members = response.members;
                this.articles = response.articles;
                this.candidates = response.candidates;
                this.article_candidates = response.article_candidates;
                this.photos = response.photos;
                this.story_topics = response.story_topics;
                this.init_selected_topics();
                this.book_id = response.book_id;
                this.book_name = response.book_name;
                this.sorting_key = response.sorting_key || [0, 0, 0, 0, 0];
                let story_date = response.story_date;
                this.story_date_str = story_date.date;
                this.story_date_datespan = story_date.span;
                this.curr_info = {
                    sorting_key: this.sorting_key.slice(0),
                    story_date_str: this.story_date_str.slice(0),
                    story_date_datespan: this.story_date_datespan,
                    story_topics: this.story_topics
                }
                if (this.photos.length > 0) {
                    this.curr_photo = this.photos[0].photo_path;
                }
                this.ready_to_edit = true;
                if (what == 'help') return;
                if (this.new_story) return;
                this.source = this.api.call_server_post('members/get_story_photo_list', { story_id: story_id, story_type: this.story_type });
                this.source.then(response => this.has_associated_photos = response.photo_list.length > 0);
            });
    }

    next_photo() {
        this.photo_idx = (this.photo_idx + 1) % this.photos.length;
        this.curr_photo = this.photos[this.photo_idx].photo_path;
    }

    update_associated_members() {
        this.theme.hide_title = true;
        let member_ids = this.members.map(member => Number(member.id));
        this.dialog.open({
            viewModel: MemberPicker,
            model: {multi: true, back_to_text: 'members.back-to-story', preselected: member_ids},
            lock: false,
            rejectOnCancel: false
        }).whenClosed(response => {
            this.theme.hide_title = false;
            if (response.wasCancelled) return;
            let member_ids = Array.from(response.output.member_ids);
            let member_set = new Set(member_ids);
            this.api.call_server_post('members/save_group_members', {caller_id: this.story.story_id, caller_type: this.story_type, member_ids: member_ids});
            this.members = this.member_list.members.member_list.filter(member => member_set.has(member.id))
        });
    }

    update_associated_articles() {
        this.theme.hide_title = true;
        let article_ids = this.articles.map(article => Number(article.id));
        this.dialog.open({
            viewModel: ArticlePicker,
            model: {multi: true, back_to_text: 'members.back-to-story', preselected: article_ids},
            lock: false,
            rejectOnCancel: false
        }).whenClosed(response => {
            this.theme.hide_title = false;
            if (response.wasCancelled) return;
            let article_ids = Array.from(response.output.article_ids);
            let article_set = new Set(article_ids);
            this.api.call_server_post('articles/save_group_articles', {caller_id: this.story.story_id, caller_type: this.story_type, article_ids: article_ids});
            this.articles = this.article_list.articles.article_list.filter(article => article_set.has(article.id));
        });
    }


    update_associated_photos() {
        let photo_ids = this.photos.map(photo => Number(photo.id));
        this.dialog.open({
            viewModel: PhotoPicker,
            model: {associated_photos: photo_ids}
        }).whenClosed(response => {
            if (response.wasCancelled) return;
            photo_ids = response.output.associated_photos;
            this.api.call_server_post('members/save_photo_group',
            {user_id: this.user.id, caller_id: this.story.story_id, caller_type: this.story_type, photo_ids: photo_ids})
                .then(response => {
                    this.photos = response.photos;
                    this.has_associated_photos = response.photos.length > 0;
                    this.source = this.api.call_server_post('members/get_story_photo_list', { story_id: this.story.story_id, story_type: this.story_type });
                    this.restart_slides = 1;
                })
        });
    }

    go_back() {
        this.router.back();
    }

    go_prev(event) {
        event.stopPropagation();
        this.btn_prev.blur();
        if (this.story_idx > 0) {
            this.story_changed = true;
            this.story_idx -= 1;
            let story_id = this.story_list[this.story_idx];
            //this.router.navigateToRoute('story-detail', { id: story_id, what: 'story', keywords: this.keywords, search_type: this.search_type, story_list: this.story_list });
            this.get_story_details(story_id)
        }
    }

    go_next(event) {
        event.stopPropagation();
        this.btn_next.blur();
        if (this.story_idx < this.story_list.length - 1) {
            this.story_changed = true;
            this.story_idx += 1;
            let story_id = this.story_list[this.story_idx];
            //this.router.navigateToRoute('story-detail', { id: story_id, what: 'story', keywords: this.keywords, search_type: this.search_type, story_list: this.story_list });
            this.get_story_details(story_id)
        }
    }

    private openDialog(slide, event, slide_list) {
        event.stopPropagation();
        if (event.altKey && event.shiftKey) {
            this.detach_photo_from_story(this.story.story_id, slide.photo_id, slide_list);
            return;
        }
        document.body.classList.add('black-overlay');
        let photo_ids = slide_list.map(slide => slide.id)
        this.show_photo.show(slide, event, photo_ids);
    }

    detach_photo_from_story(story_id, photo_id, slide_list) {
        this.api.call_server_post('members/detach_photo_from_event', { story_id: story_id, photo_id: photo_id })
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

    toggle_highlight_on() {
        if (this.highlight_on) {
            this.highlight_on = ""
        } else {
            this.highlight_on = "highlight-on"
        }
        document.getElementById("word-highlighter").blur();
    }

    accept_candidate(candidate_id, idx) {
        let mems = this.candidates.slice(idx, idx + 1);
        this.candidates.splice(idx, 1);
        let mem = mems[0];
        this.members.push(mem);
        this.api.call_server_post('members/add_story_member', { story_id: this.story.story_id, candidate_id: candidate_id });
    }

    accept_article_candidate(candidate_id, idx) {
        let arts = this.article_candidates.slice(idx, idx + 1);
        this.article_candidates.splice(idx, 1);
        let art = arts[0];
        this.articles.push(art);
        this.api.call_server_post('members/add_story_article', { story_id: this.story.story_id, candidate_id: candidate_id });
    }

    @computedFrom('story.story_text', 'story_changed')
    get highlightedHtml() {
        this.story_changed = false;
        if (!this.story) {
            return "";
        }
        let highlighted_html = highlight(this.story.story_text, this.keywords, this.advanced_search);
        return highlighted_html;
    }

    // next_page(event, dif) {
    //     let t = this.story_box.scrollTop;
    //     let h = this.story_box.clientHeight;
    //     t += dif * (h - 24);
    //     if (t < 0) {
    //         t = 0;
    //     }
    //     this.story_box.scrollTop = t;
    // }

    @computedFrom('story_idx')
    get prev_disabled() {
        if (this.story_idx <= 0) return 'disabled';
        return '';
    }

    @computedFrom('story', 'story.name')
    get story_name() {
        if (this.story) return this.story.name;
        return '';
    }

    @computedFrom('story_idx')
    get next_disabled() {
        if (this.story_idx >= this.story_list.length - 1) return 'disabled';
        return '';
    }

    create_chatroom() {
        this.api.call_server('chats/add_chatroom', { story_id: this.story.story_id, new_chatroom_name: this.i18n.tr('user.chats') })
            .then((data) => {
                this.chatroom_id = data.chatroom_id;
            });
    }

    chatroom_deleted() {
        this.api.call_server_post('chats/chatroom_deleted', { story_id: this.story.story_id });
    }

    keep_only_digits(event, idx) {
        let key = event.key;
        if (key == "Enter") {
            return true;
        }
        let m = key.match(/[0-9/]/) || key == 'Backspace' || key == 'Delete';
        if (!m) {
            event.preventDefault();
        }
        return m != null;
    }

    calc_last_filled() {
        for (let idx of [0, 1, 2, 3, 4]) {
            if (!this.sorting_key[idx]) {
                this.last_filled_idx = idx;
                return;
            }
        }
    }

    sorting_key_changed(event, idx) {
        this.undo_list.push({ what: 'sorting-key', sorting_key: this.curr_info.sorting_key });
        this.curr_info.sorting_key = this.sorting_key.slice(0);
        this.api.call_server_post('members/save_sorting_key', { story_id: this.story.story_id, sorting_key: this.sorting_key });
    }

    update_topic_list() {
        this.api.call_server_post('topics/get_topic_list', { usage: 'ET' })
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.no_topics_yet = this.topic_list.length == 0;
            });
    }

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', { topic_name: new_topic_name })
            .then(() => this.update_topic_list());
    }

    init_selected_topics() {
        this.selected_topics = [];
        let i = 0;
        let story_topics = this.story_topics || [];
        for (let opt of story_topics) {
            opt.sign = '';
            let itm = { option: opt, first: i == 0, last: i == this.story_topics.length - 1, group_number: i + 1 }
            this.selected_topics.push(itm);
            i += 1;
        }
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.selected_topics = event.detail.selected_options
        let topics = this.selected_topics.map(top => top.option);
        this.story_topics = topics;
        this.undo_list.push({ what: 'topics', story_topics: this.curr_info.story_topics });
        this.curr_info.story_topics = topics.slice(0);
        this.api.call_server_post('members/apply_topics_to_story', {
            story_id: this.story.story_id,
            story_topics: this.story_topics,
            used_for: this.story.used_for
        });
    }

    update_story_date(customEvent) {
        customEvent.stopPropagation();
        if (! this.story_date_valid) return;
        let event = customEvent.detail;
        let s = typeof event;
        this.undo_list.push({
            what: 'story-date',
            story_date: {
                story_date_str: this.curr_info.story_date_str,
                story_date_datespan: this.curr_info.story_date_datespan
            }
        });
        this.curr_info.story_date_str = this.story_date_str.slice(0);
        this.curr_info.story_date_datespan = this.story_date_datespan;
        this.api.call_server_post('members/update_story_date',
            {
                story_date_str: event.date_str, story_date_datespan: event.date_span,
                story_id: this.story.story_id
            });
    }

    undo() {
        let command = this.undo_list.pop();
        switch (command.what) {
            case "topics":
                this.story_topics = command.story_topics.slice(0);
                this.curr_info.story_topics = command.story_topics.slice(0);
                this.init_selected_topics();
                this.api.call_server_post('members/apply_topics_to_story',
                    {
                        story_id: this.story.story_id,
                        story_topics: this.story_topics,
                        used_for: this.story.used_for
                    });
                break;
            case "story-date":
                this.story_date_str = command.story_date.story_date_str;
                this.curr_info.story_date_str = command.story_date.story_date_str;
                this.story_date_datespan = command.story_date.story_date_datespan;
                this.curr_info.story_date_datespan = command.story_date.story_date_datespan;
                this.api.call_server_post('members/update_story_date',
                    {
                        story_date_str: this.story_date_str,
                        story_date_datespan: this.story_date_datespan,
                        story_id: this.story.story_id
                    });
                break;
            case "sorting-key":
                this.sorting_key = command.sorting_key.slice(0);
                this.curr_info.sorting_key = command.sorting_key.slice(0);
                this.api.call_server_post('members/save_sorting_key',
                    { story_id: this.story.story_id, sorting_key: this.sorting_key });
                break;
        }
    }

    remove_story_from_book() {
        this.api.call_server_post('topics/remove_story_from_book', {story_id: this.story.story_id, book_id: this.book_id})
            .then(response => {this.book_id = null});
    }

}
