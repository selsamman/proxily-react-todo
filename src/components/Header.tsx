import {Dropdown, DropdownButton, Navbar, Button } from "react-bootstrap";
import {ListController, ListContext} from "../controllers/ListController";
import {useObservables} from "proxily";
import {useContext} from "react";
import {StyleContext} from "../controllers/StyleController";
import {Gear, Plus} from "react-bootstrap-icons";

export function Header () {
    useObservables();
    const styleController = useContext(StyleContext);
    const {addItem, invokeStyle} = useContext(ListContext);
    return (
        <Navbar bg={styleController.navbarBg}>
            <Button variant={styleController.navbarButtonVariant} size="sm" onClick={addItem} className="mx-3"><Plus /></Button>
            <Button variant={styleController.navbarButtonVariant} size="sm" onClick={invokeStyle} className="mx-3"><Gear/></Button>
        </Navbar>
    );
}
