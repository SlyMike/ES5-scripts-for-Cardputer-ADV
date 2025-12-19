
# Bruce Firmware JS Interpreter Limitations

## Language Support
- ES5 only; no ES6+ features.
- `var` only; no `let` or `const`.
- No arrow functions, classes, template literals.
- No Promises, async/await, or modern APIs.

## Syntax Sensitivity
- Missing semicolons can cause parse errors.
- Inline arithmetic in function calls may fail; precompute values.
- Avoid nested block comments; use `//` for comments.
- No top-level try/catch.

## Structure Constraints
- Single file per app.
- Avoid deeply nested logic; keep top-level simple.
- Functions must be fully terminated; no dangling braces.

## Timing & Loops
- No `setTimeout`/`setInterval`; use `now()` + `delay(ms)`.
- Poll keyboard every loop; avoid blocking operations.

## Display API Quirks
- Some functions may not exist (e.g., `setTextSize`); guard calls.
- `drawString` vs `print`: check availability and fallback.

## GPIO Handling
- Pin operations must be non-blocking.
- Changing pins mid-pulse can crash or misfire.

## Error Reporting
- Parse errors often report misleading line numbers.
- Common causes: unbalanced braces, duplicate functions, unfinished statements.

## Memory
- Limited heap; avoid large arrays or closures.
- Minimise string concatenation in hot paths- Minimise string concatenation in hot paths.

## Testing Tips
- Always run a brace/duplicate audit before upload.
