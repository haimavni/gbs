import { autoinject, singleton } from 'aurelia-framework';
import { User } from '../services/user';

@autoinject
@singleton()
export class Experiment {
    val: any;
    user: User;
    options=[{name: 'No', value: false}, {name: 'Yes', value: true}];
    bool_val = false;

    constructor(user: User) {
        this.user = user;
    }

}
