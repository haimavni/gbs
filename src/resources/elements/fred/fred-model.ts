enum Type {
    DATE,
    NUMBER,
    QUESTIONAIRE,
    OPTION_LIST
}

export class Question {
    label: string;
    type: Type;
}

export class Answer {
    number: Number;
    date: Date;
    option: Option;
}

export class Option {
    option_id: Number;
    name: string;
}
