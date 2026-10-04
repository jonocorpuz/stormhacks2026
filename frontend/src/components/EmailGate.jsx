import React, { useState } from 'react';
import { INPUT_CLASS } from './blocks/styles';

// Sign-in screen. No auth: the email alone picks the profile whose boards load.
// Password is decorative — never read, stored or sent.
export default function EmailGate({ onSubmit }) {
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+$/.test(email.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valid) onSubmit(email.trim().toLowerCase());
  };

  return (
    <div className="min-h-screen w-full bg-canvas dot-grid font-sans">
      <div className="w-full max-w-md mx-auto pt-40 px-8">
        <form onSubmit={handleSubmit} className="apple-glass rounded-card p-8 shadow-2xl flex flex-col space-y-5">
          <h2 className="text-ink font-bold text-xl">Sign in</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            autoFocus
            className={`${INPUT_CLASS} px-4 h-10 rounded-full`}
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            className={`${INPUT_CLASS} px-4 h-10 rounded-full`}
          />
          <button
            type="submit"
            disabled={!valid}
            className="w-full py-2.5 bg-primary/90 backdrop-blur-md border border-primary/50 text-white rounded-full hover:bg-primary-strong/90 text-sm font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
