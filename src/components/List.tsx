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
    const {items} = listController;
    const {listItemContainerStyle, backgroundStyle} = useContext(StyleContext);;

    return (
        <Card style={{padding: 20, ...backgroundStyle}}>
            <ListGroup variant="flush">
                {items.map( (item, ix) =>
                    <ObservableProvider key={ix} context={ListItemContext} dependencies={[item]}
                                        value={()=>new ListItemController(listController, item)}>
                        <ListGroup.Item key={ix}  style={listItemContainerStyle}>
                            <ListItem key={ix}/>
                        </ListGroup.Item>
                    </ObservableProvider>
                )}
            </ListGroup>
        </Card>
  );
}
