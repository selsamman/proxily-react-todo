import {ListController} from "./ListController";
import {ToDoListItem} from "../store";
import React from "react";

export class ListItemController {

    constructor(listController : ListController, listItem : ToDoListItem) {
        this.listController = listController;
        this.listItem = listItem;
    }

    listController;
    listItem;

    get selected () { return !this.listItem.completed && this.listController.isSelected(this.listItem);}
    select () { this.listController.selectItem(this.listItem);}

    get title () { return this.listItem.title; }
    setTitle (title : string) { this.listItem.title = title;}

    get completed () { return this.listItem.completed }

    toggleCompleted () {
        this.listItem.completed = !this.listItem.completed;
        this.listController.todoCompletionChanged();
    }
}
export const ListItemContext = React.createContext<ListItemController>(undefined as unknown as ListItemController);
