import {makeObservable, useObservable, useObservables, ObservableProvider} from "proxily";
import {Button, Card, ListGroup, Toast} from "react-bootstrap";
import {ListItem} from "./ListItem";
import {useContext, useEffect, useState} from "react";
import {ListContext} from "../controllers/ListController";
import {ListItemController, ListItemContext} from "../controllers/ListItemController";
import {StyleContext} from "../controllers/StyleController";

export function List () {
    useObservables()
    const listController = useContext(ListContext);
    const styleController = useContext(StyleContext);
    const {listItemContainerStyle} = styleController;
    const {undoCompletedItems, completedItems, toDoList} = listController;
    const {toDoListItems} = toDoList;
    const [hasToast, setHasToast] = useObservable(listController.showToast);
    setTimeout(()=>console.log('List next tick'), 0);
    useEffect (() => {console.log('List use effect')}, []);

    return (
        <>
            <Card>
                <ListGroup variant="flush">
                    {toDoListItems.map( (item, ix) =>
                        <ObservableProvider key={ix} context={ListItemContext} dependencies={[item]}
                                            value={new ListItemController(listController, item)}>
                            <ListGroup.Item key={ix}  style={listItemContainerStyle}>
                                <ListItem key={ix}/>
                            </ListGroup.Item>
                        </ObservableProvider>
                    )}
                </ListGroup>
            </Card>

            <Toast onClose={()=>setHasToast(false)} show={hasToast} animation={false}>
                <Toast.Header className="text-center">
                    <span>{completedItems.length} Items Completed will be Deleted</span>
                </Toast.Header>
                <Toast.Body>
                    <Button variant="secondary" size="sm"
                            onClick={undoCompletedItems}>Undo Completed Tasks</Button>
                </Toast.Body>
            </Toast>
        </>
    );
}
