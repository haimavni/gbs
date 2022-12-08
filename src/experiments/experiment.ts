import { autoinject, singleton } from 'aurelia-framework';
import { User } from '../services/user';

@autoinject
@singleton()
export class Experiment {
    val: any;
    user: User;
    options=[{name: 'No', value: false}, {name: 'Yes', value: true}];
    int_options=[{name: 'red', value: 1}, {name: 'green', value: 2}, {name: 'blue', value: 3}];
    bool_val = false;
    int_val = 0;

    constructor(user: User) {
        this.user = user;
    }

    handle_data_change(event) {
        let detail = event.detail;
        console.log("detail in experiment: ", detail);
    }

}
