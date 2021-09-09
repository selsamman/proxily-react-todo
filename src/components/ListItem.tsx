import {observer, useObservableProp} from "proxily";
import {Col, Row} from "react-bootstrap";
import {useContext} from "react";
import {StyleContext} from "../controllers/StyleController";
import {ToDoListItem} from "../store";
import {ListContext} from "../controllers/ListController";

function ListItem ({item} : {item : ToDoListItem}) {

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
export default observer(ListItem);


