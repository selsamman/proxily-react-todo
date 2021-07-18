import React from 'react';
import './App.css';
import {Container, Row, Col} from "react-bootstrap";
import {List} from "./components/List";
import {Header} from "./components/Header";
import {ListContext, ListController} from './controllers/ListController';
import {makeObservable, persist, useObservables} from "proxily";
import {ToDoList, TodoListStyle} from "./store";
import {StyleContext, StyleController} from "./controllers/StyleController";
import {StyleUpdate} from "./components/StyleUpdate";

//localStorage.setItem('root', serialize(new ToDoListItem()));  // Uncomment to clear the store
//localStorage.setItem('style', serialize(new TodoListStyle()));  // Uncomment to clear the store

const toDoList = persist(new ToDoList(), {key: 'root', classes: Object.values(require('./store'))});
const toDoListStyle = persist(new TodoListStyle(), {key: 'style', classes: Object.values(require('./store'))});
const styleController = makeObservable(new StyleController(toDoListStyle));
const listController = makeObservable(new ListController(toDoList));


function App() {
    useObservables();
    const {backgroundStyle} = styleController;
    return (
      <StyleContext.Provider value={styleController}>
          <ListContext.Provider value={listController}>
              <Container style={backgroundStyle} fluid>
                  <Header />
                  <Row style={{padding: 20}}>
                      <Col>
                          <List/>
                      </Col>
                  </Row>
              </Container>
              <StyleUpdate/>
          </ListContext.Provider>
      </StyleContext.Provider>
    );
}

export default App;
