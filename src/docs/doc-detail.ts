import { autoinject, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { Misc } from '../services/misc';
import { highlight } from '../services/dom_utils';
import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { MemberPicker } from "../members/member-picker";
import { EventAggregator } from 'aurelia-event-aggregator';

class DocSegment {
    segment_id = 0;
    name = "";
    page_num = 0;
    page_part_num = 0;
    story_id = 0;
    member_ids = [];
    
    constructor(segment_id, name, page_num, page_part_num, story_id, member_ids) {
        this.segment_id = segment_id;
        this.name = name;
        this.page_num = page_num;
        this.page_part_num = page_part_num;
        this.story_id = story_id;
        this.member_ids = member_ids;
    } 
}

@autoinject()
export class DocDetail {
    api: MemberGateway;
    i18n: I18N;
    user: User;
    theme: Theme;
    misc: Misc;
    router: Router;
    doc = { name: 'no-name' };
    keywords = [];
    doc_ids = [];
    doc_segment_ids = [];
    topic_list = [];
    topic_groups = [];
    no_topics_yet = false;
    advanced_search = false;
    doc_id;
    doc_segment_id;
    doc_src_ready = false;
    _doc_src;
    doc_story;
    doc_date_str;
    doc_date_datespan;
    doc_date_valid = '';
    doc_topics;
    doc_story_id = null;
    chatroom_id = null;
    options_settings: MultiSelectSettings;
    selected_topics: any[]; 
    doc_name: any;
    can_go_forward = false;
    can_go_backward = false;
    highlight_on = "highlight-on";
    story_dir = "rtl";
    undo_list = [];
    curr_info = {
        doc_date_str: "",
        doc_date_datespan: 0,
        doc_topics: [],
    }
    dialog: DialogService;
    members = [];
    caller;
    doc_id_updated = false;
    fullscreen;
    doc_segments = []; //Array<DocSegment>;
    curr_doc_segment: DocSegment = null;
    expanded = "";
    selected_segment = null;
    selected_page = null;
    num_pages = 0;
    page_options = [];
    show_page_options = false;
    select_segment_str;
    create_segment_str;
    // autoClose = false;
    // select_segment_open = true;
    full_doc = true;
    thumbnails: FileList;
    working = false;
    ea;
    subscriber;
    photo_uploaded = false;
    counter = 0;
    orig_photo_link;

    constructor(api: MemberGateway, ea: EventAggregator, i18n: I18N, user: User, theme: Theme, misc: Misc,
        router: Router, dialog: DialogService) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
        this.misc = misc;
        this.router = router;
        this.dialog = dialog;
        this.ea = ea;
        this.options_settings = new MultiSelectSettings
            ({
                hide_higher_options: true,
                clear_filter_after_select: false,
                can_set_sign: false,
                can_add: true,
                can_group: false,
                empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            });
        this.fullscreen = this.i18n.tr('docs.fullscreen');
        this.select_segment_str = this.i18n.tr("docs.select-segment-str");
        this.create_segment_str = this.i18n.tr("docs.create-segment-str");
    }

    attached() {
        this.subscriber = this.ea.subscribe('DOC-SEG-THUMB-UPLOADED', msg => {
            this.working = false;
            this.photo_uploaded = msg.good;
        });
        this.orig_photo_link = this.user.get_photo_link();
    }

    detached() {
        this.subscriber.dispose();
        this.user.set_photo_link(this.orig_photo_link, 0);
    }

    async activate(params, config) {
        this.user.editing = false;  //work around a strange bug
        this.caller = params.caller;
        if (params.by_story_id)
            await this.convert_story_ids(params);
        else {
            this.doc_id = params.id;
            this.doc_segment_id = params.segment_id;
            if (this.doc_segment_id) {
                this.doc_segment_ids = params.doc_ids || [];
            } else {
                this.doc_ids = params.doc_ids || [];
            }
        }
        this.doc_id_updated = false;
        this.keywords = params.keywords;
        this.advanced_search = params.search_type == 'advanced';
        if(this.doc_segment_id) {
            await this.get_doc_segment_info(this.doc_segment_id);
            this.full_doc = false;
        } else {
            await this.get_doc_info(this.doc_id);
        }
        ///this.what = params.what ? params.what : "";
        await this.update_topic_list();        
    }

    convert_story_ids(params) {
        return this.api.call_server_post('docs/convert_story_ids', params)
        .then(response => {
            this.doc_id = response.doc_id;
            this.doc_segment_id = response.doc_segment_id;
            if (this.doc_segment_id)
                this.doc_segment_ids = response.doc_segment_ids || [];
            else
                this.doc_ids = response.doc_ids || [];
        })
    }

    get_doc_info(doc_id) {
        if (! doc_id) {
            alert("no doc id");
            return;
        }
        return this.api.call_server_post('docs/get_doc_info', { doc_id: doc_id })
            .then(response => {
                let search_str = "";
                this.doc_id = response.doc_id;
                this.doc_id_updated = true;
                this.doc = response.doc;
                this._doc_src = response.doc_src; // + search_str
                this.doc_src_ready = true;
                this.doc_name = response.doc_name;
                this.doc_topics = response.doc_topics;
                this.doc_story = response.doc_story;
                this.num_pages = response.num_pages;
                this.doc_date_str = response.doc_date_str;
                this.doc_date_datespan = response.doc_date_datespan;
                this.doc_story_id = response.story_id;
                this.chatroom_id = response.chatroom_id;
                this.init_selected_topics();
                // for the undo to work
                this.curr_info.doc_topics = this.doc_topics.slice(0);
                this.curr_info.doc_date_str = this.doc_date_str.slice(0);
                this.curr_info.doc_date_datespan = this.doc_date_datespan;
                this.undo_list = [];
                this.members = response.members;
                let doc_segments = [];
                if (! response.doc_segments)  // until it works
                    response.doc_segments = [];
                for (let doc_segment of response.doc_segments) {
                    const ds = new DocSegment(
                        doc_segment.segment_id, 
                        doc_segment.name, 
                        doc_segment.page_num, 
                        doc_segment.page_part_num,
                        doc_segment.story_id, 
                        doc_segment.members);
                    doc_segments.push(ds);
                }
                this.doc_segments = doc_segments;
                this.page_options = [];
                for (let i = 0; i <= this.num_pages; i++) {
                    let option = {name: this.i18n.tr("docs.page") + " " + i, value: i}
                    this.page_options.push(option);
                }
                this.api.hit('DOC', doc_id);
                this.user.set_photo_link(response.doc_thumbnail_url, 0);
            });
    }

    get_doc_segment_info(doc_segment_id) {
        this.doc_segment_id = doc_segment_id;
        return this.api.call_server_post('docs/get_doc_segment_info', { doc_segment_id: doc_segment_id })
        .then(response => {
            this.curr_doc_segment = new DocSegment(
                doc_segment_id, 
                response.name, 
                response.page_num, 
                response.page_part_num, 
                response.story_id, 
                response.members);
            this.doc_story_id = response.story_id;
            this.doc_id = response.doc_id;
            this._doc_src = response.doc_src;
            this.doc_src_ready = true;
            this.doc_story = response.story;
            this.doc_name = response.name;
            this.members = response.members;
            this.doc_topics = response.doc_topics;
            this.init_selected_topics();
            this.doc_date_str = response.doc_seg_date_str;
            this.doc_date_datespan = response.doc_seg_date_datespan;
            // for the undo to work
            this.curr_info.doc_topics = this.doc_topics.slice(0);
            this.curr_info.doc_date_str = this.doc_date_str.slice(0);
            this.curr_info.doc_date_datespan = this.doc_date_datespan;
            this.api.hit('DOCSEG', this.doc_segment_id);
            this.user.set_photo_link(response.doc_segment_thumbnail_url, 0);
        });
    }

    page_num_selected(event) {
        this.show_page_options = false;
        let page_num = this.selected_page.value;
        if (page_num == 0) {
            this.curr_doc_segment = null;
            return;
        }
        const tmp = this.doc_segments.filter(ds => ds.page_num == page_num);
        const page_part_num = tmp.length;
        const untitled = this.i18n.tr("docs.untitled");
        this.api.call_server_post('docs/create_segment', 
            {doc_id: this.doc_id, 
            page_num: page_num, 
            page_part_num: page_part_num,
            untitled: untitled
        })
        .then(response => {
            const doc_segment = new DocSegment(
                response.segment_id, 
                response.name, 
                page_num, 
                page_part_num, 
                response.story_id, 
                []);
            this.doc_segments.splice(this.doc_segments.length, 0, doc_segment);
            this.doc_segments.sort((ds1, ds2) => (ds1.page_num*1000 - ds2.page_num*1000 + ds1.page_part_num - ds2.page_part_num));
            this.curr_doc_segment = doc_segment;
            this.get_doc_segment_info(response.segment_id)
        });
    }

    update_topic_list() {
        const dsi = this.calc_doc_segment_id();
        const topic_type = dsi ? "S" : "D";
        let usage = this.user.editing ? {} : { usage: topic_type };
        return this.api.call_server_post('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                //this.photographer_list = result.photographer_list;
                this.no_topics_yet = this.topic_list.length == 0;
                //this.no_photographers_yet = this.photographer_list.length == 0;
            });
    }

    calc_doc_segment_id() {
        if (this.doc_segment_id) 
            return this.doc_segment_id;
        if (this.curr_doc_segment) 
            return this.curr_doc_segment.segment_id;
        return null; 
    }

    update_doc_date(customEvent) {
        customEvent.stopPropagation();
        if (this.doc_date_valid != 'valid') return;
        let event = customEvent.detail;
        let s = typeof event;
        this.undo_list.push({ what: 'doc-date', 
            doc_date: { doc_date_str: this.curr_info.doc_date_str, doc_date_datespan: this.curr_info.doc_date_datespan } });
        this.curr_info.doc_date_str = this.doc_date_str.slice(0);
        this.curr_info.doc_date_datespan = this.doc_date_datespan;
        this.api.call_server_post('docs/update_doc_date', { 
            story_id: this.doc_story_id,
            doc_date_str: event.date_str, 
            doc_date_datespan: event.date_span 
         });
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.undo_list.push({ what: 'topics', doc_topics: this.curr_info.doc_topics });
        const selected_topics = event.detail.selected_options
        this.doc_topics = selected_topics.map(top => top.option);
        this.curr_info.doc_topics = this.doc_topics.slice(0);
        this.api.call_server_post('docs/apply_topics_to_doc', 
            { story_id: this.doc_story_id, topics: this.doc_topics, is_doc_segment: Boolean(this.doc_segment_id) });
    }

    init_selected_topics() {
        let selected_topics = [];
        let i = 0;
        for (let opt of this.doc_topics) {
            opt.sign = '';
            let itm = { option: opt, first: i == 0, last: i == this.doc_topics.length - 1, group_number: i + 1 }
            selected_topics.push(itm);
            i += 1;
        }
        this.selected_topics = selected_topics;
    }

    undo() {
        let command = this.undo_list.pop();
        switch (command.what) {
            case "topics":
                this.doc_topics = command.doc_topics;
                this.curr_info.doc_topics = this.doc_topics.slice(0);
                this.init_selected_topics();
                this.api.call_server_post('docs/apply_topics_to_doc', 
                    { story_id: this.doc_story_id, topics: this.doc_topics, is_doc_segment: Boolean(this.doc_segment_id) });
                break;
            case "doc-date":
                this.doc_date_str = command.doc_date.doc_date_str;
                this.doc_date_datespan = command.doc_date.doc_date_datespan;
                this.curr_info.doc_date_str = this.doc_date_str.slice(0);
                this.curr_info.doc_date_datespan = this.doc_date_datespan;
                this.api.call_server_post('docs/update_doc_date',
                    { story_id: this.doc_story_id, doc_date_str: this.doc_date_str, doc_date_datespan: this.doc_date_datespan });
                break;
        }
    }
    

    go_back() {
        if (this.caller == 'docs')
            this.router.navigateToRoute('docs'); //strange bug causes it to go prev until the first
        else {
            this.router.navigateBack();
        }
    }


    @computedFrom('user.editing')
    get user_editing() {
        if (this.user.editing_mode_changed)
            this.update_topic_list();
        return this.user.editing;
    }

    @computedFrom('doc_topics')
    get topic_names() {
        if (!this.doc_topics) return "";
        let topic_name_list = this.doc_topics.map(itm => itm.name);
        return topic_name_list.join(';  ');
    }

    @computedFrom('doc_story', 'doc_story.story_text', 'story_changed', 'keywords', 'advanced_search')
    get highlightedHtml() {
        if (!this.doc_story) {
            return "";
        }
        let text;
        text = this.doc_story.story_text;
        let highlighted_html = highlight(text, this.keywords, this.advanced_search);
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

    doc_idx() {
        // let doc_id = this.full_doc ? this.doc_id : this.doc_segment_id;
        // return this.doc_ids.findIndex(pid => pid == doc_id);
        if (this.full_doc)
            return this.doc_ids.findIndex(pid => pid == this.doc_id);
        return this.doc_segment_ids.findIndex(pid => pid == this.doc_segment_id);
    }

    public has_next(step) {
        let idx = this.doc_idx();
        let n = this.full_doc ? this.doc_ids.length : this.doc_segment_ids.length;
        return (0 <= (idx + step)) && ((idx + step) < n - 1);
    }

    @computedFrom('doc_id', 'doc_segment_id')
    get prev_class() {
        if (this.has_next(-1)) return '';
        return 'disabled'
    }

    @computedFrom('doc_id', 'doc_segment_id')
    get next_class() {
        if (this.has_next(+1)) return '';
        return 'disabled'
    }
    get_doc_by_idx(idx) {
        let did;
        if (this.full_doc) {
            did = this.doc_ids[idx]
            this.get_doc_info(did);
        } else {
            did = this.doc_segment_ids[idx];
            this.get_doc_segment_info(did);
        }
    }

    public go_next(event) {
        event.stopPropagation();
        let ids_arr = this.full_doc ? this.doc_ids : this.doc_segment_ids;
        let idx = this.doc_idx();
        if (idx + 1 < ids_arr.length) {
            this.get_doc_by_idx(idx + 1);
            this.can_go_forward = idx + 2 < ids_arr.length;
            this.can_go_backward = true;
        }
    }

    public go_prev(event) {
        event.stopPropagation();
        let idx = this.doc_idx();
        if (idx > 0) {
            this.get_doc_by_idx(idx - 1)
            this.can_go_forward = true;
            this.can_go_backward = idx > 1;
        }
    }

    create_chatroom() {
        this.api.call_server_post('chats/add_chatroom', { story_id: this.doc_story_id, new_chatroom_name: this.i18n.tr('user.chats') })
            .then((data) => {
                this.chatroom_id = data.chatroom_id;
            });
    }

    chatroom_deleted(event) {
        this.api.call_server_post('chats/chatroom_deleted', { story_id: this.doc_story_id });
    }


    select_doc_members() {
        this.theme.hide_title = true;
        let member_ids = this.members.map(member => member.id)
        this.dialog.open({
            viewModel: MemberPicker,
            model: { multi: true, back_to_text: 'docs.back-to-doc', preselected: member_ids },
            lock: false,
            rejectOnCancel: false
        }).whenClosed(response => {
            this.theme.hide_title = false;
            if (response.wasCancelled) return;
            member_ids = Array.from(response.output.member_ids);
            const dsi = this.calc_doc_segment_id();
            if (dsi) {
                this.api.call_server_post('docs/update_doc_segment_members', {
                    doc_segment_id: dsi,
                    member_ids: member_ids
                }).then(response => {
                    this.members = response.members;
                });
            } else {
                this.api.call_server_post('docs/update_doc_members', {
                    doc_id: this.doc_id,
                    member_ids: member_ids
                }).then(response => {
                    this.members = response.members;
                });
            }   
        });
    }

    @computedFrom('curr_doc_segment.page_num', '_doc_src', 'doc_src_ready')
    get doc_src() {
        let src = this._doc_src;
        src += `?d=${this.counter}`;
        this.counter += 1;
        src += (this.curr_doc_segment ? `#page=${this.curr_doc_segment.page_num}` : "");
        return src;
    }

    async makeFullScreen() {
        let el = document.getElementById("doc-frame");
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else {
            console.log("Fullscreen API is not supported");
        }
    }

    update_story_preview(event) {
        this.doc_name = this.doc_story.name;
        if (this.curr_doc_segment) {
            const doc_segment = this.doc_segments.find(ds => ds.segment_id == this.curr_doc_segment.segment_id);
            if (doc_segment)
                doc_segment.name = this.doc_name;
        }
        let story_id = this.doc_story.story_id;
        this.api.call_server_post("docs/update_story_preview", {story_id: story_id});
    }

    change_doc_frame_size(customEvent) {
        const event = customEvent.detail;
        const el = document.getElementById("doc-frame");
        const hs = el.style.height.replace("px", "");
        let h = parseFloat(hs) + event.dy;
        el.style.height = `${h}px`;
    }

    toggle_height() {
        if (this.expanded == "expanded")
            this.expanded = ""
        else 
            this.expanded = "expanded"
    }

    @computedFrom('expanded')
    get toggle_size_prompt() {
        if (this.expanded == "expanded") return "docs.collapse";
        return "docs.expand"
    }

    select_segment(doc_segment) {
        //this.select_segment_open = true;
        this.curr_doc_segment = this.doc_segments.find(ds => ds.segment_id == doc_segment.segment_id);
        this.get_doc_segment_info(this.curr_doc_segment.segment_id);
    }

    create_segment() {
        //this.select_segment_open = true;
        this.show_page_options = true;    
    }

    remove_segment(doc_segment) {
        this.api.call_server("docs/remove_doc_segment", {doc_segment_id: doc_segment.segment_id})
        .then(response => {
            const idx = this.doc_segments.findIndex(ds => ds.segment_id==doc_segment.segment_id);
            this.doc_segments.splice(idx, 1);
        })
    }

    edit_segment(doc_segment) {
        alert("not ready yet");
    }

    view_full_document() {
        this.curr_doc_segment = null;
        this.get_doc_info(this.doc_id);
    }

    @computedFrom("user.editing", "doc_segments")
    get show_segments() {
        if (this.user.editing) return true;
        if (this.doc_segments.length > 0) return true;
        return false;
    }

    @computedFrom("user.editing", "doc_segments")
    get doc_story_class() {
        if (this.user.editing) return "editing-segments";
        if (this.doc_segments.length > 0) return "show-segments"
        return ""
    }

    save_thumbnail(event: Event) {
        event.stopPropagation();
        this.working = true;
        this.api.uploadFiles(
            this.user.id,
            this.thumbnails,
            'DOC-SEG-THUMB',
            { doc_id: this.doc_id, segment_id: this.curr_doc_segment.segment_id, ptp_key: this.api.constants.ptp_key }
        )
    }

    @computedFrom('thumbnails', 'photo_uploaded')
    get phase() {
        if (this.photo_uploaded) {
            this.photo_uploaded = false;
            this.thumbnails = null;
            //return 'photo-uploaded';
        }
        if (this.thumbnails && this.thumbnails.length > 0) return 'ready-to-save';
        return 'ready-to-select';
    }

    dropdown_toggled() {
        //black magic. without this a wrong page is displayed
        this.view_full_document();
    }

    copy_doc_dates_to_segments() {
        this.api.call_server_post("docs/copy_doc_date_to_doc_segments", {doc_id: this.doc_id});
    }

}

