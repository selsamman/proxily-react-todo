# Proxily Sample Application (ToDo List)

## Usage
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

After checking out the project, run these commands in the project directory:

### `yarn install`
### `yarn start`

> Note: Until Proxily is published on NPM you need to have it in an adjacent folder.  You run yarn install, yarn build and then remove node_modules.  This must be done before the above steps.

# The Application
This is a rather simple todo application. You can add items, edit them and check them off when done.  However, it has two additional features that demonstrate unique features of Proxily:

* When you check off items they are removed after a 5-second delay.  During that time an **undo** link is display to undo the completion.  If you check multiple items the 5-second window extends such that items are deleted 5 seconds after the last one is completed.  This is implemented quite simply with Sagas.

* There is a gear icon that lets you change colors and font sizes.  A preview is shown of the new style and when you are satisfied you can save or cancel changes.  These feature is implemented using transactions which fork the state and merge it back upon completion.

* The style dialog also implements undo/redo which are part of Proxily transactions.

# Usage Patterns Demonstrated

* Creating persist a store from state
* Using controllers to manage non-persistent state across multiple components
* Having components react to all state changes (persistent and non-persistent)  
* Sagas
* Transactions

## Setting up Persistent State

While Proxily does not have a formal structure for store, best practices are to have a folder with all of your classes.  Then re-export them from a single index.tsx file.  Your persistent state classes really only need to have the essential functionality for managing the data itself and not the logic for how the data is to be used.  We place data access logic in controllers.

We have two simple classes ToDoList and ToDoListItem which represent the list

### ToDoList

```typescript
export class ToDoList {

    toDoListItems : Array<ToDoListItem> = [];

    addItem (title? : string) {
        const newTodo = new ToDoListItem();
        if (title)
            newTodo.title = title;
        this.toDoListItems.push(newTodo);
    }

    deleteItem(item : ToDoListItem) {
        const ix = this.toDoListItems.findIndex(i => i === item);
        if (ix >= 0)
            this.toDoListItems.splice(ix, 1);
    }
}
```

### TodoListItem

```javascript
export class ToDoListItem {
    title = "";
    completed = false;
}
```

### TodoListStyle

In order to demonstrate transactions which are used when changing the style of the list we also have a style class that represents the various style properties that can be changed
```javascript
export class TodoListStyle {
    navbarBg = "dark";
    fontSize = 16
    listItemBackgroundColor = "#f0f0f0";
    backgroundColor = "#ffffff";
    listFontColor = "#707070";
}
```

### store/index.tsx

Finally, the index.tsx file in the store folder pulls all of these together
```javascript
export {ToDoList} from "./ToDoList";
export {ToDoListItem} from "./ToDoListItem";
export {TodoListStyle} from "./TodoListStyle";
```

### Persisting State (App.tsx)

In order to consume our persistent state in our application we instantiate the classes and persist them to local storage.
```javascript
const toDoList = persist(new ToDoList(), {key: 'root', classes: Object.values(require('./store'))});
const toDoListStyle = persist(new TodoListStyle(), {key: 'style', classes: Object.values(require('./store'))});
```
We chose to keep them in separate keys under local storage, each identified by a **key**. In order for persist to serialize and deserialize them it needs a list of the classes.   Since we exported them all in index.tsx, we need only get the values from that file by requiring it and taking the properties as an Array.

Now they are ready to be passed into our components.  They could be passed as parameters or placed in a context or passed via controllers.

### Controller Pattern

This demo uses a controller pattern.  The controllers perform three functions in this pattern:
* They act as a view model in presenting the persistent state in the way the component needs to consume it
* They handle the logic for user events that the component captures
* They may have state which is germaine to the user interactions such as maintaining the currently selected toDo list.
This allows the components themselves to act purely as a view and as such are very easy to test. The controllers may be consumed by multiple components.   This allows non-persistent state to be shared between components in a way that useState cannot accommodate.
  
Given their role in presenting state to view components, we will pass the persistent state to our components by way of the controllers which we create in ***App.tsx***
```javascript
const styleController = makeObservable(new StyleController(toDoListStyle));
const listController = makeObservable(new ListController(toDoList));
```
After creating them, we must make them observable using **makeObservable** such that any components that reference them will react to changes. We then pass them to our components using React context providers:
```javascript
function App() {
    useObservables();
    const {backgroundStyle} = styleController;
    return (
      <StyleContext.Provider value={styleController}>
          <ListContext.Provider value={listController}>
              <Container style={backgroundStyle} fluid>
                  <Header />
                  <List />
              </Container>
              <StyleUpdate/>
          </ListContext.Provider>
      </StyleContext.Provider>
    );
}
```
The main jsx is doing the following:
* Setting up the context with the controllers that will be needed
* Presenting a container whose backgroundStyle will be changed based on the styleController
* Presenting the main components of the application
    * ***Header*** which shows add and settings buttons
    * ***List*** which displays the list itself
    * ***StyleUpdate*** which is a modal dialog which will appear when the setting button is pressed
    
Note the **useObservables** which is the counter-part to **makeObservable**.  Using these together will track usage of the state and re-render the component when state changes.

### List.tsx

Our list component will display the list of the items:
```javascript
export function List () {

    useObservables()
    const listController = useContext(ListContext);
    const {items} = listController;
    const {listItemContainerStyle} = useContext(StyleContext);;

    return (
        <Card style={{padding: 20}}>
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
```
First we retrieve the ***ListController*** from context and extract ***items*** which is the list items themselves.  We also retrieve the ***StyleController*** from context and extract the style for the list container.  We iterate over the items to be presented by the ***ListItem*** component.

Just as the list itself has a controller, each list item also needs a controller. This ***ListItemController*** is created in JSX using **ObservableProvider** which will create a context with the controller as an observable. The controller is created in the **value** callback which is called anytime **dependencies** change.  This is important since we can't rely on indexes because the association of the index and actual items will change when deleting items from the list.

### ListController.tsx

The list controller is responsible for all activities surrounding the list.  It is consumed by a number of components.
```javascript
export class ListController {

    constructor(toDoList : ToDoList) {
        this.toDoList = toDoList;
        this.deleteNotificationController = new DeleteNotificationController(this);
    }
    deleteNotificationController : DeleteNotificationController;
    toDoList : ToDoList;

    // ---- Query, add remove items

    selectedItem : any;
    get items () {
        return this.toDoList.toDoListItems;
    }

    addItem () {
        this.toDoList.addItem();
        this.selectItem(this.toDoList.toDoListItems[this.toDoList.toDoListItems.length - 1]);
    }

    removeItem (item : ToDoListItem) {
        this.toDoList.deleteItem(item)
    }

    // ---- Select Items

    selectItem(item : ToDoListItem | undefined) {
        if (this.selectedItem && this.selectedItem !== item && !this.selectedItem.title)
            this.removeItem(this.selectedItem);
        if (item !== this.selectedItem)
            this.selectedItem = item;
    }

    isSelected (item : ToDoListItem) {
        return this.selectedItem === item;
    }

    // --- Style Update Invocation

    showStyle = false;
    invokeStyle () {this.showStyle = true};
    hideStyle () {this.showStyle = false}
}
```
It contains several important elements
* A reference to the list itself
* A reference to a ***DeleteNotificationController** which manages the deletion notification
* The currently selected item

It contains a number of methods for maintaining the list and tracking the selection of an item.  It also contains the state and methods associated with deciding whether to display the deletion notification.

### ListItem.tsx

The ***ListItem*** component displays an individual list item.  It gets all information on the item from the ***ListItemController*** which it retrieves from context.  It also gets style information from the ***StyleController*** which it also retrieves from context.

The component then displays a checkbox and either an input or a text element depending on whether this item is selected or not.  It alerts the ***ListItemController*** of user actions such as selecting this item, editing the text or checking off the item as completed.  While many of these actions involve the ***ListController***, this is not a concern of the ***ListItem*** component which deals exclusively with the ***ListItemController***.  Controllers are an effective way to separate concerns and keep components simple and testable.
```javascript
export function ListItem () {

    useObservables();
    const listItemController = useContext(ListItemContext);
    const styleController = useContext(StyleContext);
    const {completed, toggleCompleted, selected, select, unselect, title, setTitle} = listItemController;
    const {listItemStyle, checkboxStyle, inputStyle} = styleController;

    return (
        <Row onClick={select}  style={listItemStyle}>
            <Col xs={1} >
                <input type="checkbox" checked={completed} onChange={toggleCompleted} style={checkboxStyle}/>
            </Col>
            <Col>
                {selected &&
                    <form onSubmit={unselect}>
                    <input type="text" autoFocus={true} style={inputStyle}
                           onChange={ (e) => setTitle(e.target.value) }
                           value={title} />
                    </form>
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
```  

### ListItemController

The ***ListItem*** component has a very simple controller that:
* Retrieves the item properties
* Allows the item to be selected or completed
* Determines whether the current item is the one that is selected. 
  
It does this by interacting with the ***ListController***
```javascript
export class ListItemController {

    constructor(listController : ListController, listItem : ToDoListItem) {
        this.listController = listController;
        this.listItem = listItem;
    }

    listController;
    listItem;

    get selected () { return !this.listItem.completed && 
                              this.listController.isSelected(this.listItem);}
    select () { this.listController.selectItem(this.listItem);}
    unselect() {this.listController.selectItem(undefined);}

    get title () { return this.listItem.title; }
    setTitle (title : string) { this.listItem.title = title;}

    get completed () { return this.listItem.completed }

    toggleCompleted () {
        this.listItem.completed = !this.listItem.completed;
        this.listController.deleteNotificationController.todoCompletionChanged();
    }
}
```

### Header

The ***Header*** component is the final component for displaying the list.  It uses the standard **Navbar** from react-bootstrap to display two possible actions:

* Add an item to the list
* Bring up the style update modal dialog. 
  
It consumes the ***StyleController*** and the ***ListController***.
```javascript
export function Header () {
    useObservables();
    const styleController = useContext(StyleContext);
    const {navbarBg} = styleController;
    const {addItem, invokeStyle, deleteNotificationController} = useContext(ListContext);
    const {undoCompletedItems, completedItems, showNotification, closeNotification} = deleteNotificationController;


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
```
The ***Header*** also conditionally displays a message about items that have just been deleted and are due to be deleted.  It offers undo/redo as well.  The logic is implemented in the ***DeleteNotificationController*** which is a member of the ***ListController***

### Deletion Notifications

The ***ListController*** is composed of a second controller that manages the deletion notifications.  It offers the option to undo the completion status of recently completed todos.

```javascript
class DeleteNotificationController {

    constructor (listController : ListController) {
        this.listController = listController;
    }
    listController;

    showNotification = false;
    
    @memoize()
    get completedItems () { return this.listController.items.filter(t => t.completed) }

    todoCompletionChanged() {
        if (this.completedItems.length > 0) {
            this.showNotification = true;
            scheduleTask(this.deleteCompletedItems, {interval: 5000}, takeLatest);
        } else {
            this.showNotification = false;
        }
    }

    undoCompletedItems() {
        this.completedItems.forEach(item => item.completed = false);
        this.showNotification = false;
        cancelTask(this.deleteCompletedItems,  takeLatest);
    }

    *deleteCompletedItems({interval} : {interval : number}) {
        yield delay(interval);
        this.showNotification = false;
        this.completedItems.forEach(item => this.listController.removeItem(item));
    }

}
```
This class has a reference back to the ***ListController*** so that it can have access to the list items.  When the ***ListItemController*** changes the completion status of an item, it calls ***todoCompletionChanged*** which schedules ****deletedCompletedItems*** to delete any completed items after waiting an interval of 5 seconds. 

****deleteCompletedItems*** is a Saga managed by redux-saga.  The ***scheduleTask*** will run a dispatcher Saga, built-in to Proxily, that will yield to ****deletedCompletedItems*** saga.  Redux-saga has a number of take helpers that control the concurrency of this saga.  By using ***takeLatest***, the saga will be cancelled and restarted if another one is scheduled.  This extends the amount of time before the saga will reach the code to remove the completed items since the saga will restart from the beginning.  

Should the user press UNDO ***undoCompleted*** items will be invoked from the ***Header*** component.  In that case the completion status will be undone, and the saga cancelled with ***cancelTask***.  Note that the same taker must be past as the second parameter.  

Proxily makes it easy to use Sagas and without having to use Redux itself. While all of this logic could have been accomplished by SetTimer and tracking various states it gets more complicated because a Promise cannot be cancelled whereas any yield step in a saga can.

### Style Update Modal Dialog

The ***StyleUpdate*** component manages the modal dialog which allows styles to be changed.  It shows a preview of the list and defers committing the style changes until the user presses the save button.  It also offers undo/redo as well as the ability to reset the style back to the state at the start of the dialog.
```javascript
export function StyleUpdate () {

    useObservables();
    const [transaction] = useState( () => new Transaction({timePositioning: true}));
```
The first step is to create a Proxily **Transaction**.  We only want to do this once, so we use the callback form of the useState.  We specify **timePositioning: true** so that undo/redo events will be recorded.
```javascript
    const styleController = useTransactable(useContext(StyleContext), transaction);
    const {backgroundStyle} = styleController;
```
We set up a ***StyleController*** for the modal dialog.   **useTransactable** returns an object that has a new copy of the controller.  Changes to this object (or any objects referenced from it) will not impact the original state. Thus changes made in this modal dialog will not yet impact the main list in the application.  
```javascript
    const listController = useContext(ListContext);
    const {showStyle, hideStyle} = listController
```
We need the original ***ListController*** in order to dismiss the modal dialog when the style update is complete.
```javascript
  // Actions
    const cancel = () => {
        transaction.rollback();
        listController.hideStyle();
    }
    const save = () => {
        transaction.commit();
        listController.hideStyle();
    }
    const undo = () => transaction.undo();
    const redo = () => transaction.redo();
```
Event handlers for the main actions in the dialog are set up at this point.  The cancel will simply rollback the changes on the transaction which will update any transactable versions of data back to the original.  The save will commit changes in the transactable versions of the data back to this which copies the original. In both cases the modal dialog is dismissed.  Undo and redo buttons ask the transaction to undo or redo the latest state changes.

The dialog has a "sample" todoList.  We will re-use the ***List*** component but need a sample todoList that we know will fit in the dialog and have a suitable number of entries, so we set that up as well.
```javascript
    // Sample Todo Items
    const sampleToDoList = new ToDoList();
    sampleToDoList.addItem("Item 1");
    sampleToDoList.addItem("Item 2");
    sampleToDoList.addItem("Item 3");
```
Now we are ready to return the JSX:
```javascript
    return (
        <Modal show={showStyle} onHide={hideStyle} size="xl">

            <Modal.Header closeButton>
                <Modal.Title>List Styles</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <StyleContext.Provider value={styleController}>
                    <ObservableProvider context={ListContext}
                                        value={() => new ListController(sampleToDoList)}
                                        transaction={transaction}>
                        <Row>
                            <Col md={6} style={backgroundStyle}>
                                <List />
                            </Col>
                            <Col md={6}>
                                <StyleFields />
                            </Col>
                        </Row>
                    </ObservableProvider>
                </StyleContext.Provider>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" disabled={!transaction.canUndo} onClick={undo}><Undo /></Button>
                <Button variant="secondary" disabled={!transaction.canRedo} onClick={redo}><Redo /></Button>
                <Button variant="secondary" onClick={cancel}>Cancel</Button>
                <Button variant="primary" onClick={save}>Save changes</Button>
            </Modal.Footer>

        </Modal>
    );
}
```
We set up the ***ListController*** and ***StyleController*** as contexts.  Since the ***StyleController*** has already been created, we use the normal context provider component.  We need to create the ***ListController*** based on ***sampleToDoList***, so we use **ObservableProvider** for that task.  The JSX establishes a left column that re-uses the ***List*** component (with the newly created ***ListController*** context), and a right column that can be used to change the style.  The buttons at the bottom simply invoke the actions we already set up.

The updating of the fields in the ***StyleFields*** component is a very straightforward. It simply displays the current style attribute and allows it to be updated.
```
export function StyleFields () {

    useObservables();
    const toDoListStyle = useContext(StyleContext).todoListStyle;
    const [backgroundColor, setBackgroundColor] = useObservable(toDoListStyle.backgroundColor);
    const [listFontColor, setListFontColor] = useObservable(toDoListStyle.listFontColor);
    const [listItemBackgroundColor, setListItemBackgroundColor] = useObservable(toDoListStyle.listItemBackgroundColor);
    const [fontSize, setFontSize] = useObservable(toDoListStyle.fontSize);
    const [navbarBg, setNavbarBg] = useObservable(toDoListStyle.navbarBg);
    const [activeProp, setActiveProp] = useState('');

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
```
In order to simplify the getting and setting of each style property **useObservable** is used to create a "getter" and a "setter" function for each property.  This helper will take the last property referenced, e.g., the one passed as an argument, and automatically create a function that will set its value.  This avoids having to create numerous setters or having to modify the state directly in the component code.  The ***activeProp*** just selects the current form group and expands the details.  Here useState is perfectly appropriate since this is only needed locally.



