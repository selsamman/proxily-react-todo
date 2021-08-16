export class ToDoListItem {

    id = 0;
    title = "";
    completed = false;

    constructor(id : number, title? : string) {
        this.id = id;
        this.title = title || "";
    }

}
