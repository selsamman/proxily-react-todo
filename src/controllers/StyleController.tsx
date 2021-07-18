import {TodoListStyle} from "../store/TodoListStyle";
import React from "react";
import {ListItemController} from "./ListItemController";

export class StyleController {
    todoListStyle : TodoListStyle;
    constructor(toDoListStyle : TodoListStyle) {
        this.todoListStyle = toDoListStyle;
    }
    get backgroundStyle () {
        return {backgroundColor: this.todoListStyle.backgroundColor, paddingLeft: 0, paddingRight: 0, height: "100%"}
    }
    get navbarBg () {
        return this.todoListStyle.navbarBg
    }
    get navbarButtonVariant () {
        return this.todoListStyle.navbarBg === 'dark' ? 'secondary' : 'outline';
    }
    get listItemContainerStyle () {
        return {backgroundColor: this.todoListStyle.listItemBackgroundColor}
    }
    get listItemStyle () {
        return {color: this.todoListStyle.listFontColor, height: this.todoListStyle.fontSize + 4,
                fontSize: this.todoListStyle.fontSize, lineHeight: 1}
    }
    get checkboxStyle () {
        return {height: this.todoListStyle.fontSize, width: this.todoListStyle.fontSize}
    }
    get inputStyle () {
        return {}
    }
}
export const StyleContext = React.createContext<StyleController>(undefined as unknown as StyleController);
