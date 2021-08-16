import {useObservables} from "proxily";
import {Card, ListGroup} from "react-bootstrap";
import {ListItem} from "./ListItem";
import {useContext} from "react";
import {ListContext} from "../controllers/ListController";
import {StyleContext} from "../controllers/StyleController";

export function List () {

    useObservables()

    const listController = useContext(ListContext);
    const {items} = listController;
    const {listItemContainerStyle, backgroundStyle} = useContext(StyleContext);

    return (
        <Card style={{padding: 20, ...backgroundStyle}}>
            <ListGroup variant="flush">
                {items.map( (item, ix) =>
                    <ListGroup.Item key={item.id}  style={listItemContainerStyle}>
                        <ListItem key={item.id} item={item}/>
                    </ListGroup.Item>
                )}
            </ListGroup>
        </Card>
   );
}
