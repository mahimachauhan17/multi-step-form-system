# Multi-Step Form

A 4-step form built with plain HTML, CSS, and JavaScript — no build tools or frameworks required.

**Live demo:** _(add your GitHub Pages link here after deploying)_

## Features

- **3+ steps with navigation**
  - Personal Info → Address → Account Setup → Review & Submit
  - "Next" / "Back" buttons
  - Clickable step indicator — jump back to any step you've already completed
- **Validation & error handling**
  - Required-field checks, email format, phone length, password strength (8+ chars, 1 number), password-match check
  - Inline error messages appear under each field, both on blur/typing and when trying to advance
  - A step cannot be left until all of its fields are valid
- **Data persistence (no data loss on refresh)**
  - Every keystroke is saved to `localStorage`
  - Reloading the page restores all entered values and the step you were on
  - Passwords are intentionally **not** persisted to `localStorage` for basic security hygiene — you'll need to re-enter them after a refresh
  - Storage is cleared automatically after a successful submit

## Project structure

```
multistep-form/
├── index.html   # markup for all 4 steps + step indicator
├── style.css    # styling, responsive layout
├── script.js    # navigation, validation, localStorage logic
└── README.md
```

## Running it locally

No build step needed. Either:

1. Open `index.html` directly in a browser, **or**
2. Serve it locally (recommended, avoids any `file://` quirks):
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.

## How it works (brief)

- `STEP_FIELDS` maps each step number to the field names that belong to it.
- `validators` holds one validation function per field name; each returns an error string or `""`.
- `validateStep()` runs all validators for the current step and renders errors via `showError()`.
- `saveToStorage()` / `loadFromStorage()` serialize all form values (plus the current step) to `localStorage` under the key `multiStepFormData`, and restore them on page load.
- The step indicator (`#stepper`) is clickable for any step `<= highestStepReached`, so users can revisit and edit earlier steps without losing progress.

## Possible extensions

- Wire `form`'s submit handler to an actual API endpoint (`fetch`)
- Add a "save draft" indicator / debounce the localStorage writes
- Convert to React/Vue if you want component-based state instead of vanilla JS
