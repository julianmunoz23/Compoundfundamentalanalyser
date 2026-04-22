18:40:44.961 Running build in Washington, D.C., USA (East) – iad1
18:40:44.962 Build machine configuration: 2 cores, 8 GB
18:40:45.082 Cloning github.com/julianmunoz23/Compoundfundamentalanalyser (Branch: main, Commit: 13ed6d7)
18:40:45.541 Cloning completed: 459.000ms
18:40:45.637 Restored build cache from previous deployment (H7UZV9aUQj9c4AVueZQa5wGai1ZC)
18:40:46.008 Running "vercel build"
18:40:46.724 Vercel CLI 51.6.1
18:40:48.223 Installing dependencies...
18:40:53.561 
18:40:53.562 up to date in 4s
18:40:53.563 
18:40:53.563 7 packages are looking for funding
18:40:53.563   run `npm fund` for details
18:40:53.599 Running "npm run build"
18:40:53.707 
18:40:53.707 > compounder-analyzer@1.0.0 build
18:40:53.708 > vite build
18:40:53.708 
18:40:54.022 [36mvite v5.4.21 [32mbuilding for production...[36m[39m
18:40:54.078 transforming...
18:40:54.252 [32m✓[39m 6 modules transformed.
18:40:54.254 [31mx[39m Build failed in 205ms
18:40:54.254 [31merror during build:
18:40:54.254 [31m[vite:esbuild] Transform failed with 1 error:
18:40:54.254 /vercel/path0/compounder-analyzer/src/App.jsx:5045:5: ERROR: Expected "finally" but found ";"[31m
18:40:54.255 file: [36m/vercel/path0/compounder-analyzer/src/App.jsx:5045:5[31m
18:40:54.255 [33m
18:40:54.255 [33mExpected "finally" but found ";"[33m
18:40:54.255 5043|        // Show preview instead of importing directly
18:40:54.255 5044|        setPreviewData({parsed,skipped,broker});
18:40:54.255 5045|      };
18:40:54.255    |       ^
18:40:54.255 5046|      reader.readAsText(file);
18:40:54.255 5047|    };
18:40:54.256 [31m
18:40:54.256     at failureErrorWithLog (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:1472:15)
18:40:54.256     at /vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:755:50
18:40:54.257     at responseCallbacks.<computed> (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:622:9)
18:40:54.257     at handleIncomingPacket (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:677:12)
18:40:54.258     at Socket.readFromStdout (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:600:7)
18:40:54.258     at Socket.emit (node:events:508:28)
18:40:54.258     at addChunk (node:internal/streams/readable:563:12)
18:40:54.258     at readableAddChunkPushByteMode (node:internal/streams/readable:514:3)
18:40:54.258     at Readable.push (node:internal/streams/readable:394:5)
18:40:54.258     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
18:40:54.275 Error: Command "npm run build" exited with 1
