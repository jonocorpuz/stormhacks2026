import React, { useState } from 'react';
import { useActions, useApp } from '../../store';
import { INPUT_CLASS } from '../blocks/styles';

// Header pill showing the current board; dropdown to switch, create, rename, delete.
export default function BoardMenu({ isOpen, onToggle, onClose }) {
  const boards = useApp((s) => s.boards);
  const currentBoard = useApp((s) => s.currentBoard);
  const { openBoard, createBoard, renameBoard, deleteBoard } = useActions();
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);

  if (!currentBoard) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createBoard(newName.trim());
    setNewName('');
    onClose();
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (renaming?.trim()) await renameBoard(currentBoard.id, renaming.trim());
    setRenaming(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${currentBoard.name}" and everything on it?`)) return;
    await deleteBoard(currentBoard.id);
    onClose();
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="apple-glass h-12 px-5 rounded-full flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-white hover:bg-white dark:hover:bg-white/20 transition-colors max-w-[14rem]"
      >
        <span className="truncate">{currentBoard.name}</span>
        <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-4 left-0 w-64 p-2 apple-glass rounded-2xl origin-top animate-slide-down-fade z-50 flex flex-col">
          <ul className="flex flex-col max-h-64 overflow-y-auto">
            {boards.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => {
                    if (b.id !== currentBoard.id) openBoard(b.id);
                    onClose();
                  }}
                  className={`w-full flex justify-between px-4 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm ${
                    b.id === currentBoard.id ? 'font-semibold text-black dark:text-white' : ''
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  <span className="opacity-50">{b.itemCount}</span>
                </button>
              </li>
            ))}
          </ul>

          <hr className="border-black/10 dark:border-white/10 my-1 mx-2" />

          <form onSubmit={handleCreate} className="p-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="+ New board"
              className={`${INPUT_CLASS} px-4 h-9 rounded-full`}
            />
          </form>

          {renaming === null ? (
            <button
              onClick={() => setRenaming(currentBoard.name)}
              className="px-4 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm text-left"
            >
              Rename board
            </button>
          ) : (
            <form onSubmit={handleRename} className="p-2">
              <input
                value={renaming}
                onChange={(e) => setRenaming(e.target.value)}
                onBlur={handleRename}
                autoFocus
                className={`${INPUT_CLASS} px-4 h-9 rounded-full`}
              />
            </form>
          )}

          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-sm text-left text-red-500 dark:text-red-400"
          >
            Delete board
          </button>
        </div>
      )}
    </div>
  );
}
