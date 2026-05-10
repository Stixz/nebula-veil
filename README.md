# Nebula Veil

Nebula Veil is a compact Electron productivity suite with a soft cosmic shell. It includes notes, tasks, a calendar, a focus timer, system stats, a calculator, and ambient focus audio.

## Getting Started

```bash
npm install
npm start
```

## Scripts

- `npm start` launches the Electron app for local development.
- `npm run check` validates JavaScript syntax across the app and modules.
- `npm run build` packages a Windows installer with `electron-builder`.

## Project Layout

- `main.js` owns the Electron window, tray, and native IPC handlers.
- `preload.js` exposes the safe renderer bridge.
- `renderer.js` handles navigation, theme state, and module loading.
- `modules/` contains feature-specific HTML and JavaScript.
- `style.css` contains the app shell and module styling.

## Notes

User data is currently stored in `localStorage`. That keeps the app lightweight while the feature set is still taking shape, but future work should move durable data into an app data file or small embedded store.

## License

Released under the MIT License.
