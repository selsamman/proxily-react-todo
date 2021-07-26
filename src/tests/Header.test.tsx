import "@testing-library/jest-dom/extend-expect";
import {ToDoList, TodoListStyle} from "../store";
import {StyleContext, StyleController} from "../controllers/StyleController";
import {ListContext, ListController} from "../controllers/ListController";
import {Header} from "../components/Header";
import {render, screen} from "@testing-library/react";
import {makeObservable} from "proxily";
function makeMockFromClass<T>(c : abstract new (...args: any) => T, jestfn : Function, o: Partial<T>) : T {
    const proto = c.prototype.constructor.prototype
    Object.getOwnPropertyNames(proto).forEach(p => {
        const props = Object.getOwnPropertyDescriptor(proto, p);
        if (typeof props?.get !== "function"  && typeof proto[p] == 'function')
            (o as unknown as any)[p] = jestfn();

    })
    return o as T
}
describe('Header', () => {
    it('can add and delete', () => {
        //const mockListController = makeObservable(new ListController(new ToDoList()));
        //mockListController.invokeStyle = jest.fn();
        //mockListController.addItem = jest.fn();
        class MockListController extends ListController {
            invokeStyle = jest.fn();
            addItem = jest.fn();
        }
        const mockListController = makeObservable(new MockListController(new ToDoList()));

        function Mock () {
            return (
                <StyleContext.Provider value={new StyleController(new TodoListStyle())}>
                    <ListContext.Provider value={mockListController}>
                        <Header />
                    </ListContext.Provider>
                </StyleContext.Provider>
            );
        }
        render (<Mock />);
        screen.getAllByRole('button')[0].click();
        expect(mockListController.addItem).toHaveBeenCalled();
        screen.getAllByRole('button')[1].click();
        expect(mockListController.invokeStyle).toBeCalled();
    });
    it('can add and delete alt', () => {

        function Mock ({mockStyleController, mockListController} :
                       {mockStyleController : StyleController, mockListController : ListController}) {
            return (
                <StyleContext.Provider value={mockStyleController}>
                    <ListContext.Provider value={mockListController}>
                        <Header />
                    </ListContext.Provider>
                </StyleContext.Provider>
            );
        }
        const mockListController = makeMockFromClass(ListController, jest.fn,{});
        const mockStyleController = makeMockFromClass(StyleController, jest.fn, {
            get navbarButtonVariant () {return "secondary"}
        })
        render (<Mock mockListController={mockListController} mockStyleController={mockStyleController}/>);
        screen.getAllByRole('button')[0].click();
        expect(mockListController.addItem).toHaveBeenCalled();
        screen.getAllByRole('button')[1].click();
        expect(mockListController.invokeStyle).toBeCalled();
    });

})


