export class Answer {
    text = "";
    aid = 0;
    qid = 0;
    checked = false;
    input_mode = false;
    description = "";

    constructor(qid, text = "", description = "", aid = 0) {
        this.qid = qid;
        this.text = text;
        this.description = description;
        this.aid = aid;
    }
}

export class Question {
    prompt = "";
    description = "";
    qid = 0;
    input_mode = false;
    is_open = false;
    editable = false; 
    answers: Answer[] = [];
    nota = false;
    nota_default = false;

    constructor(prompt = "", description = "", nota_default=false, qid = 0, editable = true, answers = []) {
        console.log('question constructor prompt ', prompt, " qid: ", qid)
        this.prompt = prompt;
        this.description = description;
        this.qid = qid;
        this.editable = editable;
        this.answers = [];
        this.nota_default = nota_default;
        for (let answer of answers) {
            this.answers.push(new Answer(this.qid, answer.text, answer.description, answer.aid))
        }
        if (!prompt) {
            this.input_mode = true;
        }
    }

    get checked() {
        for (let ans of this.answers) {
            if (ans.checked) return 'checked'
        }
        return '';
    }
}

export enum QState {
    USING,
    APPLYING,
    EDITING
}
