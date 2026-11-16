const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
];

export default function TodoFilters({ filter, onChange, counts }) {
  return (
    <div className="todo-filters" role="group" aria-label="Фильтр задач">
      {FILTERS.map((item) => (
        <button
          key={item.value}
          className={`btn${filter === item.value ? ' btn--active' : ''}`}
          onClick={() => onChange(item.value)}
          aria-pressed={filter === item.value}
        >
          <span>{item.label}</span>
          <span className="todo-filters__count">{counts[item.value] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
