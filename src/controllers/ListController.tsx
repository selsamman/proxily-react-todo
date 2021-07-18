import React from "react";
import {ToDoList, ToDoListItem,} from "../store";
import {scheduleTask, cancelTask} from "proxily/lib/cjs/sagas";
import {memoize} from "proxily";
import {delay, takeLatest} from "@redux-saga/core/effects";

export class ListController {

    constructor(toDoList : ToDoList) {
        this.toDoList = toDoList;
    }
    toDoList : ToDoList;

    // ---- Filters

    static Filter : {[index: string] : string} = {
        All : "All",
        Today: "Today",
        Tomorrow: "Tomorrow",
        ThisWeek: "This Week",
    }
    filter = ListController.Filter.All;

    setFilter (eventKey: any, _event: Object) {
        this.filter = eventKey;
    }
    get filters () {return Object.keys(ListController.Filter)}

    // ---- Add remove and Select

    selectedItem : any;

    addItem () {
        this.toDoList.addItem();
        this.selectItem(this.toDoList.toDoListItems[this.toDoList.toDoListItems.length - 1]);
    }
    removeItem (item : ToDoListItem) {
        this.toDoList.deleteItem(item)
    }
    selectItem(item : ToDoListItem) {
        if (this.selectedItem && this.selectedItem !== item && !this.selectedItem.title)
            this.removeItem(this.selectedItem);
        if (item !== this.selectedItem)
            this.selectedItem = item;
    }
    isSelected (item : ToDoListItem) {
        return this.selectedItem === item;
    }

    // --- Style settings

    showStyle = false;
    invokeStyle () {this.showStyle = true};
    hideStyle () {this.showStyle = false}

    // --- Delete completed items after a period of time (show toast to undo completed)

    showToast = false;

    @memoize()
    get completedItems () { console.log("getCompletedItems");return this.toDoList.toDoListItems.filter(t => t.completed) }

    todoCompletionChanged() {
        if (this.completedItems.length > 0) {
            this.showToast = true;
            scheduleTask(this.deleteCompletedItems, {interval: 5000}, takeLatest);
        } else {
            this.showToast = false;
            cancelTask(this.deleteCompletedItems,  takeLatest);
        }
    }

    undoCompletedItems() {
        this.completedItems.forEach(item => item.completed = false);
        this.showToast = false;
        cancelTask(this.deleteCompletedItems,  takeLatest);
    }

    *deleteCompletedItems({interval} : {interval : number}) {
        yield delay(interval);
        this.showToast = false;
        this.completedItems.forEach(item => this.removeItem(item));
    }
}
export const ListContext = React.createContext(undefined as unknown as ListController);

