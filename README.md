# Proxily Sample Application (ToDo List)

## Usage
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

After checking out the project, run these commands in the project directory:

### `yarn install`
### `yarn start`

Note: Until Proxily is published on NPM you need to have it in an adacent folder.  You run yarn build and then remove node_modules.  Then you can run the install and start above.

# The Application
This is a rather simple todo application - add Todo items and check them off when done.  However it has two additional features tha demonstrate some of the unique features Proxily has to offer:

* When you check off a ToDo it is not immediately removed from the list.  Instead a popup (Toast) appears that tells you they will be deleted shortly (in 5 seconds) and that you can undo the completion.  As long as you check off more ToDo items for completion the time extends further.  This is implemented quite simply and effectively with Sagas which are a standard feature of Proxily.


* There is a gear icon that lets you change colors and font sizes.  A preview is shown of the new style and when you are satisfied you can save or cancel changes.  These features are often implemented by taking snapshots of the state and restoring it.  In many applications that also communicate with the server in the background, this will not work since it would undo any changes received from the server.  With Proxily you need only fork the state with Transaction and the commit or roll it back.

* The style dialog also implements an undo/redo by simply calling undo/redo on the transaction.

# Usage Patterns Demonstrated

* How to construct and persist a store
* Reacting to state change
* Using controllers
* Sagas
* Transactions

## Setting up a store
The simplist thing to do is to have folder with all of your classes that represent state and then to colless them into and index.tsx file.  Doing it this way means you can easily enumerate all of the classes which is handy when want to persist the store.  Remember that the store classes really only need to have the essential functionality for managing the data itself and not the logic for how the data is accessed.  We place data access logic in controllers.
