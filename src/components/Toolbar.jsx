export default function Toolbar({ search, onSearch, tags, tagFilter, onTagFilter }) {
  return (
    <div className="toolbar">
      <input
        className="toolbar__search"
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Поиск…"
        aria-label="Поиск задач"
      />
      {tags.length > 0 && (
        <div className="toolbar__tags">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className={`tag tag--btn${tagFilter === t ? ' is-active' : ''}`}
              onClick={() => onTagFilter(tagFilter === t ? null : t)}
              aria-pressed={tagFilter === t}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
