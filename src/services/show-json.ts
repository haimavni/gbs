import * as JsonHuman from 'json.human';

export class HumanJson {

    display(obj) {
        console.log("human json. obj: ", obj);
        let node = JsonHuman.format(obj);
        return node;
    }
}
