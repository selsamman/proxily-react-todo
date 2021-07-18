import {proxy, useObservable, useObservables} from "proxily";
import {Button, Card, ListGroup, Toast} from "react-bootstrap";
import {ListItem} from "./ListItem";
import {useContext, useState} from "react";
import {ListContext} from "../controllers/ListController";
import {ListItemController, ListItemContext} from "../controllers/ListItemController";
import {StyleContext} from "../controllers/StyleController";

const ObservableContext = ({provider, value, children} : {provider : any, value : any , children: any}) => {
    const [providerValue] = useState(() => proxy(typeof value === "function" ? value() : value));
    return (
        <provider.Provider value={providerValue}>
            {children}
        </provider.Provider>
    )
}
export function List () {
    useObservables()
    const listController = useContext(ListContext);
    const styleController = useContext(StyleContext);
    const {listItemContainerStyle} = styleController;
    const {undoCompletedItems, completedItems, toDoList} = listController;
    const {toDoListItems} = toDoList;
    const [hasToast, setHasToast] = useObservable(listController.showToast);
    return (
        <>
            <Card>
                <ListGroup variant="flush">
                    {toDoListItems.map( (item, ix) =>
                        <ObservableContext key={ix} provider={ListItemContext}
                                           value={() => new ListItemController(listController, item)}>
                            <ListGroup.Item key={ix}  style={listItemContainerStyle}>
                                <ListItem key={ix}/>
                            </ListGroup.Item>
                        </ObservableContext>
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
