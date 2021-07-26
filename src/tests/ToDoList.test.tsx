import "@testing-library/jest-dom/extend-expect";
import {ToDoList} from "../store";



describe('ToDoList', () => {
    it('can add and delete', () => {
        const toDo = new ToDoList();
        toDo.addItem('foo');
        toDo.addItem('bar');
        expect(toDo.toDoListItems).toHaveLength(2);
        expect(toDo.toDoListItems[0].title).toBe('foo');
        expect(toDo.toDoListItems[1].title).toBe('bar');
        toDo.deleteItem(toDo.toDoListItems[0]);
        expect(toDo.toDoListItems).toHaveLength(1);
        expect(toDo.toDoListItems[0].title).toBe('bar');
        expect(toDo.toDoListItems[1]).toBe(undefined);

    });

})
