import React, { useState } from 'react';
import { useActions, useApp } from '../../store';
import { INPUT_CLASS } from '../blocks/styles';

// Shown when no board is open: create one, or pick an existing one.
export default function BoardGate() {
  const boards = useApp((s) => s.boards);
  const status = useApp((s) => s.status);
  const { createBoard, openBoard } = useActions();
  const [name, setName] = useState('');

  if (status === 'loading') return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createBoard(name.trim());
    setName('');
  };

  return (
    <div className="w-full max-w-md mx-auto pt-40 px-8">
      <form onSubmit={handleCreate} className="apple-glass rounded-card p-8 shadow-2xl flex flex-col space-y-5">
        <h2 className="text-ink font-bold text-xl">
          {boards.length ? 'Open a board' : 'Create your first board'}
        </h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Board name (e.g. Japan trip)"
          autoFocus
          className={`${INPUT_CLASS} px-4 h-10 rounded-full`}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-2.5 bg-primary/90 backdrop-blur-md border border-primary/50 text-white rounded-full hover:bg-primary-strong/90 text-sm font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create board
        </button>

        {boards.length > 0 && (
          <ul className="flex flex-col pt-2 border-t border-ink/10">
            {boards.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => openBoard(b.id)}
                  className="w-full flex justify-between px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 transition-colors text-sm text-ink"
                >
                  <span>{b.name}</span>
                  <span className="text-ink/40">{b.itemCount}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}
