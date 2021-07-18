import {ToDoListItem} from "./ToDoListItem";

export class ToDoList {

    toDoListItems : Array<ToDoListItem> = [];

    addItem (title? : string) {
        const newTodo = new ToDoListItem();
        if (title)
            newTodo.title = title;
        this.toDoListItems.push(newTodo);
    }

    deleteItem(item : ToDoListItem) {
        const ix = this.toDoListItems.findIndex(i => i === item);
        if (ix >= 0)
            this.toDoListItems.splice(ix, 1);
    }
}
