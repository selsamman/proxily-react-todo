import {serializable} from "proxily";

export class ToDoListItem {

    id = 0;
    title = "";
    completed = false;

    constructor(id : number, title? : string) {
        this.id = id;
        this.title = title || "";
    }

}
serializable({ToDoListItem});
