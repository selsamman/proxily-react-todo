import {Button, Col, Container, Dropdown, Form, ListGroup, Modal, Row} from "react-bootstrap";
import React, {useContext, useState} from "react";
import {StyleUpdateContext, StyleUpdateController} from "../controllers/StyleUpdateController";
import {StyleContext, StyleController} from "../controllers/StyleController";
import {ListContext, ListController} from "../controllers/ListController";
import {Header} from "./Header";
import {List} from "./List";
import {makeObservable, Transaction, useObservable, useObservables, useTransactable} from "proxily";
import {ToDoList} from "../store";
import { HexColorPicker } from "react-colorful";
import {ListItemContext, ListItemController} from "../controllers/ListItemController";
import {ListItem} from "./ListItem";

export function StyleUpdate () {
    useObservables();

    const parentToDoListStyle = useContext(StyleContext).todoListStyle;
    const parentListController = useContext(ListContext);
    const {showStyle, hideStyle} = parentListController

    // Style controller for use within update
    const [transaction] = useState( () => new Transaction());
    const [transactionStyleController] = useState( () =>
        makeObservable(new StyleController(parentToDoListStyle), transaction));
    const [styleUpdateController] = useState( () =>
        new StyleUpdateController(transactionStyleController, parentListController, transaction));

    return (
        <Modal show={showStyle} onHide={hideStyle} size="xl">

            <Modal.Header closeButton>
                <Modal.Title>List Styles</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Row>
                    <Col md={6}>
                        <StyleList styleController={transactionStyleController}/>
                    </Col>
                    <Col md={6}>
                        <StyleFields styleUpdateController={styleUpdateController} />
                    </Col>
                </Row>
                <Row>

                </Row>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={()=>styleUpdateController.cancel()}>Cancel</Button>
                <Button variant="primary" onClick={()=>styleUpdateController.saveChanges()}>Save changes</Button>
            </Modal.Footer>

        </Modal>
    );
}
export function StyleList ({styleController} : {styleController : StyleController}) {

    const sampleToDoList = new ToDoList();
    sampleToDoList.addItem("Item 1");
    sampleToDoList.addItem("Item 2");
    sampleToDoList.addItem("Item 3");

    const {backgroundStyle} = styleController;
    const listController = new ListController(sampleToDoList);

    return (
        <StyleContext.Provider value={styleController}>
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
        </StyleContext.Provider>
    )
}
export function StyleFields ({styleUpdateController} : {styleUpdateController : StyleUpdateController}) {
    useObservables();
    const {toDoListStyle} = styleUpdateController;
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

function Selector ({prop, setter, choices} :
                       {prop : string | number, setter : (choice: string) => void, choices : Array<number | string>}) : any;
function Selector ({prop, setter, choices} :
                       {prop : string | number, setter : (choice: number) => void, choices : Array<number | string>}) : any;
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
