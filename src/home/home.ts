import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';

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
    stories_sample

    constructor(api: MemberGateway, router: Router) {
        console.log("at home. constructor.")
        this.api = api;
        this.photo_list = this.api.call_server_post('members/get_photo_list');
        this.api.call_server_post('members/get_stories_sample').then(result => this.stories_sample=result.stories_sample);
        this.router = router;
    }

    action(slide, event) {
        console.log(" action on slide: ", slide, " event: ", event);
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