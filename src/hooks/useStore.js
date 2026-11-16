import { useCallback, useEffect, useRef, useState } from 'react';
import request from '../api.js';

export default function useStore() {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRef = useRef(null);
  activeRef.current = activeListId;

  const reloadTodos = useCallback(async (id) => {
    if (id == null) {
      setTodos([]);
      return;
    }
    const r = await request('GET', `/lists/${id}/todos`);
    setTodos(r.todos);
  }, []);

  const refreshLists = useCallback(async () => {
    const r = await request('GET', '/lists');
    setLists(r.lists);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await request('GET', '/lists');
        setLists(r.lists);
        const id = r.lists.length ? r.lists[0].id : null;
        setActiveListId(id);
        await reloadTodos(id);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadTodos]);

  const selectList = useCallback(async (id) => {
    setActiveListId(id);
    setError(null);
    try {
      await reloadTodos(id);
    } catch (e) {
      setError(e.message);
    }
  }, [reloadTodos]);

  const addList = useCallback(async (name) => {
    const r = await request('POST', '/lists', { name });
    await refreshLists();
    setActiveListId(r.id);
    setTodos([]);
    return r;
  }, [refreshLists]);

  const renameList = useCallback(async (id, name) => {
    await request('PATCH', `/lists/${id}`, { name });
    await refreshLists();
  }, [refreshLists]);

  const deleteList = useCallback(async (id) => {
    await request('DELETE', `/lists/${id}`);
    await refreshLists();
    const next = lists.find((l) => l.id !== id);
    const nid = next ? next.id : null;
    setActiveListId(nid);
    await reloadTodos(nid);
  }, [lists, refreshLists, reloadTodos]);

  const addTodo = useCallback(async (text, extra = {}) => {
    const r = await request('POST', `/lists/${activeRef.current}/todos`, { text, ...extra });
    setTodos((ts) => [...ts, r.todo]);
    await refreshLists();
  }, [refreshLists]);

  const updateTodo = useCallback(async (id, patch) => {
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      const r = await request('PATCH', `/todos/${id}`, patch);
      setTodos((ts) => ts.map((t) => (t.id === id ? r.todo : t)));
      await refreshLists();
    } catch (e) {
      setError(e.message);
      await reloadTodos(activeRef.current);
    }
  }, [refreshLists, reloadTodos]);

  const toggleTodo = useCallback((id, completed) => {
    return updateTodo(id, { completed });
  }, [updateTodo]);

  const deleteTodo = useCallback(async (id) => {
    const prev = todos;
    setTodos((ts) => ts.filter((t) => t.id !== id));
    try {
      await request('DELETE', `/todos/${id}`);
      await refreshLists();
    } catch (e) {
      setError(e.message);
      setTodos(prev);
    }
  }, [todos, refreshLists]);

  const clearCompleted = useCallback(async () => {
    const prev = todos;
    setTodos((ts) => ts.filter((t) => !t.completed));
    try {
      await request('POST', '/todos/clear-completed', { list_id: activeRef.current });
      await refreshLists();
    } catch (e) {
      setError(e.message);
      setTodos(prev);
    }
  }, [todos, refreshLists]);

  const reorderTodos = useCallback(async (activeId, overId) => {
    const list = [...todos];
    const from = list.findIndex((t) => t.id === activeId);
    const to = list.findIndex((t) => t.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setTodos(list);
    try {
      await request('POST', '/todos/reorder', { ordered_ids: list.map((t) => t.id) });
    } catch (e) {
      setError(e.message);
      await reloadTodos(activeRef.current);
    }
  }, [todos, reloadTodos]);

  return {
    lists,
    activeListId,
    todos,
    loading,
    error,
    selectList,
    addList,
    renameList,
    deleteList,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    reorderTodos,
  };
}
