import {useObservableProp, useObservables} from "proxily";
import {Col, Row} from "react-bootstrap";
import {useContext} from "react";
import {StyleContext} from "../controllers/StyleController";
import {ToDoListItem} from "../store";
import {ListContext} from "../controllers/ListController";

export function ListItem ({item} : {item : ToDoListItem}) {

    useObservables();

    const listController = useContext(ListContext);
    const isSelected = listController.isSelected(item);

    const styleController = useContext(StyleContext);
    const {listItemStyle, checkboxStyle, inputStyle} = styleController;
    const [title, setTitle] = useObservableProp(item.title);
    const [completed, setCompleted] = useObservableProp(item.completed);

    const toggleCompleted = () => {
        setCompleted(!completed);
        listController.deleteNotificationController.todoCompletionChanged();
    }
    const select = () => listController.selectItem(item);
    const unselect = () => listController.selectItem(undefined);

    return (
        <Row onClick={select}  style={listItemStyle}>
            <Col xs={1} >
                <input type="checkbox" checked={completed} onChange={toggleCompleted} style={checkboxStyle}/>
            </Col>
            <Col>
                {isSelected &&
                    <form onSubmit={unselect}>
                    <input type="text" autoFocus={true} style={inputStyle}
                           onChange={ (e) => setTitle(e.target.value) }
                           value={title} />
                    </form>
                }
                {!isSelected &&
                    <span style={{textDecoration: completed ? "line-through" : ""}}>
                        {title}
                    </span>
                }
            </Col>
        </Row>
    );
}


