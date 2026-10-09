# Corresponding source for the distributed Stockfish.js binaries

This repository distributes two unmodified files:

- `public/stockfish/stockfish-19-lite-single.js`
- `public/stockfish/stockfish-19-lite-single.wasm`

They are the lite, single-threaded Stockfish.js 19 engine. They match the files of the same names in the npm package `stockfish@19.0.0` (`node_modules/stockfish/bin/`). This repository does not modify or rebuild them.

The published npm package does not contain the engine source. Its `files` list is only `bin/` and `scripts/postinstall.js`.

The corresponding source for these binaries is the Stockfish.js git tag `v19.0.0`:

- Source tree: <https://github.com/nmrugg/stockfish.js/tree/v19.0.0>
- Source archive: <https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.0.tar.gz>

That tag contains `build.js` and the Stockfish engine sources under `src/`, including `src/Makefile`. The v19.0.0 release notes identify the upstream Stockfish revision as `edb0d9db6731067ec50ce619ff372b463bc4dd5d` and the lite-engine changes as the `sscg13` branch compared through `f5e5c633dd0c9c0efd1d1266f441ea5929b043c1`.

The lite network named in the distributed worker header is `nn-61e7af4bb97d`:

<https://tests.stockfishchess.org/nns?network_name=nn-61e7af4bb97d>

To rebuild this variant from that tag, install Emscripten `3.1.7` and run:

```bash
node build.js --single-threaded --lite -f
```

That is the `build-single-lite` script in the tagged `package.json`. It produces `stockfish-19-lite-single.js` and `stockfish-19-lite-single.wasm`.

The source archive is available at no charge from the same public location as the tag above, for as long as that tag is published. The GPLv3 terms are in `stockfish-GPL-3.0.txt` beside this file.
