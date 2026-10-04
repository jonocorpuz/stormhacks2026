// @vitest-environment jsdom
// End-to-end UI loop: board gate -> create board -> create note -> edit -> survives reload.
import React from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRepo } from './persistence';
import { createAppStore, StoreProvider } from './store';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});
afterEach(cleanup);

async function mount(repo) {
  const store = createAppStore(repo);
  await store.actions.init();
  render(
    <StoreProvider store={store}>
      <App />
    </StoreProvider>,
  );
  return store;
}

const click = (el) => act(async () => fireEvent.click(el));
const type = (el, value) => act(async () => fireEvent.change(el, { target: { value } }));

describe('App', () => {
  it('runs the full board + note loop off the store', async () => {
    const repo = new MemoryRepo();
    await mount(repo);

    // No boards -> gate
    expect(screen.getByText('Create your first board')).toBeTruthy();
    await type(screen.getByPlaceholderText(/Board name/), 'Japan trip');
    await click(screen.getByText('Create board'));

    // On the board, empty
    expect(screen.getByText('Japan trip')).toBeTruthy();
    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();

    // + New -> form built from Note schema
    await click(screen.getByLabelText('New'));
    await type(screen.getByPlaceholderText(/Short headline/), 'Ramen spots');
    await type(screen.getByPlaceholderText(/Free-form content/), 'Ichiran, Afuri');
    await click(screen.getByText('Create Note'));
    expect(screen.getByText('Ramen spots')).toBeTruthy();
    expect(screen.getByText('Ichiran, Afuri')).toBeTruthy();

    // Search filters
    await type(screen.getByPlaceholderText('Search'), 'pizza');
    expect(screen.queryByText('Ramen spots')).toBeNull();
    await type(screen.getByPlaceholderText('Search'), '');

    // Edit via modal
    await click(screen.getByText('Ramen spots'));
    await type(screen.getByDisplayValue('Ramen spots'), 'Best ramen');
    await click(screen.getByText('Save'));
    expect(screen.getByText('Best ramen')).toBeTruthy();

    // Reload: fresh store on same repo lands back on the board w/ the note
    cleanup();
    await mount(repo);
    expect(screen.getByText('Japan trip')).toBeTruthy();
    expect(screen.getByText('Best ramen')).toBeTruthy();
  });

  it('edit mode resizes (view) and deletes items', async () => {
    const repo = new MemoryRepo();
    const store = await mount(repo);
    await act(async () => {
      await store.actions.createBoard('B');
      await store.actions.createItem('recommendation_list', { title: 'Temp' }); // resizable (notes are fixed-size)
    });

    await click(screen.getByLabelText('Edit board'));
    await click(screen.getByLabelText('Resize'));
    const item = store.getState().currentBoard.items[0];
    expect(store.getState().currentBoard.view.sizes[item.id]).toBe('2x1');

    await click(screen.getByLabelText('Delete'));
    expect(screen.queryByText('Temp')).toBeNull();
    expect(store.getState().currentBoard.items).toEqual([]);
  });
});
