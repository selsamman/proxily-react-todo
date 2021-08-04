import React from "react";
import {ToDoList, ToDoListItem,} from "../store";
import {scheduleTask, cancelTask} from "proxily/lib/cjs/sagas";
import {memoize} from "proxily";
import {delay, takeLatest} from "@redux-saga/core/effects";

export class ListController {

    constructor(toDoList : ToDoList) {
        this.toDoList = toDoList;
        this.deleteNotificationController = new DeleteNotificationController(this);
    }
    deleteNotificationController : DeleteNotificationController;
    toDoList : ToDoList;

    // ---- Query, add remove items

    selectedItem : any;
    get items () {
        return this.toDoList.toDoListItems;
    }

    addItem () {
        this.toDoList.addItem();
        this.selectItem(this.toDoList.toDoListItems[this.toDoList.toDoListItems.length - 1]);
    }

    removeItem (item : ToDoListItem) {
        this.toDoList.deleteItem(item)
    }

    // ---- Select Items

    selectItem(item : ToDoListItem | undefined) {
        if (this.selectedItem && this.selectedItem !== item && !this.selectedItem.title)
            this.removeItem(this.selectedItem);
        if (item !== this.selectedItem)
            this.selectedItem = item;
    }

    isSelected (item : ToDoListItem) {
        return this.selectedItem === item;
    }

    // --- Style Update Invocation

    showStyle = false;
    invokeStyle () {this.showStyle = true};
    hideStyle () {this.showStyle = false}
}

class DeleteNotificationController {

    constructor (listController : ListController) {
        this.listController = listController;
    }
    listController;

    showNotification = false;

    closeNotification () {this.showNotification = false};

    @memoize()
    get completedItems () { return this.listController.items.filter(t => t.completed) }

    todoCompletionChanged() {
        if (this.completedItems.length > 0) {
            this.showNotification = true;
            scheduleTask(this.deleteCompletedItems, {interval: 5000}, takeLatest);
        } else {
            this.showNotification = false;
        }
    }

    undoCompletedItems() {
        this.completedItems.forEach(item => item.completed = false);
        this.showNotification = false;
        cancelTask(this.deleteCompletedItems,  takeLatest);
    }

    *deleteCompletedItems({interval} : {interval : number}) {
        yield delay(interval);
        this.showNotification = false;
        this.completedItems.forEach(item => this.listController.removeItem(item));
    }

}

export const ListContext = React.createContext(undefined as unknown as ListController);

