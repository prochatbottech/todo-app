import { useState } from 'react';

export default function ListSidebar({ lists, activeId, onSelect, onAdd, onRename, onDelete }) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const submitAdd = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onAdd(n);
    setName('');
  };

  const submitRename = (e) => {
    e.preventDefault();
    const n = editName.trim();
    if (!n) return setEditingId(null);
    onRename(editingId, n);
    setEditingId(null);
  };

  return (
    <aside className="lists">
      <h2 className="lists__title">Списки</h2>

      <form className="lists__add" onSubmit={submitAdd}>
        <input
          className="lists__add-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Новый список"
          aria-label="Название нового списка"
        />
        <button className="btn btn--primary lists__add-btn" type="submit" aria-label="Добавить список">
          +
        </button>
      </form>

      <ul className="lists__items">
        {lists.map((list) => (
          <li key={list.id} className={`lists__item${list.id === activeId ? ' is-active' : ''}`}>
            {editingId === list.id ? (
              <form className="lists__rename" onSubmit={submitRename}>
                <input
                  className="lists__rename-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </form>
            ) : (
              <button className="lists__name" onClick={() => onSelect(list.id)}>
                <span className="lists__name-text">{list.name}</span>
                <span className="lists__count">{list.active}</span>
              </button>
            )}

            <div className="lists__actions">
              {editingId === list.id ? (
                <button className="btn btn--icon lists__ok" onClick={submitRename} aria-label="Сохранить" title="Сохранить">
                  ✓
                </button>
              ) : (
                <button
                  className="btn btn--icon"
                  onClick={() => {
                    setEditingId(list.id);
                    setEditName(list.name);
                  }}
                  aria-label="Переименовать список"
                  title="Переименовать"
                >
                  ✎
                </button>
              )}
              <button
                className="btn btn--icon"
                onClick={() => onDelete(list.id)}
                aria-label="Удалить список"
                title="Удалить"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
