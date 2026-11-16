import { useState } from 'react';
import PriorityPicker from './PriorityPicker.jsx';

export default function TodoInput({ onAdd }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState(0);
  const [due, setDue] = useState('');
  const [tags, setTags] = useState('');
  const [open, setOpen] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, {
      priority,
      due_date: due || null,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setText('');
    setPriority(0);
    setDue('');
    setTags('');
    setOpen(false);
  };

  return (
    <form className="todo-input" onSubmit={submit}>
      <div className="todo-input__row">
        <input
          className="todo-input__field"
          type="text"
          value={text}
          placeholder="Что нужно сделать?"
          onChange={(event) => setText(event.target.value)}
          aria-label="Новая задача"
        />
        <button className="btn btn--primary" type="submit">
          Добавить
        </button>
      </div>

      <button
        className="btn btn--link todo-input__toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? 'Скрыть детали' : 'Детали'}
      </button>

      {open && (
        <div className="todo-input__details">
          <div className="todo-input__details-row">
            <PriorityPicker value={priority} onChange={setPriority} />
            <input
              className="todo-input__date"
              type="date"
              value={due}
              onChange={(event) => setDue(event.target.value)}
              aria-label="Срок"
            />
          </div>
          <input
            className="todo-input__field"
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Теги через запятую"
            aria-label="Теги"
          />
        </div>
      )}
    </form>
  );
}
