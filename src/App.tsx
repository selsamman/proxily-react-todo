import React from 'react';
import './App.css';
import {Container} from "react-bootstrap";
import List from "./components/List";
import Header from "./components/Header";
import {ListContext, ListController} from './controllers/ListController';
import {configureReduxDevTools, initReduxDevTools, observable, persist, setLogLevel, observer} from "proxily";
import {ToDoList, TodoListStyle} from "./store";
import {StyleContext, StyleController} from "./controllers/StyleController";
import StyleUpdate from "./components/StyleUpdate";

configureReduxDevTools();
const classes = Object.values(require('./store'));
const toDoList = persist(new ToDoList(), {key: 'root', classes});
const toDoListStyle = persist(new TodoListStyle(), {key: 'style', classes});
//const toDoList = makeObservable(new ToDoList());
//const toDoListStyle = makeObservable(new TodoListStyle());
const styleController = observable(new StyleController(toDoListStyle));
const listController = observable(new ListController(toDoList));
initReduxDevTools();

setLogLevel({render: true, propertyTracking: true, propertyChange: true})
function App() {

    const {backgroundStyle} = styleController;
    const {showStyle} = listController;

    return (
        <StyleContext.Provider value={styleController}>
            <ListContext.Provider value={listController}>
                <Container style={{padding: 0, height: '100%', ...backgroundStyle}} fluid>
                    <Header/>
                    <List/>
                </Container>
                {showStyle &&
				    <StyleUpdate/>
                }
            </ListContext.Provider>
        </StyleContext.Provider>
    );
}

export default observer(App);
