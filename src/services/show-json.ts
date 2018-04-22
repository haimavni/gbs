import * as JsonHuman from 'json.human';

export class HumanJson {

    test() {
        let x = { name: "haim", last_name: "avni" };

        let node = JsonHuman.format(x);
        console.log("json human node: ", node);
        console.log("inner html: ", node.innerHTML);
        return node;
    }
}
