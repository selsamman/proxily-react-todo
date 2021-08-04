import {Navbar, Button, Nav} from "react-bootstrap";
import {ListContext} from "../controllers/ListController";
import {useObservables} from "proxily";
import {useContext} from "react";
import {StyleContext} from "../controllers/StyleController";
import {Gear, Plus} from "react-bootstrap-icons";

export function Header () {
    useObservables();
    const styleController = useContext(StyleContext);
    const {navbarBg} = styleController;
    const {addItem, invokeStyle, deleteNotificationController} = useContext(ListContext);
    const {undoCompletedItems, completedItems, showNotification} = deleteNotificationController;


    return (
        <Navbar bg={navbarBg} variant={navbarBg as any} style={{height: 60}}>
            <Button variant={styleController.navbarButtonVariant} size="sm" onClick={addItem} className="mx-3"><Plus /></Button>
            <Button variant={styleController.navbarButtonVariant} size="sm" onClick={invokeStyle} className="mx-3"><Gear/></Button>
            {showNotification &&
                <>
                    <Navbar.Brand>{completedItems.length} item{completedItems.length > 1 ? 's' : ''} will be deleted </Navbar.Brand>
                    <Nav>
                        <Nav.Link eventKey="*" onSelect={undoCompletedItems} style={{color: "#7099E3FF", fontSize: 18}}>UNDO</Nav.Link>
                    </Nav>
                </>
            }
        </Navbar>
    );
}
