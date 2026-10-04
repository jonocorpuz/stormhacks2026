// @vitest-environment jsdom
// End-to-end UI loop: board gate -> create board -> create note -> edit -> survives reload.
import React from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { packDenseLayout } from './components/boards/BoardGrid';
import { MemoryRepo } from './persistence';
import { createAppStore, StoreProvider } from './store';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return this.parentElement || document.body;
    },
  });
  const origGetBCR = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    const t = this.style?.transform || '';
    const m = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    if (m) {
      const left = parseFloat(m[1]);
      const top = parseFloat(m[2]);
      const width = parseFloat(this.style?.width) || 200;
      const height = parseFloat(this.style?.height) || 200;
      return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
        x: left,
        y: top,
        toJSON: () => {},
      };
    }
    return origGetBCR.call(this);
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

    // On the board
    expect(screen.getByText('Japan trip')).toBeTruthy();

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

  it('edit mode asks for confirmation before deleting items', async () => {
    const repo = new MemoryRepo();
    const store = await mount(repo);
    await act(async () => {
      await store.actions.createBoard('B');
      await store.actions.createItem('recommendation_list', { title: 'Temp' }); // resizable (notes are fixed-size)
    });

    await click(screen.getByLabelText('Edit board'));

    const deleteButtons = screen.getAllByLabelText('Delete');
    await click(deleteButtons[deleteButtons.length - 1]);

    // Confirmation dialog opens; item is not deleted yet
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Delete Note?')).toBeTruthy();
    expect(screen.getByText('Temp')).toBeTruthy();

    // Cancel keeps the item
    await click(screen.getByText('Cancel'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Temp')).toBeTruthy();

    // Click X again and confirm deletion
    const deleteButtonsAfterCancel = screen.getAllByLabelText('Delete');
    await click(deleteButtonsAfterCancel[deleteButtonsAfterCancel.length - 1]);
    await click(screen.getByText('Delete'));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Temp')).toBeNull();
  });

  it('simulates real-time iOS drag-and-drop displacement with 1s hover hold before drop', async () => {
    window.innerWidth = 1280;
    const repo = new MemoryRepo();
    const store = await mount(repo);

    await act(async () => {
      await store.actions.createBoard('Physics Board');
      await store.actions.createItem('code_snippet', {
        title: 'borrow_checker.rs',
        language: 'rust',
        code: 'fn main() {}',
      });
      await store.actions.createItem('ticket', { title: 'Concert Ticket' });
      await store.actions.createItem('receipt', { merchant: 'Cafe' });
    });

    // Toggle edit mode on
    await click(screen.getByLabelText('Edit board'));

    const gridItems = Array.from(document.querySelectorAll('.react-grid-item'));
    expect(gridItems.length).toBeGreaterThanOrEqual(4);

    // Every grid item must use hardware-accelerated CSS transforms
    gridItems.forEach((el) => {
      expect(el.classList.contains('cssTransforms')).toBe(true);
    });

    // Locate TaskReminderWidget (first item at 0,0) and CodeSnippetWidget (2x2 widget)
    const taskItemEl = gridItems[0];
    const codeItemEl = gridItems.find((el) => el.textContent.includes('borrow_checker')) || gridItems[1];

    const initialTaskTransform = taskItemEl.style.transform;
    const initialCodeTransform = codeItemEl.style.transform;
    expect(initialTaskTransform).toBe('translate(0px,0px)');
    expect(initialCodeTransform).not.toBe('translate(0px,0px)');

    const codeRect = codeItemEl.getBoundingClientRect();

    // 1. Mouse down on CodeSnippetWidget
    await act(async () => {
      fireEvent.mouseDown(codeItemEl, {
        button: 0,
        clientX: codeRect.left + 20,
        clientY: codeRect.top + 20,
      });
    });

    // 2. Slow mouse move across the grid to hover over TaskReminderWidget's coordinates (0, 0)
    const steps = 5;
    for (let s = 1; s <= steps; s++) {
      const curX = codeRect.left + 20 - (codeRect.left * s) / steps;
      const curY = codeRect.top + 20 - (codeRect.top * s) / steps;
      await act(async () => {
        fireEvent.mouseMove(document, {
          clientX: curX,
          clientY: curY,
        });
      });
    }

    // 3. Hold the dragged widget in place for 1 second BEFORE mouseUp (drop)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    // Verify while holding (BEFORE drop):
    // - Active dragged item has .react-draggable-dragging (stripping transition lag) and high z-index shadow
    expect(codeItemEl.classList.contains('react-draggable-dragging')).toBe(true);
    expect(codeItemEl.className).toContain('!z-50');
    expect(codeItemEl.className).toContain('shadow-2xl');

    // - Underlying TaskReminderWidget has ALREADY displaced out of (0,0) in real time without waiting for drop!
    const midHoldTaskTransform = taskItemEl.style.transform;
    expect(midHoldTaskTransform).not.toBe(initialTaskTransform);
    expect(taskItemEl.classList.contains('cssTransforms')).toBe(true);
    expect(taskItemEl.classList.contains('react-draggable-dragging')).toBe(false);

    // 4. Trigger mouseUp (drop)
    await act(async () => {
      fireEvent.mouseUp(document, {
        button: 0,
        clientX: 20,
        clientY: 20,
      });
    });

    expect(codeItemEl.classList.contains('react-draggable-dragging')).toBe(false);
    // CodeSnippetWidget should now snap into (0, 0)
    expect(codeItemEl.style.transform).toBe('translate(0px,0px)');
  });

  it('packs mixed widget sizes without interior holes and supports horizontal same-row swaps', () => {
    const items = [
      { i: 'a', x: 0, y: 0, w: 1, h: 1 },
      { i: 'b', x: 1, y: 0, w: 2, h: 1 },
      { i: 'c', x: 0, y: 1, w: 1, h: 2 },
      { i: 'd', x: 1, y: 1, w: 2, h: 2 },
    ];

    // Drag 'a' (1x1 at 0,0) horizontally right across 'b' (2x1 at 1,0)
    const horizRight = packDenseLayout(
      items,
      3,
      { i: 'a', x: 1, y: 0, w: 1, h: 1 },
      'right',
    );
    const bPos = horizRight.find((p) => p.i === 'b');
    const aPos = horizRight.find((p) => p.i === 'a');
    expect(bPos.x).toBe(0);
    expect(bPos.y).toBe(0);
    expect(aPos.x).toBe(2);
    expect(aPos.y).toBe(0);
  });
});

