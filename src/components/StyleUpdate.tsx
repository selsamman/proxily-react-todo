import {Button, Col, Container, Form, ListGroup, Modal, Row} from "react-bootstrap";
import React, {useContext, useState} from "react";
import {StyleContext, StyleController} from "../controllers/StyleController";
import {ListContext, ListController} from "../controllers/ListController";
import {Header} from "./Header";
import {List} from "./List";
import {Transaction, useObservable, useObservables, ObservableProvider, useTransactable} from "proxily";
import {ToDoList} from "../store";
import { HexColorPicker } from "react-colorful";
import {Undo, Redo} from '@material-ui/icons';

export function StyleUpdate () {

    useObservables();
    const [transaction] = useState( () => new Transaction({timePositioning: true}));

    const styleController = useTransactable(useContext(StyleContext));
    const {backgroundStyle} = styleController;

    const listController = useContext(ListContext);
    const {showStyle, hideStyle} = listController

    // Actions
    const cancel = () => {
        transaction.rollback();
        listController.hideStyle();
    }
    const save = () => {
        transaction.commit();
        listController.hideStyle();
    }
    const undo = () => transaction.undo();
    const redo = () => transaction.redo();

    // Sample Todo Items
    const sampleToDoList = new ToDoList();
    sampleToDoList.addItem("Item 1");
    sampleToDoList.addItem("Item 2");
    sampleToDoList.addItem("Item 3");

    return (
        <Modal show={showStyle} onHide={hideStyle} size="xl">

            <Modal.Header closeButton>
                <Modal.Title>List Styles</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <StyleContext.Provider value={styleController}>
                    <ObservableProvider context={ListContext}
                                        value={() => new ListController(sampleToDoList)}
                                        transaction={transaction}>
                        <Row>
                            <Col md={6} style={backgroundStyle}>
                                <List />
                            </Col>
                            <Col md={6}>
                                <StyleFields />
                            </Col>
                        </Row>
                    </ObservableProvider>
                </StyleContext.Provider>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" disabled={!transaction.canUndo} onClick={undo}><Undo /></Button>
                <Button variant="secondary" disabled={!transaction.canRedo} onClick={redo}><Redo /></Button>
                <Button variant="secondary" onClick={cancel}>Cancel</Button>
                <Button variant="primary" onClick={save}>Save changes</Button>
            </Modal.Footer>

        </Modal>
    );
}
export function StyleList () {

    const sampleToDoList = new ToDoList();
    sampleToDoList.addItem("Item 1");
    sampleToDoList.addItem("Item 2");
    sampleToDoList.addItem("Item 3");

    const {backgroundStyle} = useContext(StyleContext);
    const listController = new ListController(sampleToDoList);

    return (
        <Container  style={backgroundStyle} fluid>
            <ListContext.Provider value={listController}>
                <Header />
                <Row style={{padding: 20}}>
                    <Col>
                        <List/>
                    </Col>
                </Row>
            </ListContext.Provider>
        </Container>
    )
}
export function StyleFields () {
    useObservables();
    const toDoListStyle = useContext(StyleContext).todoListStyle;
    const [backgroundColor, setBackgroundColor] = useObservable(toDoListStyle.backgroundColor);
    const [listFontColor, setListFontColor] = useObservable(toDoListStyle.listFontColor);
    const [listItemBackgroundColor, setListItemBackgroundColor] = useObservable(toDoListStyle.listItemBackgroundColor);
    const [fontSize, setFontSize] = useObservable(toDoListStyle.fontSize);
    const [navbarBg, setNavbarBg] = useObservable(toDoListStyle.navbarBg);
    const [activeProp, setActiveProp] = useState('');
    // @ts-ignore

    return (
        <>
            <Form.Group className="mb-3" controlId="backgroundColor">
                <Form.Label onClick={() => setActiveProp('background')}>Background Color {'>'}</Form.Label>
                {activeProp === 'background' &&
                    <HexColorPicker color={backgroundColor} onChange={setBackgroundColor}/>}
            </Form.Group>

            <Form.Group className="mb-3" controlId="listFontColor">
                <Form.Label onClick={() => setActiveProp('listFontColor')}>Text Color {'>'}</Form.Label>
                {activeProp === 'listFontColor' && <HexColorPicker color={listFontColor} onChange={setListFontColor}/>}
            </Form.Group>

            <Form.Group className="mb-3" controlId="listItemBackgroundColor">
                <Form.Label onClick={() => setActiveProp('listItemBackgroundColor')}>Item Color {'>'}</Form.Label>
                {activeProp === 'listItemBackgroundColor' &&
                    <HexColorPicker color={listItemBackgroundColor} onChange={setListItemBackgroundColor}/>}
            </Form.Group>

            <Form.Group className="mb-3" controlId="fontSize">
                <Form.Label onClick={() => setActiveProp('fontSize')}>Font Size  {'>'}</Form.Label>
                {activeProp === 'fontSize' &&
                    <Selector prop={fontSize} setter={setFontSize} choices={[10, 14, 18, 24]} />}
            </Form.Group>

            <Form.Group className="mb-3" controlId="navbarBg">
                <Form.Label onClick={() => setActiveProp('navbarBg')}>Header Background{'>'}</Form.Label>
                {activeProp === 'navbarBg' &&
		            <Selector prop={navbarBg} setter={setNavbarBg} choices={['light', 'dark']} />}
            </Form.Group>
        </>
    );
}

// Choose from a selection and invoke a setter
function Selector ({prop, setter, choices} :
         {prop : string | number, setter : (choice: any) => void, choices : Array<number | string>}) : any {
    return (
        <ListGroup variant="flush">
            {choices.map( (item, ix) =>
                    <ListGroup.Item key={ix} onClick={()=>setter(item)}
                                    style={{backgroundColor: prop === item ? "#e0e0e0" : "transparent"}}>
                        {item}
                    </ListGroup.Item>
            )}
        </ListGroup>
    )
}
