const PRIORITIES = [
  { value: 0, label: '—', title: 'Без приоритета' },
  { value: 1, label: '1', title: 'Низкий' },
  { value: 2, label: '2', title: 'Средний' },
  { value: 3, label: '3', title: 'Высокий' },
];

export default function PriorityPicker({ value, onChange }) {
  return (
    <div className="priority" role="radiogroup" aria-label="Приоритет">
      {PRIORITIES.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`priority__btn priority__btn--${p.value}${
            value === p.value ? ' is-active' : ''
          }`}
          onClick={() => onChange(p.value)}
          aria-pressed={value === p.value}
          title={p.title}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
