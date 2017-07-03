import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
import { FullSizePhoto } from './full-size-photo';
import { DialogService } from 'aurelia-dialog';

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
    dialog;
    params = {
        selected_topics: [],
        unselected_topics: []
    };
    
    constructor(api: MemberGateway, user: User, dialog: DialogService) {
        this.api = api;
        this.user = user;
        this.dialog = dialog;
    }

    created(params, config) {
        this.api.call_server('members/get_topic_list', { })
            .then(result => {
                this.params.unselected_topics = result.topic_list;
            });
        this.update_photo_list();
    }

    update_photo_list() {
        return this.api.call_server('members/get_photo_list', { })
            .then(result => {
                this.photo_list = result.photo_list;
                console.log(this.photo_list.length + " photos");
            });

    }

    slider_changed() {
        let width = document.getElementById("photos-container").offsetWidth;
        this.photo_size = Math.floor((width - 60) / this.photos_per_line); 
        console.log("slider now at ", this.photos_per_line);
        console.log("photo_size: ", this.photo_size );
        this.photo_list = this.photo_list.splice(0);
    }

    private openDialog(slide) {
        this.dialog.open({ viewModel: FullSizePhoto, model: { slide: slide }, lock: false }).whenClosed(response => {
            console.log(response.output);
        });
    }

    photo_clicked(slide) {
        this.openDialog(slide);
    }
    

}