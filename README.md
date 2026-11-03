# sca-7317-npm-devengines-mismatch-reachability

Regression probe for **SCA-7317** (customer case TKA-11013).

`package.json` declares `devEngines.runtime` Node `99.0.0` with `onFail: "error"`, which never
matches the scanner image's Node. Since npm 11 every npm command run inside the project enforces
`devEngines`, so before the fix every `npm view <dep>` in JS reachability enrichment exited 1 with
`EBADDEVENGINES` and enrichment aborted (`Enrichment aborted after 8 failed downloads`).

Fixed in reachability-core 26.9.2.0 (`npm view ... --force`). Expected: reachability results are
produced; no `npm view failed` / `Enrichment aborted` in the scanner log. The app code and
dependencies are copied from `VulnerableExpress`; `package-lock.json` is lockfile v3.
