// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import EmailGate from './EmailGate';

afterEach(cleanup);

it('submits the normalized email, never the password', () => {
  const onSubmit = vi.fn();
  render(<EmailGate onSubmit={onSubmit} />);
  const submit = screen.getByRole('button', { name: 'Continue' });
  expect(submit.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' Ben@X.com ' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
  fireEvent.click(submit);
  expect(onSubmit).toHaveBeenCalledWith('ben@x.com');
});
