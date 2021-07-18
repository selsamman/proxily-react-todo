import {ListController} from "./ListController";
import {TodoListStyle} from "../store";
import { Transaction } from "proxily";
import React from "react";
import {StyleController} from "./StyleController";

export class StyleUpdateController {
    listController : ListController;
    styleController : StyleController;
    toDoListStyle : TodoListStyle
    transaction : Transaction;
    constructor (styleController : StyleController, listController : ListController, transaction : Transaction) {
        this.listController = listController;
        this.styleController = styleController;
        this.toDoListStyle = styleController.todoListStyle;
        this.transaction = transaction;
    }
    saveChanges () {
        this.transaction.commit();
        this.listController.hideStyle();
    }
    cancel () {
        this.transaction.rollback();
        this.listController.hideStyle()
    }
}

export const StyleUpdateContext = React.createContext<StyleUpdateController>(undefined as unknown as StyleUpdateController);
