import React from 'react';
import './App.css';
import {Container} from "react-bootstrap";
import {List} from "./components/List";
import {Header} from "./components/Header";
import {ListContext, ListController} from './controllers/ListController';
import {configureReduxDevTools, initReduxDevTools, makeObservable, persist, useObservables, TransactionProvider} from "proxily";
import {ToDoList, TodoListStyle} from "./store";
import {StyleContext, StyleController} from "./controllers/StyleController";
import {StyleUpdate} from "./components/StyleUpdate";

configureReduxDevTools();
const toDoList = persist(new ToDoList(), {key: 'root', classes: Object.values(require('./store'))});
const toDoListStyle = persist(new TodoListStyle(), {key: 'style', classes: Object.values(require('./store'))});
const styleController = makeObservable(new StyleController(toDoListStyle));
const listController = makeObservable(new ListController(toDoList));
initReduxDevTools();

function App() {

    useObservables();
    const {backgroundStyle} = styleController;
    const {showStyle} = listController;

    return (
        <StyleContext.Provider value={styleController}>
            <ListContext.Provider value={listController}>
                <Container style={{padding: 0, height: '100%',  ...backgroundStyle}} fluid>
                    <Header />
                    <List />
                </Container>
                {showStyle &&
                    <TransactionProvider options={{timePositioning: true}}>
                        <StyleUpdate/>
                    </TransactionProvider>
                }
            </ListContext.Provider>
        </StyleContext.Provider>
    );
}

export default App;
