# Proxily Sample Application (ToDo List)

## Usage
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

After checking out the project, run these commands in the project directory:

### `yarn install`
### `yarn start`

# Usage Patterns Demonstrated

* How to construct and persist a store
* Reacting to state change
* Using controllers
* Sagas
* Transactions

## Setting up a store
The simplist thing to do is to have folder with all of your classes that represent state and then to colless them into and index.tsx file.  Doing it this way means you can easily enumerate all of the classes which is handy when want to persist the store.  Remember that the store classes really only need to have the essential functionality for managing the data itself and not the logic for how the data is accessed.  We place data access logic in controllers.
