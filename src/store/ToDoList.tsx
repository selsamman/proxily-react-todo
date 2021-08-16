import {ToDoListItem} from "./ToDoListItem";

export class ToDoList {

    toDoListItems : Array<ToDoListItem> = [];
    nextId = 1;

    addItem (title? : string) {
        this.toDoListItems.push(new ToDoListItem(this.nextId++, title));
    }

    deleteItem(item : ToDoListItem) {
        const ix = this.toDoListItems.findIndex(i => i === item);
        if (ix >= 0)
            this.toDoListItems.splice(ix, 1);
    }

}
