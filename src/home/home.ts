import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { User } from '../services/user';
import { I18N } from 'aurelia-i18n';

@autoinject
export class Home {
    api;
    photo_list;
    video_list = [{ type: "youtube", src: "//www.youtube.com/embed/dfJIOa6eyfg?wmode=opaque" },
    { type: "youtube", src: "https://www.youtube.com/embed/cscYO3epaIY?wmode=opaque" }];
    member_of_the_day = { gender: '', name: '' };
    member_prefix;
    was_born_in;
    died_in;
    router;
    user;
    stories_sample;
    message_list;
    i18n;
    constants;

    constructor(api: MemberGateway, router: Router, user: User, i18n: I18N) {
        console.log("at home. constructor.")
        this.api = api;
        this.user = user;
        this.router = router;
        this.i18n = i18n;
        this.photo_list = this.api.call_server_post('members/get_photo_list');
        this.api.call_server_post('members/get_stories_sample').then(result => this.stories_sample = result.stories_sample);
        this.api.call_server_post('members/get_message_list').then(
            result => {
                this.message_list = result.message_list;
            });
    }

    action(slide, event) {
        console.log(" action on slide: ", slide, " event: ", event);
    }

    add_message() {
        let name = this.i18n.tr('home.new-message');
        this.message_list.splice(0, 0, { story_id: null, name: name, used_for: this.api.constants.STORY4MESSAGE, story_text: "" });
    }

    attached() {
        this.api.call_server_post('members/get_random_member').then(result => {
            this.member_of_the_day = result.member_data;
            this.member_prefix = this.member_of_the_day.gender == 'F' ? 'home.female-member-of-the-day' : 'home.male-member-of-the-day';
            this.was_born_in = this.member_of_the_day.gender == 'F' ? 'home.female-was-born-in' : 'home.male-was-born-in';
            this.died_in = this.member_of_the_day.gender == 'F' ? 'home.female-died-in' : 'home.male-died-in';
        });
    }

    jump_to_member_of_the_day_page(member_id) {
        this.router.navigateToRoute('member-details', { id: member_id });
    }

}