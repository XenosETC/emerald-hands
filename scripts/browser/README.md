# Arcade browser regression tests

Install the pinned dependencies and Chromium, then run the suite from the repository root.

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

On Linux CI, use `npx playwright install --with-deps chromium` if the runner needs browser system libraries. The suite starts its own loopback-only arcade server on port 4187 and shuts it down on exit. Set `ARCADE_BROWSER_TEST_PORT` to another port if needed. Each test has fresh browser storage. The suite does not use the open localhost arcade or a production service.

Run a single test file with `npm run test:browser -- scripts/browser/tabletop.spec.cjs`. To use an already installed Google Chrome instead of downloading the bundled browser, set `ARCADE_BROWSER_TEST_CHANNEL=chrome` for the test command.

`npm test` still runs the browser-free smoke and simulation tests. The browser suite checks the interaction regressions in Chromium, including emulated phone viewports. Physical-device testing remains separate.

The Arcade checks workflow runs both suites for pull requests targeting `master` and for pushes to `master`. Its browser tests use the same dedicated loopback server.
