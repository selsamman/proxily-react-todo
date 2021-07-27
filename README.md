# Proxily Sample Application (ToDo List)

## Usage
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

After checking out the project, run these commands in the project directory:

### `yarn install`
### `yarn start`

Note: Until Proxily is published on NPM you need to have it in an adjacent folder.  You run yarn build and then remove node_modules.  Then you can run install and start above.

# The Application
This is a rather simple todo application - add Todo items and check them off when done.  However, it has two additional features that demonstrate unique features Proxily has to offer:

* When you check off a ToDo it is not immediately removed from the list.  Instead, the item is removed after a 5-second delay.  During that time an undo link is display to undo the completion.  If you check multiple items the 5-second window extends such that items are deleted 5 seconds after the last one is checked as completed.  This is implemented quite simply and effectively with Sagas which are a standard feature of Proxily.


* There is a gear icon that lets you change colors and font sizes.  A preview is shown of the new style and when you are satisfied you can save or cancel changes.  These feature is implemented using transactions which fork the state and merge it back upon completion.

* The style dialog also implements undo/redo by simply calling undo/redo on the transaction.

# Usage Patterns Demonstrated

* How to construct and persist a store
* Reacting to state change
* Using controllers with state
* Sagas
* Transactions

## Setting up Persistent State
Best practices are to have a folder with all of your classes that represent persistent state and then to coalesce them into an index.tsx file.  This makes them easier to enumerate which will be needed when you want to persist the store.  Your persistent state classes really only need to have the essential functionality for managing the data itself and not the logic for how the data is to be used.  We place data access logic in controllers.

We have two simple classes ToDoList and ToDoListItem which represent the list

###ToDoList
```javascript
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

###TodoListItem
```javascript
export class ToDoListItem {
    title = "";
    completed = false;
}
```

###TodoListStyle
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

###index.tsx
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
  
Given there role in presenting state to view components, we will pass the persistent state to our components by way of the controllers which we create in ***App.tsx***
```javascript
const styleController = makeObservable(new StyleController(toDoListStyle));
const listController = makeObservable(new ListController(toDoList));
```
After creating them, we must make them observable such that the components will react to any changes in state.  This can be changes to state in the controllers or any data that they reference such as the todo list itself and  the style.  Finally, we are ready to pass them to our components.  In this case will use React contexts to pass them along.  Using contexts makes it easier to organize when the controller is used by multiple components which we will is the case in this demo.  So here is our App's jsx
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
    
Note the ***useObservables*** which is the counter-part to ***makeObservable*** which will track usage of the state and re-render the app when it changes.

### List.tsx
Our list component will display the list of the items and manage the toast that is displayed when items are checked off.  In order to keep this component devoid of logic we first gather everything that our JSX will need to do its job:
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
First we retrieve the ***listController*** from context and extract ***items*** which is the list items themselves.  We also retrieve ***styleController*** from the context and then extract the style for the list container.  We then use the react-bootstrap ListGroup and ListItem components to iterate over the items which will be presented by our ***ListItem*** component.

Just as the list itself has a controller each list item also has a controller.  There is one instance for each list item.  We could have created this controller inside the ***ListItem*** component but this would make it harder to test and less modular.  Therefore, we create it in the JSX using ***ObservableProvider*** which will create a context with the controller as an observable.  The controller is created in the ***value*** callback which is called anytime ***dependencies*** change.  This is important since we can't rely on the key which is an index since the association of index and actual items can change when deleting items from the list.

### ListController.tsx
The list controller is responsible for all activities surrounding the list and consumed by a number of components.
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
* The ***toDoList*** state
* A reference to a ***DeleteNotificationController** which manages the deletion notification (example of composition)
* The currently selected ***toToList*** item
It contains a number of methods for maintaining the toDoList and for tracking the selection item.  It also contains the state and methods associated with deciding whether to display the Deletion Notification.

### ListItem.tsx
The listItem component is fairly simple and just displays an individual list item.  It gets all information on the item from the ***listItemController*** which it retrieves from context.  It also gets style information from the ***styleController*** which it also retrieves from context.

The component then displays a checkbox and either an input or a text element depending on whether this item is selected or not.  It alerts the ***listItemController*** of user actions such as selecting this item, editing the text, checking off the item.  While many of these actions involve the ***ListController*** as well this is not the concern of the ListItem component which deals exclusively with the ***ListItemController*** for all list item matters.  Controllers are an effective way to separate concerns and keep components simple.
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

