import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import TodoInput from './components/TodoInput.jsx';
import TodoItem from './components/TodoItem.jsx';
import TodoFilters from './components/TodoFilters.jsx';
import ListSidebar from './components/ListSidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import useStore from './hooks/useStore.js';

export default function App() {
  const store = useStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortable = filter === 'all' && !search && !tagFilter;

  const filteredTodos = useMemo(() => {
    let t = store.todos;
    if (filter === 'active') t = t.filter((x) => !x.completed);
    if (filter === 'completed') t = t.filter((x) => x.completed);
    if (tagFilter) t = t.filter((x) => (x.tags || []).includes(tagFilter));
    if (search) {
      const q = search.toLowerCase();
      t = t.filter(
        (x) =>
          x.text.toLowerCase().includes(q) ||
          (x.tags || []).some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return t;
  }, [store.todos, filter, search, tagFilter]);

  const allTags = useMemo(
    () => Array.from(new Set(store.todos.flatMap((x) => x.tags || []))).sort(),
    [store.todos],
  );

  const counts = useMemo(
    () => ({
      all: store.todos.length,
      active: store.todos.filter((x) => !x.completed).length,
      completed: store.todos.filter((x) => x.completed).length,
    }),
    [store.todos],
  );

  const remaining = counts.active;

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    store.reorderTodos(active.id, over.id);
  };

  const plural = (n) =>
    n % 10 === 1 && n % 100 !== 11
      ? 'задача'
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
        ? 'задачи'
        : 'задач';

  return (
    <div className="app">
      <h1 className="app__title">To-Do</h1>

      <div className="app__layout">
        <ListSidebar
          lists={store.lists}
          activeId={store.activeListId}
          onSelect={store.selectList}
          onAdd={store.addList}
          onRename={store.renameList}
          onDelete={store.deleteList}
        />

        <main className="app__main">
          {store.loading ? (
            <p className="todo-list__empty">Загрузка…</p>
          ) : (
            <>
              <TodoInput onAdd={store.addTodo} />
              <Toolbar
                search={search}
                onSearch={setSearch}
                tags={allTags}
                tagFilter={tagFilter}
                onTagFilter={setTagFilter}
              />
              <TodoFilters filter={filter} onChange={setFilter} counts={counts} />

              {!sortable && store.todos.length > 1 && (
                <p className="app__hint">Сортировка доступна без поиска и фильтров</p>
              )}

              {store.error && (
                <div className="app__error" role="alert">
                  {store.error}
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={store.todos.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="todo-list">
                    {filteredTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        sortable={sortable}
                        onToggle={store.toggleTodo}
                        onDelete={store.deleteTodo}
                        onUpdate={store.updateTodo}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>

              {filteredTodos.length === 0 && (
                <p className="todo-list__empty">
                  {store.todos.length === 0
                    ? 'Задач пока нет. Добавьте первую!'
                    : 'Нет задач по выбранному фильтру.'}
                </p>
              )}

              <footer className="app__footer">
                <span className="app__footer__count">
                  Осталось: {remaining} {plural(remaining)}
                </span>
                {store.todos.some((t) => t.completed) && (
                  <button className="btn btn--link" onClick={store.clearCompleted}>
                    Очистить выполненные
                  </button>
                )}
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
