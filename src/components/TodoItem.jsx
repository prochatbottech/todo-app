import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PriorityPicker from './PriorityPicker.jsx';

function isOverdue(due) {
  return due && new Date(`${due}T23:59:59`) < new Date();
}

export default function TodoItem({ todo, sortable, onToggle, onDelete, onUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id, disabled: !sortable });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const openEdit = () => {
    setDraft({
      text: todo.text,
      priority: todo.priority,
      due_date: todo.due_date || '',
      tags: (todo.tags || []).join(', '),
    });
    setEditing(true);
  };

  const save = () => {
    const text = draft.text.trim();
    if (!text) return;
    onUpdate(todo.id, {
      text,
      priority: draft.priority,
      due_date: draft.due_date || null,
      tags: draft.tags.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setEditing(false);
  };

  const style = { transform: CSS.Transform.toString(transform), transition };
  const cls = `todo-item priority-${todo.priority}${
    todo.completed ? ' todo-item--completed' : ''
  }${isDragging ? ' todo-item--dragging' : ''}`;

  return (
    <li ref={setNodeRef} style={style} className={cls}>
      {sortable && (
        <button
          className="drag-handle"
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Перетащить задачу"
          title="Перетащить"
        >
          ≡
        </button>
      )}

      <input
        className="todo-item__checkbox"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
        aria-label="Выполнено"
      />

      {editing ? (
        <div className="todo-item__edit">
          <input
            className="todo-input__field"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            autoFocus
            aria-label="Текст задачи"
          />
          <div className="todo-item__edit-row">
            <PriorityPicker
              value={draft.priority}
              onChange={(v) => setDraft({ ...draft, priority: v })}
            />
            <input
              className="todo-input__date"
              type="date"
              value={draft.due_date}
              onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
              aria-label="Срок"
            />
          </div>
          <input
            className="todo-input__field"
            value={draft.tags}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
            placeholder="Теги через запятую"
            aria-label="Теги"
          />
          <div className="todo-item__edit-actions">
            <button className="btn" type="button" onClick={save}>
              Сохранить
            </button>
            <button className="btn btn--link" type="button" onClick={() => setEditing(false)}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className="todo-item__body">
          <span className="todo-item__text">{todo.text}</span>
          {todo.tags && todo.tags.length > 0 && (
            <span className="todo-item__tags">
              {todo.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </span>
          )}
          {todo.due_date && (
            <span
              className={`todo-item__due${
                isOverdue(todo.due_date) && !todo.completed ? ' todo-item__due--overdue' : ''
              }`}
            >
              {todo.due_date}
            </span>
          )}
        </div>
      )}

      <div className="todo-item__actions">
        {!editing && (
          <button
            className="btn btn--icon"
            onClick={openEdit}
            aria-label="Редактировать задачу"
            title="Редактировать"
          >
            ✎
          </button>
        )}
        <button
          className="btn btn--icon"
          onClick={() => onDelete(todo.id)}
          aria-label="Удалить задачу"
          title="Удалить"
        >
          ×
        </button>
      </div>
    </li>
  );
}
