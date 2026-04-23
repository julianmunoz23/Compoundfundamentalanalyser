15:01:45.453 Running build in Washington, D.C., USA (East) – iad1
15:01:45.454 Build machine configuration: 2 cores, 8 GB
15:01:45.593 Cloning github.com/julianmunoz23/Compoundfundamentalanalyser (Branch: main, Commit: 062da7a)
15:01:46.413 Cloning completed: 819.000ms
15:01:46.507 Restored build cache from previous deployment (FHHsSXqTz1wVcTmtZbRrmMJc1Ke5)
15:01:46.694 Running "vercel build"
15:01:47.406 Vercel CLI 51.2.1
15:01:48.211 Installing dependencies...
15:01:53.608 
15:01:53.609 up to date in 5s
15:01:53.609 
15:01:53.609 7 packages are looking for funding
15:01:53.610   run `npm fund` for details
15:01:53.642 Running "npm run build"
15:01:53.747 
15:01:53.747 > compounder-analyzer@1.0.0 build
15:01:53.748 > vite build
15:01:53.748 
15:01:53.989 [36mvite v5.4.21 [32mbuilding for production...[36m[39m
15:01:54.052 transforming...
15:01:54.156 [32m✓[39m 4 modules transformed.
15:01:54.158 [31mx[39m Build failed in 141ms
15:01:54.158 [31merror during build:
15:01:54.158 [31m[vite:esbuild] Transform failed with 1 error:
15:01:54.159 /vercel/path0/compounder-analyzer/src/App.jsx:4824:0: ERROR: Unexpected end of file[31m
15:01:54.159 file: [36m/vercel/path0/compounder-analyzer/src/App.jsx:4824:0[31m
15:01:54.159 [33m
15:01:54.159 [33mUnexpected end of file[33m
15:01:54.159 4822|    {id:"portfolio",es:"Mi Portafolio",en:"My Portfolio",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>},
15:01:54.160 4823|    {id:"strategy",es:"Mi Estrategia",en:"My Strategy",icon:<svg width="14
15:01:54.160 4824|  
15:01:54.160    |  ^
15:01:54.160 [31m
15:01:54.160     at failureErrorWithLog (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:1472:15)
15:01:54.160     at /vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:755:50
15:01:54.160     at responseCallbacks.<computed> (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:622:9)
15:01:54.160     at handleIncomingPacket (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:677:12)
15:01:54.161     at Socket.readFromStdout (/vercel/path0/compounder-analyzer/node_modules/esbuild/lib/main.js:600:7)
15:01:54.161     at Socket.emit (node:events:508:28)
15:01:54.161     at addChunk (node:internal/streams/readable:563:12)
15:01:54.161     at readableAddChunkPushByteMode (node:internal/streams/readable:514:3)
15:01:54.161     at Readable.push (node:internal/streams/readable:394:5)
15:01:54.161     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
15:01:54.177 Error: Command "npm run build" exited with 1
