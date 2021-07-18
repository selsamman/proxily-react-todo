import {useObservables} from "proxily";
import {Col, Row} from "react-bootstrap";
import {useContext} from "react";
import {ListItemContext} from "../controllers/ListItemController";
import {StyleContext} from "../controllers/StyleController";

export function ListItem () {
    useObservables();
    const listItemController = useContext(ListItemContext);
    const styleController = useContext(StyleContext);
    const {completed, toggleCompleted, selected, select, title, setTitle} = listItemController;
    const {listItemStyle, checkboxStyle, inputStyle} = styleController;
    return (
        <Row onClick={select}  style={listItemStyle}>
            <Col xs={1} >
                <input type="checkbox" checked={completed} onChange={toggleCompleted} style={checkboxStyle}/>
            </Col>
            <Col>
                {selected &&
                    <input type="text" autoFocus={true} style={inputStyle}
                           onChange={ (e) => setTitle(e.target.value) }
                           value={title} />
                }
                {!selected &&
                    <span style={{textDecoration: completed ? "line-through" : ""}}>
                        {title}
                    </span>
                }
            </Col>
        </Row>
    );
}


