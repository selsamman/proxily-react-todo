# Proxily Sample Application (ToDo List)

## Usage
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

After checking out the project, run these commands in the project directory:

### `yarn install`
### `yarn start`

> Note: Until Proxily is published on NPM you need to have it in an adjacent folder.  You run yarn install, yarn build and then remove node_modules.  This must be done before the above steps.

# The Application
This is a based more on the Google style todo list. You can add items, edit them and check them off when done.  However, it has two additional features that demonstrate unique features of Proxily:

* When you check off items they are removed after a 5-second delay.  During that time an **undo** link is display to undo the completion.  If you check multiple items the 5-second window extends such that items are deleted 5 seconds after the last one is completed.  This is implemented quite simply with Sagas.

* There is a gear icon that lets you change colors and font sizes.  A preview is shown of the new style and when you are satisfied you can save or cancel changes.  These feature is implemented using transactions which fork the state and merge it back upon completion.

* The style dialog also implements undo/redo which are part of Proxily transactions.

# Usage Patterns Demonstrated

* Creating state and persisting it
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
  nextId = 1;

  addItem (title? : string) {
    this.toDoListItems.push(new ToDoListItem(this.nextId++, title));
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

  id = 0;
  title = "";
  completed = false;

  constructor(id : number, title? : string) {
    this.id = id;
    this.title = title || "";
}

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
const classes = Object.values(require('./store'));
const toDoList = persist(new ToDoList(), {key: 'root', classes});
const toDoListStyle = persist(new TodoListStyle(), {key: 'style', classes});
```
We chose to keep them in separate keys under local storage, each identified by a **key**. In order for persist to serialize and deserialize them it needs a list of the classes.   Since we exported them all in index.tsx, we need only get the values from that file by requiring it and taking the properties as an Array.

Now they are ready to be passed into our components.  They could be passed as parameters or placed in a context or passed via controllers.

### Controller Pattern

This demo uses a controller pattern.  The controllers perform three functions in this pattern:
* They act as a view model in presenting the persistent state in the way the component needs to consume it.  
* They handle the logic for user events that the component captures
* They may have state of their own which is germaine to the user interactions such as maintaining the currently selected toDo list.
This allows the components themselves to act purely as a view and as such are very easy to test. The controllers may be consumed by multiple components.   This allows non-persistent state to be shared between components in a way that useState cannot accommodate.
  
Given their role in presenting state to view components, we will pass the persistent state to our components by way of the controllers which we create in ***App.tsx***
```javascript
const styleController = observable(new StyleController(toDoListStyle));
const listController = observable(new ListController(toDoList));
```
After creating them, we must make them observable by wrapping it in **observer** such that any components that reference them will react to state changes. We then pass them to our components using React context providers:
```typescript jsx
function App() {

  const {backgroundStyle} = styleController;
  const {showStyle} = listController;

  return (
    <StyleContext.Provider value={styleController}>
      <ListContext.Provider value={listController}>
        <Container style={{padding: 0, height: '100%', ...backgroundStyle}} fluid>
          <Header/>
          <List/>
        </Container>
        {showStyle &&
          <StyleUpdate/>
        }
      </ListContext.Provider>
    </StyleContext.Provider>
  );
}
export default observer(App);
```
The main jsx is doing the following:
* Setting up the context with the controllers that will be needed
* Presenting a container whose backgroundStyle will be changed based on the styleController
* Presenting the main components of the application
    * ***Header*** which shows add and settings buttons
    * ***List*** which displays the list itself
    * ***StyleUpdate*** which is a modal dialog which will appear when the setting button is pressed
    
Note **observer** which is the counter-part to **observable**.  Using these together will track usage of the state and re-render the component when state changes.

### List.tsx

Our list component will display the list of the items:
```typescript jsx
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
```
First we retrieve the ***ListController*** from context and extract ***items*** which is the list items themselves.  We also retrieve the ***StyleController*** from context and extract the style for the list container.  We iterate over the items to be presented by the ***ListItem*** component and pass each item to the ***ListItem*** component as a parameter.

### ListController.tsx

The list controller is responsible for all activities surrounding the list.  It is consumed by a number of components.  It contains several important elements
* A reference to the list itself
* A reference to a ***DeleteNotificationController*** which manages the deletion notification
* The currently selected item
* A number of getters for presenting the data
* Methods for maintaining the list and tracking the selection of an item.
```javascript
export class ListController {

    constructor(toDoList : ToDoList) {
        this.toDoList = toDoList;
        this.deleteNotificationController = new DeleteNotificationController(this);
    }
    toDoList : ToDoList;
    deleteNotificationController : DeleteNotificationController;

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


### ListItem.tsx

The ***ListItem*** component displays an individual list item.  It is passed the list item as a parameter and gets it's ***ListController*** and ***StyleController*** from context.  **useObservableProp** provides getters and setters for the item properties that must be set.  The component also interacts with the ***ListController*** to determine if the item is selected, to select list items and notify the list controller when an item has been checked off.

```javascript
export function ListItem ({item} : {item : ToDoListItem}) {

  useObservables();

  const listController = useContext(ListContext);
  const styleController = useContext(StyleContext);
  const {listItemStyle, checkboxStyle, inputStyle} = styleController;
  
  const [title, setTitle] = useObservableProp(item.title);
  const [completed, setCompleted] = useObservableProp(item.completed);
  const selected = listController.selectedItem === item;

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

****deleteCompletedItems*** is a Saga managed by redux-saga.  The ***scheduleTask*** will run a dispatcher Saga, built-in to Proxily, that will yield to the ****deletedCompletedItems*** saga.  Redux-saga has a number of take helpers that control the concurrency of this saga.  By using ***takeLatest***, the saga will be cancelled and restarted if another one is scheduled.  This extends the amount of time before the saga will reach the code to remove the completed items since the saga will restart from the beginning.  

Should the user press UNDO ***undoCompleted*** items will be invoked from the ***Header*** component.  In that case the completion status will be undone, and the saga cancelled with ***cancelTask***.  Note that the same taker must be past as the second parameter.  

Proxily makes it easy to use Sagas and without having to use Redux itself. While all of this logic could have been accomplished by SetTimer and tracking various states it gets more complicated because a Promise cannot be cancelled whereas any yield step in a saga can.

### Style Update Modal Dialog

The ***StyleUpdate*** component manages the modal dialog which allows styles to be changed.  It shows a preview of the list and defers committing the style changes until the user presses the save button.  It also offers undo/redo as well as the ability to reset the style back to the state at the start of the dialog.

The first step is to setup the list controllers.  There are actually two:
* ***listController*** is the main list controller manages when to display the update modal dialog and so it is needed to be able to hide the dialog when complete.  It is simply retrieved from context.
* ***sampleListController*** is for the sample todoList that appears in the dialog to preview the styles.  We create this one with ***useLocalObservable*** which will make a local instance of the listController for that purpose.  ***useLocalObservable*** ensures the object is created once when the component is mounted just like the callback in **useState***.

```typescript jsx
export function StyleUpdate () {

  useObservables();

  const listController = useContext(ListContext);
  const {showStyle, hideStyle} = listController;
  const sampleListController = useLocalObservable(() => new ListController(sampleToDoList))



```
Then we create a Proxily **Transaction** with ***useTransaction***.  ***useTransaction*** will ensure only one transaction is created and that every render will have a reference to this transaction. We specify **timePositioning: true** so that undo/redo events will be recorded.

We set up a ***StyleController*** for the modal dialog with **useTransactable** which will a new copy of the controller bound to the transaction.  Changes to this object (or any objects referenced from it) will not impact the original state. Thus changes made in this modal dialog will not yet impact the main list in the application.
```typescript
    const transaction = useTransaction({timePositioning: true});
    const styleController = useTransactable(useContext(StyleContext), transaction);
    const {backgroundStyle} = styleController;

```
Event handlers for the main actions in the dialog are set up at this point.  The cancel will simply rollback the changes on the transaction which will update any transactable versions of data back to the original.  The save will commit changes in the transactable versions of the data back to this which copies the original. In both cases the modal dialog is dismissed.  Undo and redo buttons ask the transaction to undo or redo the latest state changes.
```javascript
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
Now we are ready to return the JSX:
```javascript
    return (
        <Modal show={showStyle} onHide={hideStyle} size="xl">

          <Modal.Header closeButton>
            <Modal.Title>List Styles</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <StyleContext.Provider value={styleController}>
              <ListContext.Provider value={sampleListController}>
                <Row>
                  <Col md={6} style={backgroundStyle}>
                    <List />
                  </Col>
                  <Col md={6}>
                    <StyleFields />
                  </Col>
                </Row>
              </ListContext.Provider>
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
We set up the ***ListController*** and ***StyleController*** as contexts. The JSX establishes a left column that re-uses the ***List*** component (with the newly created ***ListController*** context), and a right column that can be used to change the style.  The buttons at the bottom simply invoke the actions we already set up.

The updating of the fields in the ***StyleFields*** component is a very straightforward. It simply displays the current style attribute and allows it to be updated.
```
export function StyleFields () {

    useObservables();
    const toDoListStyle = useContext(StyleContext).todoListStyle;
    const [backgroundColor, setBackgroundColor] = useObservableProp(toDoListStyle.backgroundColor);
    const [listFontColor, setListFontColor] = useObservableProp(toDoListStyle.listFontColor);
    const [listItemBackgroundColor, setListItemBackgroundColor] = useObservableProp(toDoListStyle.listItemBackgroundColor);
    const [fontSize, setFontSize] = useObservableProp(toDoListStyle.fontSize);
    const [navbarBg, setNavbarBg] = useObservableProp(toDoListStyle.navbarBg);
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
In order to simplify the getting and setting of each style property **useObservableProp** is used to create a "getter", and a "setter" function for each property.  This helper will take the last property referenced, e.g., the one passed as an argument, and automatically create a function that will set its value.  This avoids having to create numerous setters or having to modify the state directly in the component code.  The ***activeProp*** just selects the current form group and expands the details.  Here useState is perfectly appropriate since this is only needed locally.



