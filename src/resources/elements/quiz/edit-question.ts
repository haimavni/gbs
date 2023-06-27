import { IDialogController } from "@aurelia/dialog";
import { Question, Answer } from "./quiz-model";
import { ITheme } from "../../../services/theme";

export class EditQuestion {
    question: Question;
    old_prompt: string;
    old_description: string;

    constructor(
        @IDialogController private readonly controller: IDialogController,
        @ITheme private readonly theme: ITheme
    ) {}

    activate(question: Question) {
        this.question = question;
        this.old_prompt = this.question.prompt.slice(0);
        this.old_description = this.question.description.slice(0);
    }

    save() {
        this.controller.ok();
    }

    toggle_nota_default(what) {
        this.question.nota_default = what;
    }

    cancel() {
        //restore original values
        this.question.prompt = this.old_prompt;
        this.question.description = this.old_description;
        this.controller.cancel();
    }
}
