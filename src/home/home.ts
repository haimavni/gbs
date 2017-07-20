import { MemberGateway } from '../services/gateway';
import { autoinject } from 'aurelia-framework';

@autoinject
export class Home {
    api;
    photo_list;
    video_list = [{ type: "youtube", src: "//www.youtube.com/embed/dfJIOa6eyfg?wmode=opaque" },
                  { type: "youtube", src: "https://www.youtube.com/embed/cscYO3epaIY?wmode=opaque" }];
    member_of_the_day = {gender: '', name: ''};
    member_prefix;
    was_born_in;
    died_in;

    constructor(api: MemberGateway) {
        console.log("at home. constructor.")
        this.api = api;
        this.photo_list = this.api.call_server_post('members/get_photo_list');
    }

    action(slide, event) {
        console.log(" action on slide: ", slide, " event: ", event);
    }

    attached() {
        this.api.call_server_post('members/get_random_member').then(result => {
            this.member_of_the_day=result.member_data;
            this.member_prefix = this.member_of_the_day.gender == 'F' ? 'home.female-member-of-the-day' : 'home.male-member-of-the-day';
            this.was_born_in = this.member_of_the_day.gender == 'F' ? 'home.female-was-born-in' : 'home.male-was-born-in';
            this.died_in = this.member_of_the_day.gender == 'F' ? 'home.female-died-in' : 'home.male-died-in';
        });
    }

}