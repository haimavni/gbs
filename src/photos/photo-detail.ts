import { autoinject, computedFrom } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';
import { highlight } from '../services/dom_utils';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';

@autoinject()
export class PhotoDetail {
    api;
    user;
    i18n;
    members;
    photos;
    curr_photo;
    source;
    photo_id;
    true_photo_id;
    photo_src;
    photo_name;
    photo_story;
    photo_date_str;
    photo_date_datespan;
    orig_photo_width = 0;
    orig_photo_height = 0;
    photo_width = 600;
    photo_margin = 0;
    MAX_WIDTH = 600;  //todo: use dynamic info about the screen?
    MAX_HEIGHT = 550;
    dialog;
    router;
    keywords;
    advanced_search;
    highlight_on = "highlight-on";
    photographer_name = '';
    chatroom_id = null;
    options_settings: MultiSelectSettings;
    photographers_settings;
    topic_list = [];
    photographer_list = [];
    has_grouped_topics = false;
    topic_groups = [];
    photo_topics;
    params = {
        selected_topics: [],
        selected_photographers: [],
        photo_ids: [],
    };

    constructor(api: MemberGateway, i18n: I18N, user: User, dialog: DialogService, router: Router) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.dialog = dialog;
        this.router = router;
        this.options_settings = new MultiSelectSettings({
            clear_filter_after_select: false,
            can_set_sign: true,
            can_group: true,
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
        });
        this.photographers_settings = new MultiSelectSettings({
            clear_filter_after_select: true,
            can_set_sign: false,
            can_group: false,
            empty_list_message: this.i18n.tr('photos.no-photographers-yet')
        });
    }

    activate(params, config) {
        this.keywords = params.keywords;
        this.advanced_search = params.search_type == 'advanced';
        this.api.getPhotoDetail({ photo_id: params.id, what: params.what })
            .then(response => {
                this.photo_id = params.id;
                this.photo_src = response.photo_src;
                this.photo_story = response.photo_story;
                this.photo_name = this.photo_story.name || response.photo_name;
                this.photographer_name = response.photographer_name;
                this.photo_topics = response.photo_topics;
                this.topic_list = response.topic_list;
                this.true_photo_id = response.photo_id; //this.photo_id may be associated story id
                if (this.photo_story.story_id == 'new') {
                    this.photo_story.name = this.i18n.tr('photos.new-story');
                    this.photo_story.story_text = this.i18n.tr('photos.new-story-content');
                }
                this.photo_date_str = response.photo_date_str;
                this.photo_date_datespan = response.photo_date_datespan;
                this.orig_photo_width = response.width;
                this.orig_photo_height = response.height;
                this.chatroom_id = response.chatroom_id;
                this.init_selected_topics();
                this.calc_photo_width();
            });
            this.update_topic_list();
    }

    init_selected_topics() {
        this.params.selected_topics = [];
        let i = 0;
        for (let opt of this.photo_topics) {
            opt.sign = 'plus';
            let itm = {option: opt, first: i == 0, last: i == this.photo_topics.length - 1}
            this.params.selected_topics.push(itm);
            i += 1;
        }
    }

    @computedFrom('photo_topics')
    get topic_names() {
        if (!this.photo_topics) return "";
        let topic_name_list = this.photo_topics.map(itm => itm.name);
        return topic_name_list.join(';');
    }

    async calc_photo_width() {
        console.log("tinofet 1");
        let pw = this.orig_photo_width / this.MAX_WIDTH;
        let ph = this.orig_photo_height / this.MAX_HEIGHT;
        if (pw >= ph) {
            this.photo_width = this.MAX_WIDTH;
        } else {
            this.photo_width = this.orig_photo_width / ph;
        }
        console.log("tinofet 2");
        await sleep(100);
        let el = document.getElementById('photo-box');
        console.log("el is: ", el);
        let width = el.clientWidth;
        el.style.paddingRight = `${width - this.photo_width - 15}px`;
    }

    update_photo_caption(event) {
        this.api.call_server_post('photos/update_photo_caption', { caption: this.photo_name, photo_id: this.photo_id })
            .then(() => { alert('changed') });
    }

    update_photo_date(customEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let s = typeof event;
        this.api.call_server('photos/update_photo_date', { photo_date_str: event.date_str, photo_date_datespan: event.date_span, photo_id: this.photo_id });
    }

    private openDialog(slide, slide_list) {
        document.body.classList.add('black-overlay');
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide, slide_list: slide_list }, lock: false })
            .whenClosed(response => {
                //do something?
                document.body.classList.remove('black-overlay');
            });
    }


    open_full_size_photo() {
        let slide = {
            side: 'front',
            front: {
                src: this.photo_src,
                width: this.orig_photo_width,
                height: this.orig_photo_height,
                photo_id: this.true_photo_id
            },
            name: this.photo_name,
            photo_id: this.true_photo_id
        };
        let slide_list = [];  //temporary. the true list must be passed by the caller
        this.openDialog(slide, slide_list);
    }

    go_back() {
        this.router.navigateBack();
    }

    @computedFrom('photo_story.story_text', 'story_changed')
    get highlightedHtml() {
        if (!this.photo_story) {
            return "";
        }
        let highlighted_html = highlight(this.photo_story.story_text, this.keywords, this.advanced_search);
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

    create_chatroom() {
        this.api.call_server('chats/add_chatroom', { story_id: this.photo_story.story_id, new_chatroom_name: this.i18n.tr('user.chats') })
            .then((data) => {
                this.chatroom_id = data.chatroom_id;
            });
    }

    update_topic_list() {
        this.api.call_server_post('topics/get_topic_list', {usage: 'P'})
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.photographer_list = result.photographer_list;
            });
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options
        let topics = this.params.selected_topics.map(top => top.option);
        this.photo_topics = topics;
        this.api.call_server_post('photos/apply_topics_to_photo', {photo_id: this.true_photo_id, topics: this.photo_topics});
    }

    handle_photographer_change(event) {
        console.log(" topic change. event detail: ", event.detail, " selected photographers: ", this.params.selected_photographers);
        this.params.selected_photographers = event.detail.selected_options;
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
