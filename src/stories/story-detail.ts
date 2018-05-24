import { autoinject, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { highlight } from '../services/dom_utils';
import { Router } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';

@autoinject()
export class StoryDetail {
    api;
    i18n;
    story;
    members = [];
    candidates = [];
    has_associated_photos = false;
    photos;
    curr_photo;
    photo_idx = 0;
    source;
    user;
    theme;
    story_dir;
    keywords;
    highlight_on="highlight-on";
    router: Router;
    eventAggregator;
    dialog;
    subscriber;
    story_type;
    advanced_search;

    constructor(api: MemberGateway, i18n: I18N, user: User, router: Router, theme: Theme, eventAggregator: EventAggregator, dialog: DialogService) {
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;
        
    }

    attached() {
        this.subscriber = this.eventAggregator.subscribe('Zoom2', payload => { this.openDialog(payload.slide, payload.event, payload.slide_list) });
    }

    detached() {
        this.subscriber.dispose();
    }

    activate(params, config) {
        this.keywords = params.keywords;
        this.advanced_search = params.search_type == 'advanced';
        this.story_type = params.what || 'story';
        let what = this.story_type=='story' ? 'EVENT' : 'TERM';
        this.api.getStoryDetail({ story_id: params.id })
            .then(response => {
                this.api.hit(what, params.id);
                this.story = response.story;
                let html = this.story.story_text;
                if (this.story.story_id == 'new') {
                    this.story.name = this.i18n.tr('stories.new-story');
                    this.story.story_text = this.i18n.tr('stories.new-story-content');
                    this.story_dir = this.theme.rtltr;
                } else {
                    this.story_dir = this.theme.language_dir(this.story.language)
                }
                this.members = response.members;
                this.candidates = response.candidates;
                this.photos = response.photos;
                if (this.photos.length > 0) {
                    this.curr_photo = this.photos[0].photo_path;
                }
            });
        this.source = this.api.call_server_post('members/get_story_photo_list', { story_id: params.id, story_type: this.story_type });
        this.source.then(response => this.has_associated_photos = response.photo_list.length > 0);
    }

    next_photo() {
        this.photo_idx = (this.photo_idx + 1) % this.photos.length;
        this.curr_photo = this.photos[this.photo_idx].photo_path;
    }

    update_associated_members() {
        let member_ids = this.members.map(member => Number(member.id));
        this.router.navigateToRoute('associate-members', { caller_id: this.story.story_id, caller_type: this.story_type, associated_members: member_ids });
    }

    update_associated_photos() {
        let photo_ids = this.photos.map(photo => Number(photo.id));
        this.router.navigateToRoute('associate-photos', { caller_id: this.story.story_id, caller_type: this.story_type, associated_photos: photo_ids });
    }

    go_back() {
        history.back();
    }

    private openDialog(slide, event, slide_list) {
        event.stopPropagation();
        if (event.altKey && event.shiftKey) {
            this.detach_photo_from_story(this.story.story_id, slide.photo_id, slide_list);
            return;
        }
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
        });
    }
    
    detach_photo_from_story(story_id, photo_id, slide_list) {
        this.api.call_server_post('members/detach_photo_from_event', { story_id: story_id, photo_id: photo_id })
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
        this.api.call_server_post('members/add_story_member', {story_id: this.story.story_id, candidate_id: candidate_id});
    }

    @computedFrom('story.story_text')
    get highlightedHtml() {
        if (! this.story) {
            return "";
        }
        let highlighted_html = highlight(this.story.story_text, this.keywords, this.advanced_search);
        return highlighted_html; 
    }
    
}
