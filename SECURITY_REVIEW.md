## Notes / considerations (not critical, worth knowing)

- **`secure: false` in all proxy handlers** (`iipHandler.js`, `mctileHandler.js`,
  `proxyHandler.js`) skips upstream TLS certificate validation. Currently a
  no-op in practice since every configured target is a plain `http://`
  internal Docker service name, not `https://` -- revisit if that ever
  changes.
- **CSP allows `'unsafe-inline'`/`'unsafe-eval'`** in `scriptSrc`
  (`contentSecurityPolicy.json`), which weakens the XSS mitigation value of
  the CSP header caracal emits.
- **No rate limiting or request body size limit** anywhere in the stack --
  the raw-body-capture middleware in `caracal.js` concatenates chunks with no
  maximum length.
- **`npm audit` still flags Express's transitive deps** (`body-parser`,
  `cookie`, `path-to-regexp`, `qs`, `send`, `serve-static`) and `uuid` --
  pre-existing, not touched in this pass since an Express major-version bump
  is a much larger, separate undertaking.
