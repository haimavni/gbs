import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';

@autoinject()
export class StoryDetail {
    api;
    i18n;
    story;
    members;
    photos;
    curr_photo;
    photo_idx = 0;
    source;
    user;

    constructor(api: MemberGateway, i18n: I18N, user: User) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
    }

    activate(params, config) {
        this.api.getStoryDetail({ story_id: params.id, used_for: params.used_for })
            .then(response => {
                this.story = response.story;
                if (this.story.story_id=='new') {
                    this.story.name = this.i18n.tr('stories.new-story');
                    this.story.story_text = this.i18n.tr('stories.new-story-content');
                }
                this.members = response.members;
                this.photos = response.photos;
                if (this.photos.length > 0) {
                    this.curr_photo = this.photos[0].photo_path;
                }
            });
        this.source = this.api.call_server_post('members/get_story_photo_list', {story_id: params.id});
    }

    next_photo() {
        this.photo_idx = (this.photo_idx + 1) % this.photos.length;
        this.curr_photo = this.photos[this.photo_idx].photo_path;
    }

}
