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

//localStorage.setItem('root', serialize(new ToDoListItem()));  // Uncomment to clear the store
//localStorage.setItem('style', serialize(new TodoListStyle()));  // Uncomment to clear the store
/*
// @ts-ignore
const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect()
devTools.subscribe((message : any, instance : any) => {

        console.log(JSON.stringify(message));

});

const t = new ToDoList();
const l = new ListController(t);
t.addItem("Foo");

(t as unknown as any).__hide__ = "xxx";

devTools.init(l);
devTools.send("Foo", l);
/*
devTools.send({id: 333, key: '111', type: 'Action1'}, t, {}, 'Instance1');
t.addItem("Foo");
devTools.send({id: 444, key: '111', type: 'Action2'}, t, {}, 'Instance2');

export class Leaf {
    constructor (val? : number | undefined) {
        if (val)
            this.num = val
    }
    num = 3;
    str = "foo"
    date = new Date();
    nul = null;
    parent : Root | undefined;
}
export class Root {
    arrayCollection = [3, null];
    arrayObjectCollection = [new Leaf(), new Leaf()];
    arrayArrayCollection = [[new Leaf(), new Leaf()]];
    arrayMapCollection = [new Map([['1', new Leaf()], ['2', new Leaf()]])];
    arraySetCollection = [new Set([new Leaf(), new Leaf()])];

    setCollection = new Set([new Leaf(), new Leaf()]);
    mapCollection = new Map([['1', new Leaf()], ['2', new Leaf()]]);
    objectCollection = {a: new Leaf(), b: new Leaf()};
    objectSingle = new Leaf();
}
const root = new Root();
root.objectSingle.parent = root;
devTools.send("Big", root);
*/
configureReduxDevTools();
const toDoList = persist(new ToDoList(), {key: 'root', classes: Object.values(require('./store'))});
const toDoListStyle = persist(new TodoListStyle(), {key: 'style', classes: Object.values(require('./store'))});
const styleController = makeObservable(new StyleController(toDoListStyle));
const listController = makeObservable(new ListController(toDoList));

initReduxDevTools();
function App() {
    useObservables();
    const {backgroundStyle} = styleController;
    const {showStyle} = listController
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
