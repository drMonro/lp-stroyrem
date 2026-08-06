# Project workflow

This is a static landing page built with Rsbuild. Keep changes small and preserve the existing Nunjucks, plain JavaScript, PostCSS, BEM, and PHP form-handler architecture.

## Source of truth

- Edit files under `src/`; never edit generated files under `build/`.
- `src/templates/pages/` contains page entries and `src/templates/` contains shared layouts and partials.
- `src/rsbuild/app.js` is the browser bundle entry. It imports `src/css/main.pcss` and `src/js/common.js`.
- `scripts/site-build.mjs` owns non-bundled assets: Nunjucks rendering, responsive image generation, the SVG sprite, sitemap, static copies, and the local PHP process.
- Keep secrets out of output and conversation. Do not print `.env` values.

## Commands

- Use npm for dependency management and scripts. Commit `package-lock.json` whenever dependencies change.
- `npm run dev` starts Rsbuild on `192.168.0.2:3001` and PHP on `localhost:3000` for `/mail.php`.
- `npm run build` creates the production site in `build/`.
- `npm run lint` runs ESLint and Stylelint.
- `npm run clean` removes generated output.
- `npm run mock-data` refreshes `src/data/products-mock.json` from the configured catalog.
- `npm run build:analyze` enables Rsdoctor. Start it manually before asking the Rsdoctor MCP server to inspect the build.

## Implementation rules

- Keep PostCSS sources as `.pcss` files; `$mobile`, `$tablet`, and `$desktop` are processed by `postcss-simple-vars`.
- Preserve public URLs such as `/css/main.css`, `/js/scripts.js`, `/media/images/*`, and `/media/sprite/sprite.svg`.
- Keep development and production template branches aligned with the filenames emitted by Rsbuild.
- Use the MDN MCP server for current HTML, CSS, browser API, accessibility, and compatibility claims.
- Use the Rsdoctor MCP server only after an Rsdoctor-enabled build is running; it reads local analysis data and does not start the build itself.
- Verify build-pipeline changes with `npm run build` and targeted linting. Do not treat generated `build/` changes as source changes.
