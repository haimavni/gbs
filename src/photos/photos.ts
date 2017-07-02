import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';

@autoinject
export class Photos {
    filter = "";
    photos_per_line = 8;
    photo_size = 128;
    url = "http://gbstories:8000/gbs/static/gb_photos/gbs/photos/orig/micha2/Ppm0244.jpg";
    photo_list = [];
    photos_margin=0;
    api;
    user;
    
    constructor(api: MemberGateway, user: User) {
        this.api = api;
        this.user = user;
        /*
        for (let i = 0; i < 250; i++) {
            let photo = { src: this.url };
            this.photo_list.push(photo);
        }*/
    }

    created(params, config) {
        return this.api.call_server('members/get_photo_list', { })
            .then(result => {
                this.photo_list = result.photo_list;
                console.log(this.photo_list.length + " photos");
            });

        //this.slider_changed();
    }

    slider_changed() {
        let width = document.getElementById("photos-container").offsetWidth;
        this.photo_size = Math.floor((width - 60) / this.photos_per_line); 
        console.log("slider now at ", this.photos_per_line);
        console.log("photo_size: ", this.photo_size );
        this.photo_list = this.photo_list.splice(0);
    }

}