import * as JsonHuman from 'json.human';

export class HumanJson {

    display(obj) {
        let node = JsonHuman.format(obj);
        return node;
    }
}
