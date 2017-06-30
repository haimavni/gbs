export class Photos {
    filter = "";
    photos_per_line = 8;
    photo_size = 128;
    url = "http://gbstories:8000/gbs/static/gb_photos/gbs/photos/orig/micha2/Ppm0244.jpg";
    photo_list = [];
    photos_margin=0;
    

    constructor() {
        for (let i = 0; i < 250; i++) {
            let photo = { src: this.url };
            this.photo_list.push(photo);
        }
    }

    slider_changed() {
        let width = document.getElementById("photos-container").offsetWidth;
        this.photo_size = Math.floor((width - 60) / this.photos_per_line); 
        console.log("slider now at ", this.photos_per_line);
        console.log("photo_size: ", this.photo_size );
        this.photo_list = this.photo_list.splice(0);
    }

}