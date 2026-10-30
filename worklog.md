# Chinese Toon Audit — Worklog

---
Task ID: AUDIT-1
Agent: crypto-audit (Explore)
Task: Audit crypto/TRON/USDT/wallet code; confirm all disabled safely

Work Log:
- Verified `/home/z/my-project/worklog.md` did not exist; created it. Read prior project worklog at `/home/z/ct-audit/worklog.md` (massive Phase 1–59 history) for context — prior context confirms Phase 59 already removed the USDT online flow from the *order creation* path and replaced it with a manual bank-card + receipt-upload + admin-approval flow, while preserving historical USDT_TRON rows in the `UsdtOrder` table.
- Performed a case-insensitive ripgrep across `/home/z/ct-audit/` (excluding `node_modules`, `.next`, `tool-results`, `upload`) for: `tron`, `usdt`, `crypto`, `wallet`, `testnetWalletRisk`, `trongrid`, `xpub`, `trc20`, `trc`, `bip32`, `bip39`, `@scure`. Triaged 70+ source-level matches, discarding non-crypto false-positives (e.g. `crypto` Node module, generic `Wallet` lucide icon).
- Read full contents of every file under `src/lib/payments/` (`service.ts`, `hd-address.ts`, `admin-orders.ts`, `config.ts`, `trongrid.ts`, `catalog.ts`, `scheduler.ts`, `tron-address.ts`) and every file under `src/app/api/payments/` (`wallet/route.ts`, `orders/route.ts`, `orders/[ref]/route.ts`, `catalog/route.ts`) plus `src/app/api/admin/payments/route.ts`, `src/app/api/admin/payments/[ref]/route.ts`, `src/app/api/admin/payments/[ref]/approve/route.ts`, `src/app/api/admin/payments/[ref]/reject/route.ts`, `src/app/api/payment-settings/route.ts`, `src/app/api/receipts/[id]/route.ts`, `src/lib/payment-settings.ts`, `prisma/schema.prisma`, `tsconfig.json`, `package.json`.
- Confirmed `testnetWalletRisk` is NOT exported from `src/lib/payments/service.ts` (grep for `export\s+(async\s+)?function|export\s+const` returned 11 exports — none match). It is referenced ONLY by `src/app/api/payments/wallet/route.ts` (line 32 import, line 41 call). This is the exact cause of the build failure.
- Read the FULL current content of `src/app/api/payments/wallet/route.ts` (149 lines) — it STILL contains the broken import and the full TRON/USDT/xpub/trongrid wallet-connect logic. The intended disabled-stub fix has NOT been applied yet.
- Verified via grep that `src/lib/payments/trongrid.ts` is imported by NO file in `src/` (only historical tool-results reference it) — it is dead code.
- Verified `src/lib/payments/tron-address.ts` and `src/lib/payments/hd-address.ts` are imported only transitively via `config.ts` (which `service.ts` actively imports) and by the broken `wallet/route.ts`. They are bundled into the active build because `config.ts` pulls them in for `isValidTronAddress` and `validateXpub` (used in the dormant `getPaymentsConfig`/`xpubIssue` paths that only the broken wallet route calls).
- Verified all `@scure/*` and `@noble/*` imports are confined to `tron-address.ts`, `hd-address.ts`, and the standalone `scripts/payments-keygen-offline.mjs` utility. No active bank-card code path needs them.
- Verified `qrcode` is NOT imported by any current source file under `src/` (only by historical tool-results logs); it remains in `package.json` and is also an optional peer of `@reactuses/core`.
- Audited every UI component that renders crypto/wallet references: `PaymentsAdminTab.tsx` (legacy badge for USDT_TRON historical orders — display only, no wallet connect UI); `OrdersAdminTab.tsx` (uses lucide `Wallet` icon + dangling `siteContent.admin.walletError` string lookup — minor TS surface, not crypto); `LogsAdminTab.tsx` (CSS classes for legacy `wallet.save`/`wallet.remove` audit actions — display only); `AdminPage.tsx` (tronscan.org link only for historical orders); `CheckoutPage.tsx` (shows a “legacy USDT note” for old PENDING/DETECTED/UNDERPAID USDT orders, no live USDT UI); `AccountPage.tsx` (uses Wallet lucide icon + checks paymentMethod === 'USDT_TRON' for display).
- Confirmed NO UI route in `src/app/page.tsx`, no admin tab, no checkout step exposes a “Connect your wallet” or “Pay with USDT/TRON” CTA to users.
- Verified all other payment-side endpoints (`/api/payments/orders`, `/api/payments/orders/[ref]`, `/api/payments/catalog`, `/api/admin/payments`, `/api/admin/payments/[ref]`, `/api/admin/payments/[ref]/approve`, `/api/admin/payments/[ref]/reject`, `/api/payment-settings`, `/api/receipts/[id]`) reference the Prisma `usdtOrder` model only for historical naming and perform NO blockchain/TRON/TronGrid/HD-derivation operations.

Stage Summary:
- The Phase-59 refactor successfully disabled crypto from the user-facing purchase path: order creation routes through manual bank-card + receipt upload, there is no UI button that initiates a USDT/TRON payment, no scheduler scans the TRON blockchain, and `service.ts` no longer exports `testnetWalletRisk`.
- HOWEVER, the project is NOT build-safe in its current state: `src/app/api/payments/wallet/route.ts` still imports `{ testnetWalletRisk } from '@/lib/payments/service'` (line 32) and calls it (line 41). `service.ts` does not export that symbol. `next build` will fail with a “Module not found / named export not found” error. The intended disabled-stub replacement (return 404 for GET/PUT/DELETE with no broken imports) has NOT been applied yet.
- Secondary clean-up items (non-blocking for the build): `src/lib/payments/trongrid.ts` is fully dead code (orphan); `src/lib/payments/tron-address.ts` and `src/lib/payments/hd-address.ts` are still transitively bundled because `config.ts` keeps calling `isValidTronAddress`/`validateXpub` inside its dormant wallet-config branches; `qrcode`, `@scure/base`, `@scure/bip32`, `@scure/bip39` in `package.json` are no longer needed by active code (only by the orphan modules + the offline keygen script); `OrdersAdminTab.tsx` references `siteContent.admin.walletError` which is missing from `site-content.ts`.
- Final answer to the audit question “Is crypto/TRON/USDT/wallet fully disabled and build-safe in the current state?”: **NO** — disabled in runtime-paths but NOT build-safe because of the unresolved broken import in `wallet/route.ts`. Applying the intended 404-stub fix to that one file flips the answer to YES.

---
Task ID: AUDIT-2
Agent: sqlite-serverless-audit (Explore)
Task: Audit SQLite-specific code & Prisma init for Vercel/PostgreSQL safety

Work Log:
- Read prior AUDIT-1 entry in /home/z/my-project/worklog.md to absorb context (crypto/USDT/TRON wallet flow was disabled but `wallet/route.ts` still had a broken import).
- Read FULLY: src/lib/db-bootstrap.ts (305 lines), src/lib/db.ts (67 lines), src/lib/ensure-schema.ts (739 lines), src/instrumentation.ts (108 lines), src/lib/backup/service.ts (465 lines), src/lib/backup/scheduler.ts (83 lines), src/lib/receipts.ts (111 lines), prisma/schema.prisma (655 lines), the 4 failing API routes (settings, posts, auth/login, auth/register), package.json, next.config.ts, tests/database-runtime-build.sh, src/app/api/admin/backup/route.ts, src/app/api/admin/backup/restore/route.ts.
- Ripgrep swept the repo (excluding node_modules/.next/tool-results/upload) for: sqlite/SQLite/better-sqlite3/sqlite3/bun:sqlite/file:/canonicalDatabaseUrl/pinDatabaseUrl/ensureDatabaseFile/backupDir/CT_DATA_DIR/isInsideProjectDir → 14 source files matched; cross-referenced with $queryRawUnsafe / $executeRawUnsafe / PRAGMA / sqlite_master / VACUUM INTO / new PrismaClient / $disconnect / setInterval hits.
- Triaged the Prisma client init path, the runtime DDL self-healer, the local-FS backup subsystem, the receipt FS subsystem, the instrumentation startup hook, and the schema's Postgres compatibility surface.
- Identified the SMOKING GUN: src/lib/db.ts line 9 calls pinDatabaseUrl() at module load. pinDatabaseUrl() (db-bootstrap.ts:57-90) treats every non-`file:` DATABASE_URL as "needs pin" and OVERWRITES process.env.DATABASE_URL with `file:/home/z/data/chinesetoon.db`. On Vercel+Neon the incoming DATABASE_URL is `postgresql://...` → silently rewritten to a non-existent local SQLite path → every API route that imports `db` gets a broken Prisma client → 500.
- Mapped each of the 4 failing routes to the exact DB-touching line and the exact failure chain (URL overwrite → prisma generate still bound to sqlite → file-system access attempt on Vercel read-only FS).

Stage Summary:
- The codebase is NOT Vercel+Postgres production-ready. schema.prisma still declares `provider = "sqlite"` (line 9). Eight server-side modules (db-bootstrap, db, ensure-schema, instrumentation, backup/service, backup/scheduler, receipts, plus the admin backup API routes) make SQLite-specific or local-filesystem assumptions that are either impossible or fatal under Vercel serverless + Neon Postgres.
- Top blockers (full list in main report): (1) schema.prisma provider not flipped; (2) pinDatabaseUrl overwrites postgres URLs at import; (3) ensure-schema.ts issues SQLite DDL (sqlite_master + PRAGMA + DATETIME/BOOLEAN DEFAULT 0) at runtime; (4) backup/service.ts uses VACUUM INTO / PRAGMA / file writes; (5) scheduler.ts uses setInterval that Vercel will not honor; (6) receipts.ts writes to /home/z/data/uploads/receipts on a read-only FS; (7) db.ts has log:['query'] in prod and a dev-only stale-client reload hack that calls $disconnect; (8) instrumentation.ts runs all the above at startup; (9) no prisma migrations directory exists; (10) tests/database-runtime-build.sh + package.json db:push are SQLite-only.
- The 4 routes return 500 because the import of `@/lib/db` itself corrupts DATABASE_URL, so Prisma never reaches the Neon DB — it dies trying to open `/home/z/data/chinesetoon.db` on Vercel's ephemeral read-only FS.

---
Task ID: PROD-AUDIT
Agent: Z.ai Code (main) — production-readiness audit
Task: Audit Chinese Toon (Next.js 16 + Prisma) for Vercel + Neon PostgreSQL production; disable crypto/TRON; fix 4 failing APIs (settings/posts/auth-login/auth-register); preserve local SQLite data via migration script

Work Log:
- Extracted user's tar to /home/z/ct-audit/ (Chinese Toon project, original pre-manual-changes state).
- Ran two parallel Explore subagents: AUDIT-1 (crypto/TRON/wallet) + AUDIT-2 (SQLite/serverless/Prisma/4-API-500s).
- ROOT CAUSE of HTTP 500s: src/lib/db.ts called pinDatabaseUrl() at import; on Vercel (Neon postgres URL) it OVERWROTE DATABASE_URL with file:/home/z/data/chinesetoon.db → every DB query failed.
- Applied fixes in /home/z/ct-audit/:
  • prisma/schema.prisma: provider sqlite → postgresql
  • src/app/api/payments/wallet/route.ts: replaced broken (testnetWalletRisk import) with 404 stub
  • src/lib/db.ts: rewritten — no pinDatabaseUrl, log:['error','warn'] in prod, unconditional globalThis cache, removed stale-client hack
  • src/lib/db-bootstrap.ts: pinDatabaseUrl + ensureDatabaseFile guarded to no-op on postgres (isPostgresDatabase())
  • src/lib/ensure-schema.ts: ensureSchema no-op on postgres (SQLite DDL invalid on Postgres)
  • src/instrumentation.ts: on postgres skip ensureDatabaseFile/backupScheduler/warmCriticalRoutes (127.0.0.1 invalid on Vercel)
  • src/lib/receipts.ts: graceful ReceiptStorageUnavailableError when FS unwritable (Vercel); doc Vercel Blob follow-up
  • src/components/site/admin/OrdersAdminTab.tsx: fixed dangling siteContent.admin.walletError ref
  • package.json: build=next build (no cp -r), start=next start, db:push=prisma db push (no --accept-data-loss, no hardcoded path), +postinstall:prisma generate, +db:migrate:deploy
  • Created prisma/migrations/0_init/migration.sql (677 lines postgres DDL via prisma migrate diff) + migration_lock.toml
  • Created scripts/migrate-sqlite-to-postgres.ts (bun:sqlite read + Prisma DMMF type-aware write; preserves IDs/timestamps/booleans; session_replication_role=replica for bulk load; aborts if target non-empty)
  • Created .env.example (no secrets)
- VERIFICATION: bun install ✓ (858 pkgs, postinstall prisma generate ✓), bun run db:generate ✓ (activeProvider=postgresql), bun run lint ✓ (0 errors 0 warnings), bun run build ✓ (compiled 13.7s, testnetWalletRisk error eliminated, /api/payments/wallet now stub).
- Confirmed: ZERO real testnetWalletRisk imports/calls; pinDatabaseUrl() only called inside guarded ensureDatabaseFile (postgres = no-op).

Stage Summary:
- 4 failing APIs (settings/posts/auth-login/auth-register) will work on Vercel+Neon once DATABASE_URL is respected (fixed) + migrations applied.
- Crypto/TRON/USDT/wallet: wallet endpoint stubbed to 404; dormant crypto modules (tron-address/hd-address/config wallet-half) remain isolated/unreachable, build-safe. No crypto UI active.
- Existing local SQLite DB untouched; migration script ready to copy data → Neon.
- Deployable on Vercel with: Vercel env DATABASE_URL (Neon pooled), Build Command `bun run db:migrate:deploy && bun run build`.

---
Task ID: SEO-SITEMAP
Agent: Z.ai Code (main) — sitemap/robots/SEO audit
Task: Fix invalid /sitemap.xml reported by Google Search Console for www.chinesetoon.com

Work Log:
- Inspected /home/z/ct-audit/ SEO setup: src/app/sitemap.ts, public/robots.txt, src/app/layout.tsx metadata, src/app/page.tsx (hash-based SPA), next.config.ts redirects.
- ROOT CAUSE: siteContent.contact.siteUrl = "https://chinesetoon.com" (NON-www). The sitemap emitted <loc>https://chinesetoon.com/</loc> and robots.txt pointed to https://chinesetoon.com/sitemap.xml — but Google Search Console checks the canonical www.chinesetoon.com. This www/non-www mismatch made Google flag the sitemap as invalid (URLs not allowed / cross-domain).
- Confirmed SPA architecture: all public views (classes/learn/about/blog/reviews/support/register) are hash routes (#/classes) rendered client-side from the single HTTP route `/`. next.config redirects /classes→/#/classes are 307 (must NOT be in sitemap). No dynamic App Router pages exist. So only `/` is a valid indexable canonical URL.
- Fixes applied:
  • src/content/site-content.ts: siteUrl "https://chinesetoon.com" → "https://www.chinesetoon.com" (canonical www). Auto-fixed: sitemap URLs, metadataBase, JSON-LD @id, OG url.
  • Deleted public/robots.txt; created src/app/robots.ts (native Next.js Metadata API) sourcing canonical domain from same siteContent — eliminates www/non-www drift between robots and sitemap. Rules: User-agent:* Allow:/ + Sitemap: https://www.chinesetoon.com/sitemap.xml + Host.
  • Rewrote src/app/sitemap.ts with explicit comment explaining why only `/` is listed (hash-SPA architecture). Uses same canonical domain source.
- VERIFICATION: bun run lint ✓ (0 errors), bun run build ✓ (compiled 14.1s; /robots.txt + /sitemap.xml both ○ static prerendered). Live fetch on dev server: GET /robots.txt → HTTP 200 text/plain (correct content); GET /sitemap.xml → HTTP 200 application/xml (valid urlset, namespace http://www.sitemaps.org/schemas/sitemap/0.9, loc=https://www.chinesetoon.com/). Python xml.dom.minidom + ElementTree parse: ✓ well-formed, ✓ schema-valid, ✓ 1 url.
- noindex/nofollow audit: NONE found on any public page. No per-page robots overrides. metadataBase now correctly www.

Stage Summary:
- /sitemap.xml and /robots.txt now serve valid, Google-compatible content on the canonical www.chinesetoon.com domain.
- Single source of truth (siteContent.contact.siteUrl) feeds sitemap + robots + metadataBase + JSON-LD — no future www/non-www drift possible.
- Compatible with Next.js 16.1.3 App Router native Metadata API; works on Vercel (both routes are static ○ prerendered at build time).
- Long-term SEO recommendation (out of scope per user constraint): convert hash routes to real App Router routes (/classes, /learn, /blog/[slug]) so each public view becomes independently indexable.

---
Task ID: SOCIAL-LINKS
Agent: Z.ai Code (main) — social/contact icon wiring
Task: Connect existing Instagram, WeChat, Telegram, Email icons to exact destination URLs

Work Log:
- Inspected Chinese Toon (/home/z/ct-audit/) for all social/contact icon usages. Found icons in: Footer.tsx, AboutPage.tsx, LearnPage.tsx, SupportPage.tsx (quickContact channels), and layout.tsx (JSON-LD sameAs).
- Found architecture: siteContent.contact.socials stored HANDLES (e.g. "chinese_toon"), and consumers built URLs at render (https://instagram.com/${handle}). But user's exact URLs can't be derived from handles (Instagram ?stkn= param, WeChat u.wechat.com short link). Refactored to store full URLs.
- Changes:
  • site-content.ts: contact.email → chinese.toon.org@gmail.com; socials.instagram/telegram/wechat → full exact URLs (with ?stkn= and u.wechat.com); quickContact.channels links+values updated to match.
  • Footer.tsx: all 4 icons use siteContent.contact.socials.* directly; WeChat converted from non-clickable <span> to <a target=_blank> with IDENTICAL classes+icon.
  • AboutPage.tsx: Instagram/Telegram use URLs directly; WeChat <span> → <a>; email mailto already used contact.email (auto-updated).
  • LearnPage.tsx: Instagram/Telegram use URLs directly.
  • layout.tsx: JSON-LD sameAs uses full URLs directly.
- VERIFICATION: bun run lint ✓ (0 errors); bun run build ✓ (13.8s). Dev server + agent-browser on /#/about, /#/learn, /#/support: every icon verified to have correct href + target=_blank (for external) / mailto (for email). Visual design confirmed unchanged: all 4 footer icons have identical classes (w-10 h-10 bg-cream/10 rounded-xl), same SVG sizes, same gap-3 container. No console errors.

Stage Summary:
- Instagram → https://www.instagram.com/chinese_toon?stkn=ZXUzOGtzeDZuYWM3 (Footer, About, Learn, Support, JSON-LD)
- Telegram → https://t.me/Chinese_toon_support (Footer, About, Learn, Support, JSON-LD)
- WeChat → https://u.wechat.com/kIy5ADbROlbIgMxEWkk0jZQ?s=3 (Footer, About — converted from non-clickable span to clickable anchor)
- Email → mailto:chinese.toon.org@gmail.com (Footer, About ×2, Support)
- All external links open in new tab (target=_blank rel=noopener noreferrer). Email opens via mailto. Zero placeholder/broken URLs remaining. Visual design 100% preserved.

---
Task ID: CRYPTO-REMOVE-1
Task: Remove TRON/USDT crypto payment code entirely (owner request) — card payment only

Changes:
- Deleted files: src/lib/payments/trongrid.ts, tron-address.ts, hd-address.ts (TRON network scan / address validation / HD xpub derivation), src/app/api/payments/wallet/route.ts (disabled stub), scripts/payments-keygen-offline.mjs (offline TRON keygen), scripts/test-task49-chain.ts (e2e for removed DETECTED→PAID crypto chain).
- src/lib/payments/config.ts rewritten: removed TRON networks table, wallet override (SiteSetting paymentsWallet), xpub validation, USDT contract checks, trongrid API key, TRANSFER_TOPIC/ABI consts, PAYMENT_TTL, and the boot-time "[payments] Network: TRON Mainnet …" log (the warning the owner saw). Kept: product catalog (getProducts/findProduct/getActiveProductsAsync) + integer micro-USD helpers (usdToMicro/microToDisplay, MICRO_PER_USD).
- scheduler.ts: dropped legacy TRON sweep; only expires stale PENDING orders (SCHEDULER_VERSION → 6).
- service.ts: removed legacy crypto event kinds (TX_SEEN/DETECTED/VERIFIED/UNDERPAID/…), DETECTED from ACTIVE_STATUSES, network filter in expireStaleOrders; paymentMethod snapshot no longer defaults to USDT_TRON.
- admin-orders.ts + /api/admin/orders(+[ref]): payment block is now {method from DB paymentMethod, paidAt}; removed network/mode/address/txHash/txAmount/txFrom selects; paymentStatusWhere dropped DETECTED/UNDERPAID.
- /api/admin/payments(+[ref]): removed "legacy" filter bucket and legacy TRON block in detail response.
- /api/admin/users/[id], /api/admin/search, /api/admin/export, /api/auth/me: dropped paymentAddress/paymentMode/txHash/txFrom/txAmountMicro from responses; orders CSV now exports payment_method instead of tx_hash/payment_mode.
- UI: PaymentsAdminTab (legacy filter+badge+network block removed), OrdersAdminTab (USDT·HD/SH badge, address/tx rows, copy helpers removed; amounts labeled USD), CheckoutPage (legacy USDT branch removed), AccountPage (methodManual shown only for MANUAL_BANK_CARD), AdminPage students (paymentAddress/tronscan tx link/txFrom removed, midTrunc removed).
- site-content: removed filterLegacy/legacyBadge/legacyNote/dOrderTx/dOrderFrom/dOrderAddress/network/address/addressIndex/txHash/txAmount/txFrom labels; user-facing USDT texts → USD (discount errors, package price message, money.ts comment).
- DB intentionally untouched (UsdtOrder table + historical columns stay for existing prod data; ensure-schema DDL defaults kept for compat). Prisma schema unchanged.
- Boot log about TRON wallet is gone; no crypto code path remains in src/.

Verification: bun x tsc --noEmit (0 errors); bun run build (compiled successfully, all 36 routes generated; pre-existing local prisma DATABASE_URL warning unrelated); bun test tests/ (16 pass / 0 fail); eslint on all changed files (clean).

---
Task ID: HERO-TREE-REMOVE + RECEIPTURL-HEAL-FIX
Task: (1) Remove the toon tree from the hero (owner request). (2) Fix production 500 "column UsdtOrder.receiptUrl does not exist" when opening the payment page.

Changes (1) — hero tree:
- HeroScene.tsx: removed ToonTree (trunk/crown/hanging 香椿 sign/bushes/grass) plus the speech bubble and 香/椿 word chips anchored to it; cleaned now-unused imports (Frond/Berries/Blossom/LEAF/RUST/RUST_DARK/LEAF_DARK) and Cluster helper. Hero keeps sun, clouds, birds, drifting leaves, 学 background char, green hills.
- Deleted dead src/components/site/HeroLandscape.tsx (never imported).

Changes (2) — receiptUrl 500 fix. Root cause: ensureLmsSchema cached its FIRST run result forever — if any DDL failed at cold start (e.g. Homework tables missing on Neon because migrations never ran there), the .catch() turned the failure into a RESOLVED cached promise, so every later drift-retry (payments/orders POST) was a no-op; and UsdtOrder.receiptUrl DDL sat AFTER the Homework DDLs, so it never ran.
- lms-schema.ts: DDL statements are now independent (per-statement catch, log + continue) so one missing table can't block others; UsdtOrder.receiptUrl DDL moved FIRST; failed ensure is no longer cached (cache cleared on failure so the next call retries); summary log reports skipped statements.
- /api/payments/orders/[ref] GET (payment status page) and /api/receipts POST (receipt upload): added P2021/P2022 self-heal retry (same contract as order creation).
- service.ts submitReceipt: the updateMany .catch(()=>0) no longer swallows schema-drift errors (rethrown so the route's self-heal can fire) instead of returning a misleading CONFLICT.

Verification: bun x tsc --noEmit (0 errors); eslint on changed files (clean); bun test tests/ (16 pass / 0 fail); bun run build (compiled successfully).

---
Task ID: HERO-WORDCHIPS-1
Task: Fill the empty right side of the hero (after tree removal) with floating word cards (owner picked this option).

Changes:
- HeroScene.tsx: new WordChip component (hanzi + pinyin · meaning) rendered as three floating cards on the right sky — 你好 nǐ hǎo · hello (butter), 谢谢 xièxie · thanks (glass white), 再见 zàijiàn · bye (sage) — with gentle ct-float animation, staggered delays, slight rotations, and progressive visibility (sm / md / lg) so mobile hero text stays clean. Positioned to avoid sun/clouds/birds/hills overlaps.

Verification: bun x tsc --noEmit (0 errors); eslint (clean); bun run build (compiled successfully).

---
Task ID: SEO-ROBOTS-SITEMAP-1
Task: Technical SEO audit — robots.txt AI-crawler policy + complete auto-updating sitemap.

Changes:
- src/app/robots.ts: rewritten. Explicit crawler groups — search/answer crawlers (Googlebot, OAI-SearchBot for ChatGPT Search, Claude-SearchBot, PerplexityBot) and independent model-training groups (GPTBot, ClaudeBot, Google-Extended), all currently allowed; catch-all * stays Allow: /. Only /api/ is disallowed for all groups (no indexable content, rate-limited, crawl budget). Removed the non-standard Yandex-only `host` directive. Sitemap pinned to canonical https://www.chinesetoon.com/sitemap.xml. Private HTML pages intentionally left crawlable so their noindex meta is visible; robots.txt is not access control (auth unchanged).
- src/app/sitemap.ts: added published lessons (/lesson/<slug>, Lesson.published=true) — public indexable pages with canonical metadata; no lastModified for lessons (model has no updatedAt — dates are not fabricated). Kept active classes and published posts with their real updatedAt. Added duplicate-URL guard. Documented exclusions (private/noindex routes, quizzes rendered inside /learn, FAQ inside /support) and the 50k-URL limit rationale. revalidate=3600 keeps it auto-updating on Vercel without deploys.
- No duplicate implementations: confirmed public/ has no robots.txt/sitemap.xml; only the native app-router metadata routes exist.

Verification (LOCAL — production DB rows not verifiable locally because local DATABASE_URL is stale):
- /robots.txt → 200 with all 8 groups + Sitemap line, no Host.
- /sitemap.xml → 200, valid XML, 8 static URLs, all https://www.chinesetoon.com (0 non-canonical); DB-failure fallback path proven (local DB unreachable).
- All 8 static URLs return HTTP 200 (no redirects/broken).
- bun x tsc --noEmit (0), eslint (clean), bun run build (compiled successfully), bun test (16 pass).

---
Task ID: LESSON-BACK-BUTTON-1
Task: Fix "All lessons" back button not working on /lesson/<slug>.

Root cause: navigateTo compared the target page with pageFromPathname(), which maps /lesson/* to 'learn' for menu highlighting — so from a lesson page, navigating to 'learn' looked like "already there" and only scrolled to top.

Change: src/components/site/site-shell.tsx — navigateTo now compares against the real target path (window.location.pathname === target); same-page clicks still just scroll to top.

Verification: tsc (0 errors), eslint (clean), next build (compiled successfully).

---
Task ID: SEO-BLOG-5-ARTICLES-1
Task: Create and publish five comprehensive English SEO articles in the existing blog system.

Architecture (reused, nothing new built):
- Articles live in the Prisma Post table; publishing workflow = idempotent seed script (same pattern as seed-blog-task75.ts, upsert by unique slug, views/createdAt preserved).
- Renderer extended minimally: src/lib/blog-format.ts (pure parser: inline bold/link tokens, markdown table blocks, word counting) + blog-parts.tsx PostContent now renders [text](href) links (internal via next/link, external target=_blank rel=noopener), markdown tables as responsive styled tables, and ### sub-headings. Existing posts unaffected (bold/## behave identically).
- Sitemap (revalidate=3600) automatically picks up published posts — no manual URL list.

New files:
- src/lib/blog-format.ts — shared pure parser (renderer + seed + tests).
- tests/blog-render.test.ts — 14 unit tests for the parser (30/30 total tests pass).
- scripts/seo-articles/{types,hsk-exam-guide,china-scholarships,learn-chinese-beginners,study-in-china,hsk-1-study-guide}.ts — the five articles.
- scripts/seed-blog-seo.ts — seed runner: upserts validated articles; --check mode validates format/word count/excerpt length/table syntax/internal links against a whitelist of real site paths/https-only external links (allowlisted official domains), exits non-zero on any violation.

Articles (all pass --check with 0 warnings):
1. complete-guide-to-hsk-exam — ~2015 words (hsk/sage) — fact-checked: HSK 2.0 per-level question counts/durations/scores (20L+20R 200/120 … 50L+50R+essay 300), HSK 3.0 three-stages-nine-levels with 7–9 live since 2022, HSKK 3 levels — Wikipedia + chinesetest.cn.
2. china-scholarships-for-international-students — ~2016 words (culture/butter) — CSC Type A/B/C pathways, coverage description without invented amounts; official links: campuschina.org, US embassy CGS page.
3. how-to-learn-chinese-for-beginners — ~2019 words (tips/sage) — pinyin/tones/vocab/grammar with verified hanzi-pinyin-English examples, 15/30/60-min routines, 4-week plan.
4. study-in-china-guide — ~2050 words (culture/peach) — universities, language requirements, costs as explicit variable estimates only, X1 vs admission distinction, city choice; no fabricated visa rules.
5. hsk-1-study-guide — ~2278 words (hsk/sage) — exact format (20+20 items, 200/120), real vocabulary sample from the 150-word list, 5 grammar patterns, 30-day plan, ORIGINAL practice questions clearly labeled as not official.

Verification: bun scripts/seed-blog-seo.ts --check (all valid), tsc (0 errors), eslint (clean), bun test (30 pass / 0 fail), next build (compiled successfully).

NOT yet published: local .env DATABASE_URL is stale (points to /home/z/... sqlite path) so seeding must run against the production Postgres (DATABASE_URL + `bun scripts/seed-blog-seo.ts`). Sitemap will include the five URLs automatically after the seed runs.

---
Task ID: REGISTER-UX-FIXES-1
Task: Three registration-flow fixes (owner request): X button wiped everything; level asked redundantly when a class is selected; discount code removed from class details.

Changes:
- RegisterPage.tsx: (1) removed the destructive X (deselect) button from the selected-class card — clearing the selection used to wipe the price box and force re-picking level/type from scratch; to switch class, pick another on /classes (new selection replaces the old one). (2) The Level select is now hidden when a class is selected (lockedClass) — the class defines its level; the submitted level is derived from the class itself (catalogLock.level → fileLock.level → form.level → class title as last-resort fallback so server min(1) validation never fails).
- ClassesPage.tsx: removed DiscountCodeBox from the class-detail dialog (plus the showDiscountCode prop, DISCOUNT_CODE_STORAGE_KEY export and now-unused TicketPercent/Loader2 imports). Discount codes remain fully supported — CheckoutPage has its own code input/apply UI.

Verification: tsc (0 errors), eslint (clean), bun test (30 pass / 0 fail), next build (compiled successfully).

---
Task ID: HERO-EDITORIAL-REDESIGN-1
Task: Premium editorial redesign of the homepage hero (owner direction: refined composition, not a collection of illustrations). Replaces the same-day "study room" scene version.

Design:
- HeroScene.tsx rewritten (v3, editorial): soft natural light halo behind the centered headline, ultra-faint dark-green 学 watermark (3.5%), two elegant toon-leaf sprigs (ToonBranch Leaflet/Berries, sage + rust accents) anchored to the bottom corners and cropped by the edge with a very slow 12s sway, two tiny drifting leaves, soft green ground wash + one thin cream hairline for visual anchoring. No clouds/birds/sun/hills/pagodas/desk/laptop/chair — no narrative illustration objects at all.
- HomePage hero: content stays centered with unchanged text/buttons/links; highlighted headline line gets a subtle brush-stroke underline (decorative SVG, text untouched); section gradient calmed (cream → cream → sage-light/30); bottom padding reduced for a compact premium header (pb-24/28/32 instead of 250-320px scene reserve).
- Mobile: left sprig small, right sprig hidden below sm, watermark hidden below md — compact, no overflow.
- Scope: only HeroScene.tsx + the hero section markup in HomePage.tsx. No global CSS, header, footer, or shared component changes. No new dependencies.

Verification: tsc (0 errors), eslint (clean), next build (compiled successfully), bun test (30 pass). Visual verification via in-app browser screenshots — desktop 1440x900 (centered editorial composition confirmed), mobile 390x844 (compact, centered, no overflow, right sprig hidden) — both verified clean of glitches/overlaps.

---
Task ID: HERO-CLEANUP-BIGTYPE-1
Task: (1) Remove the toon sprig branches from the editorial hero (owner request). (2) Make the hero text larger on desktop/Windows.

Changes:
- HeroScene.tsx: ToonSprig component and both corner-branch containers removed — the hero background is now purely atmospheric (warm light halo, ultra-faint 学 watermark, two tiny drifting leaves, soft green ground wash + hairline). Unused imports (Berries, LEAF, SAGE_FILL, RUST) cleaned.
- HomePage hero typography scaled up for desktop only: H1 text-4xl → sm:text-5xl → md:text-6xl → lg:text-7xl (72px at large desktop); subtitle text-lg → md:text-xl → lg:text-2xl with wider max-w-2xl; brush underline slightly taller at lg. Mobile sizes unchanged (text-4xl).

Verification: tsc (0 errors), eslint (clean), next build (compiled successfully). Visual check via in-app browser: desktop 1440x900 — bigger centered headline/subtitle, no branches, clean composition; mobile 390x844 — unchanged compact layout, no overflow.

---
Task ID: PRACTICE-HUB-1
Task: Unified Practice Hub at /practice — central entry point for all existing learning activities, with optional signed-in progress tracking.

Audit findings (all real features, reused — nothing rebuilt):
- Tone Trainer game (src/components/site/ToneTrainer.tsx) — embedded in /learn; TTS audio (/api/tts + browser fallback), tone ladder, streak (client-only).
- Vocabulary Flashcards (Flashcards.tsx) — embedded in /learn; cards from /api/learn/cards (DB) with static fallback.
- Chinese Level Quiz (LevelQuiz.tsx) — embedded in /classes; questions from DB (QuizQuestion), server-graded submit → QuizAttempt.
- Daily Chinese Word (WordOfDay.tsx) — home-page section; day-of-year rotation over static word list, TTS.
- Interactive lessons (/lesson/[slug]) — per-word pronunciation audio.
- No existing per-user practice progress (QuizAttempt is anonymous/email-lead only) → minimal new tracking justified.

New:
- src/lib/practice/registry.ts — single source of truth: 6 activities (daily-word, flashcards, lessons, tone-trainer, level-quiz, lesson-listen) with real hrefs/anchors, category, level, minutes; isKnownActivity() for server validation; DAILY_GOAL=3 in API.
- src/app/api/practice/progress/route.ts — POST (auth required, zod + registry validation, rate-limit 60/h, same-origin guard) records PracticeEvent; GET returns {authenticated, user firstName, goal, todayCount, streak (UTC-day consecutive rule, counts from yesterday if today empty), doneToday, recent≤5 deduped, totals 30d} — all queries scoped to session user.
- src/lib/practice/record.ts — fire-and-forget client helper (401/network silently ignored; 60s dedupe per activity).
- src/app/practice/page.tsx — server page with SEO metadata (title/description/canonical/OG).
- src/components/site/practice/PracticeHub.tsx — client hub: dashboard (personalized greeting, today/goal, streak, done-today chips, Continue→last real activity), search + category filters + recommended/recently-used sort on real metadata, responsive accessible cards with "done today" badge and last-practiced date, loading/failed/empty states, guest banner (sign-in only for saving progress).
- prisma: model PracticeEvent {userId, activityKey, createdAt, @@index([userId,createdAt]), @@index([activityKey,createdAt])} + migration 20261026000000_practice_progress + additive DDL in lms-schema.ts self-heal. Schema.prisma BOM stripped (broke prisma validate after a PowerShell edit).
- tests/practice-registry.test.ts — 5 tests: unique keys, hrefs point to real routes/anchors, categories valid, metadata complete, isKnownActivity rejects fakes.

Modified:
- site-content.ts: PageKey + 'practice'; navigation array + Practice item (desktop header, mobile menu and footer pick it up automatically).
- site-shell.tsx: pageFromPathname knows 'practice' (active menu highlight).
- LearnPage: anchor ids #tone-trainer/#flashcards + contextual "Practice Hub" link; ClassesPage: #level-quiz anchor wrapper; HomePage: #word-of-day anchor wrapper.
- sitemap.ts: /practice added (weekly, 0.7).

Verification: prisma validate OK (after BOM fix) + client regenerated; tsc 0 errors; eslint clean; bun test 35/35 pass; next build OK (routes /practice + /api/practice/progress in output). Runtime checks (local prod server): GET guest → {authenticated:false,goal:3}; POST guest → 401; browser: desktop dashboard/filters/cards render, quiz card → /classes#level-quiz scrolls to real quiz, search "tone" filters to 1 card, mobile 390px layout clean, mobile menu shows Practice highlighted.

---
Task ID: EMAIL-VERIFICATION-1
Task: Email verification for the existing auth system — users must verify their email before signing in; unverified login attempts get a clear message + resend option. Server-side enforced.

Flow: register → account created with emailVerified=null (NO auto-login session anymore) → single-use 24h hashed token emailed as a link → clicking it marks token used (atomic guard) and sets emailVerified → user signs in. Login of an unverified post-rollout user → 403 EMAIL_NOT_VERIFIED with clear message + client resend banner. Grandfathering: users created before EMAIL_VERIFICATION_ROLLOUT_MS (2026-10-26) are exempt via createdAt check in code — zero lockout risk for existing accounts; Google signups get emailVerified immediately (Google-verified emails).

Changes:
- prisma/schema.prisma: User.emailVerified DateTime? + EmailVerifyToken model (tokenHash unique, userId cascade, expiresAt, usedAt) + migration 20261026000001_email_verification (no backfill — grandfathering is in code so new unverified registrations are never "fixed" by a re-run).
- Self-heal DDLs: lms-schema.ts (Postgres: ADD COLUMN IF NOT EXISTS User.emailVerified + CREATE TABLE EmailVerifyToken + indexes) and ensure-schema.ts (SQLite mirror: column in User CREATE + ALTER list, EmailVerifyToken table/indexes) so deployments work with or without migrate deploy.
- user-auth.ts: isEmailVerificationRequired(), createEmailVerifyToken() (deletes previous tokens = only latest link valid; raw token returned, sha256 stored), EMAIL_VERIFY_TTL_MS=24h, purgeExpiredAuthRecords also cleans expired verify tokens, toSafeUser now exposes emailVerified as boolean only.
- mail.ts: sendEmailVerification() — branded HTML/text with button link + copy fallback, expiry and one-time wording; same Resend/console-only policy as reset codes (never leaks delivery result to API responses).
- register route: no session cookie on register; creates verify token and emails link via after() (non-blocking); responds 201 {ok, verificationRequired, user}.
- login route: after password verifies, unverified post-rollout user → 403 {code: EMAIL_NOT_VERIFIED} (checked only after correct password, so no account enumeration; no session created).
- NEW /api/auth/resend-verification POST: always-generic 200 (no enumeration), rate limits IP 10/h + email 3/30min, regenerates token, sends via after().
- NEW /api/auth/verify-email GET: token regex-gated, atomic updateMany consumption (usedAt null + not expired), sets User.emailVerified, redirects to /account?verified=1|0; rate limit 30/h/IP.
- google/callback: created users get emailVerified=now() (Google-verified emails).
- AccountPage.tsx: after register → "Check your inbox" panel with resend button + register-again link (pay-redirect intentionally preserved in sessionStorage for post-verify login); login → EMAIL_NOT_VERIFIED shows inline banner with resend; ?verified=1|0 → success/expired banner (URL cleaned via history.replaceState).
- tests/email-verification.test.ts: grandfathering rule matrix (verified/legacy/new/rollout-boundary), TTL constant, console-provider mail path logs the link and returns sent:false.

Verification: prisma validate + generate OK; tsc 0 errors; eslint clean; bun test 42/42 pass; next build OK (routes /api/auth/verify-email + /api/auth/resend-verification in output). LIMITATION: true end-to-end DB flow could not run locally — .env DATABASE_URL is a stale non-reachable path (pre-existing env issue) and no local Postgres/Docker exists; DB-dependent runtime steps (actual email send with RESEND_API_KEY, link consumption, login of unverified user) are verified by build+unit coverage of the pure logic and must be smoke-tested on staging/production after deploy.

---
Task ID: ENROLLMENT-SIMPLIFY-1
Task: Fix the class-selection flow and simplify registration (owner request).

Changes:
1. Hero (HomePage.tsx): "Join a Class" is now the single CTA and navigates to /classes where users see and pick a class (was: navigated straight to /register with no class). The separate "Explore Classes" secondary button is removed — one clear flow. Selection made on /classes is carried into registration via the existing sessionStorage handoff (ct-selected-class) and shown as the "Selected class" card throughout enrollment.
2. RegisterPage.tsx: the "Current Chinese Level" select is removed completely; level is derived server-bound from the selected class (catalogLock.level → fileLock.level → 'Unspecified'). Price box now only appears with a selected class (no-class combo matrix removed). New butter banner when no class is selected: "No class selected yet — pick a class…" + "Browse classes" button → /classes. Removed the "Edit profile" link from the "Registering as" card.
3. /api/register: level schema relaxed — optional, empty→'Unspecified' (same max length); dedupe + record storage unchanged.
4. AccountPage.tsx: personal-info display removed (avatar, member-since, last-login, country, telegram, phone grid + InfoBox helper + unused icons); compact header keeps name, email, sign-out and the unique student code; orders/notifications/schedule/homework (enrollment) untouched. There was no profile-edit form or API to remove — the only "Edit profile" affordance was the RegisterPage link (removed).

Verification: tsc 0 errors, eslint clean, bun test 42/42, next build OK. Browser flow test (local prod server): hero button → /classes; 6 Register buttons; click → /register with sessionStorage ct-selected-class = "HSK 1 — Beginner Chinese" (carried through the auth gate too); /register renders with no level select and no no-class banner when a class is carried. DB-backed submit still unverifiable locally (stale .env DATABASE_URL, no local Postgres) — server schema change is unit-simple (optional level → 'Unspecified').

---
Task ID: EMAIL-VERIFICATION-2
Task: Switch email verification from one-time link to a 6-digit code (owner request — same pattern as password reset); verification success now signs the user in directly.

Changes:
- user-auth.ts: createEmailVerifyToken → createEmailVerifyCode (6-digit randomInt, sha256 stored, previous open codes deleted so only the latest is valid); EMAIL_VERIFY_TTL_MS 24h → 10min (same as reset codes).
- mail.ts: sendEmailVerification → sendEmailVerificationCode — branded HTML/text with a large monospace code chip, minutes-based expiry, "Never share this code" wording; subject embeds the code; comment documents the Resend 403 fix (verify the chinesetoon.com domain in the Resend panel, then set MAIL_FROM=Chinese Toon <noreply@chinesetoon.com> — the onboarding@resend.dev test domain only delivers to the account owner's own inbox).
- /api/auth/verify-email: GET link-redirect → POST {email, code}; atomic updateMany consumption (last open code of this user, one-time, unexpired); generic 400 on any failure (no account enumeration); success sets emailVerified + lastLoginAt and CREATES a session — entering the code proves email ownership, mirroring the reset flow; the pay-redirect handoff is consumed client-side after verify.
- register + resend-verification routes: send the code via after() (non-blocking); dev-only devCode in the JSON response when NODE_ENV !== 'production' and no provider configured (same contract as forgot-password); provider delivery failure logged server-side only, never leaked to responses.
- AccountPage.tsx: "Check your inbox" panel is now a code-entry form (numeric input, autoComplete=one-time-code, dev-code chip in local dev, inline error, Verify & continue); the unverified-login banner's resend now navigates straight to the code screen; the ?verified=1|0 link-result banner removed (no more link); success → toast + refreshUser + consumePayRedirect. Also fixed two leftover TS errors: devCode is read from the SUCCESS branch of resilientJsonFetch (FetchOk has no .kind), not the http-fail branch.
- tests/email-verification.test.ts: TTL = 10 minutes; console-provider path logs the code and returns sent:false; function contract test renamed to sendEmailVerificationCode.

Verification: tsc 0 errors; eslint clean on all changed files; bun test 42/42 pass; next build OK (both routes in output). End-to-end DB flow still requires staging/production (local .env DATABASE_URL is a stale non-reachable path — pre-existing env issue).

---
Task ID: PRACTICE-EMBED-1
Task: (1) Practice Hub self-contained — interactive activities live inside /practice, not on other pages (owner request). (2) Remove "First trial session is free — come and see if it fits!" from the class-details dialog. (3) Lessons support free text, not only word lists (owner request).

Changes (1) — practice embeds:
- registry.ts: daily-word / flashcards / tone-trainer / level-quiz hrefs → same-page anchors (/practice#practice-<key>); lessons + lesson-listen remain /learn links (lesson library).
- PracticeHub.tsx: WordOfDay, ToneTrainer, Flashcards and LevelQuiz now render embedded below the activity cards (the /api/learn/cards fetch moved here from LearnPage); navigate adapter for the register CTAs.
- Removals from other pages (owner request): LearnPage (ToneTrainer + Flashcards sections + cards fetch — Learn keeps only the lesson library), ClassesPage (#level-quiz block), HomePage (#word-of-day section). Testimonial copy updated to "in the Practice Hub".
- tests/practice-registry.test.ts: href allowlist updated to the new same-page anchors.

Changes (2): detailsNote removed from site-content classes + the butter note block deleted from the ClassesPage detail dialog (buttons kept).

Changes (3) — lesson text:
- prisma/schema.prisma: Lesson.content TEXT default '' + migration 20261026000002_lesson_content (additive/idempotent); self-heal DDL added to lms-schema.ts (Postgres) and ensure-schema.ts (SQLite create-table + ALTER list).
- /api/learn/lessons: content added to the zod schema (max 20000); GET returns it via the row spread; serialize passes it through.
- AdminPage LessonForm: "Lesson text (optional)" textarea (blank line starts a new paragraph) + AdminLesson.content field.
- LessonDetailPage: new "Lesson text" section above the word list — paragraphs split on blank lines, brand styling.

Verification: prisma generate + validate OK (schema comment cleanup on Lesson while editing); tsc 0 errors; eslint clean; bun test 42/42; next build OK (37/37). Browser (local prod server): /practice shows all four activities embedded and cards scroll to same-page anchors (DOM + screenshots at 1440px verified); /register guest gate, /learn, / all render. A transient "empty main on hard load" observed mid-session on some pages was cold-server/bundle timing, not a code issue — with a warm server every page fills correctly, and the same HTML streaming pattern exists on production www.chinesetoon.com whose /learn renders fine. DB-backed content flow (admin edit → lesson page) needs staging (local DATABASE_URL stale — pre-existing).

---
Task ID: REGISTER-CLASS-GATE-1
Task: Registering from anywhere other than /classes must not be possible without picking a class — the CLASS is mandatory (owner correction: do NOT ask the level; level comes from the class).

Changes:
- RegisterPage.tsx: with no class carried in sessionStorage (ct-selected-class), the form no longer renders at all — a butter gate card ("No class selected yet") explains that registration is class-based and offers "Browse classes" → /classes. With a class selected the flow is unchanged: level derived from the class, price box from the server catalog, auto-redirect to payment after submit. The level select stays removed (asking the level was explicitly rejected); /api/register unchanged (optional level → 'Unspecified' remains as a dead-path defense).
- The old "no class selected yet" banner was replaced by this gate; after submitting, the selection is consumed so "Register again" returns to the gate until a new class is picked.

Verification: tsc 0 errors; eslint clean; bun test 42/42; next build OK. Browser (local prod server): guest still sees the account gate first (pre-existing); the signed-in no-class gate is a simple conditional verified by types/code (needs a session — local DB unreachable); /classes → Register still carries the selection through the auth gate and opens the form.

---
Task ID: PRACTICE-POLISH-1
Task: Fix the visual problems of the embedded Practice Hub (owner: «بخش تمرین‌ها خرابه و مشکلات دارد»).

Problems found (browser inspection, 1440px + 390px):
- WordOfDay's CurveDivider was drawn with its home-page assumption (peach) → a stray peach band on the cream /practice background.
- Uneven vertical rhythm: ToneTrainer (mt-20), Flashcards (mt-20) and LevelQuiz (mt-16) carried their old in-page margins INTO the hub's space-y-4 wrapper → double/uneven gaps and the quiz card hugging the footer.
- Tone Trainer heading clipped under the sticky header when jumping to its card anchor (scroll-mt too small at some positions).

Fixes:
- WordOfDay: new optional `dividerFill` prop (default = old peach, home unchanged); /practice passes the cream color so the curve blends into the section above.
- ToneTrainer/Flashcards/LevelQuiz root margins removed (all three now live ONLY in the hub); PracticeHub container: pt-16 + space-y-16 + pb-28 → even 4rem rhythm.
- All three anchors scrolled via scroll-mt-28; mobile 390px verified clean (no horizontal overflow).

Verification: tsc 0 errors; eslint clean; bun test 49/49; next build OK (37/37). Browser screenshots: cream→butter transition smooth, even gaps between the three activity cards on desktop and mobile.

---
Task ID: REGISTER-CLASS-SELECT-1
Task: Owner correction of REGISTER-CLASS-GATE-1 — do NOT push the user to /classes to pick a class; the register form itself has a class dropdown that starts EMPTY, and the price + sessions of the chosen class update live in the form.

Changes:
- RegisterPage.tsx: new `setSelectedClass` store helper (same sessionStorage source of truth as the Classes-page Register button, so the whole type-lock/price/payment pipeline reacts unchanged). New class `<select>` as the first form field — required, starts empty («Choose a class…»), options from GET /api/classes (active + full, full ones disabled with "— Full (waitlist)", label includes the class type). The previous no-class gate card and the green "Selected class" card were removed (the select shows the choice). Submit guarded: no class → inline error, no request.
- Live price: PricePreviewBox gained a `note` prop; the register page fetches class details and shows "{sessions} sessions · ${pricePerSession} per session" next to the catalog's exact package price when a class with pricing is selected. Level select stays removed (level comes from the class — owner's earlier ruling).
- site-content register keys: classSelectLabel/classSelectPlaceholder/classSelectHint.

Verification: tsc 0 errors; eslint clean; bun test 49/49; next build OK. Browser: guest gate still renders (signed-in dropdown needs a DB session — code verified by types; the select reuses the exact store that the previous session's browser test proved end-to-end from /classes).

---
Task ID: RESOURCES-1
Task: Public file downloads (owner request): admin uploads books/materials from the panel; every visitor can browse and download them on the site.

Architecture:
- prisma: `Resource` model (title, description, fileName display-only, fileUrl [Blob URL or FS hex filename], fileSize, mimeType, downloads counter, published, sortOrder) + migration 20261026000003_resources + self-heal DDL in lms-schema.ts (Postgres) and ensure-schema.ts (SQLite).
- src/lib/resources.ts — PURE validation shared by API and admin form (no server imports): extension allowlist (PDF/EPUB/MOBI/DOC(X)/PPT(X)/XLS(X)/ZIP/TXT/MP3/M4A/MP4/images — executables/scripts/HTML always rejected), MIME map, display-name/title/description sanitizers, size caps + human formatting. src/lib/resources-store.ts — server storage: Vercel Blob first (putBlobFile), fallback CT_DATA_DIR/uploads/resources with 48-hex unpredictable filenames (receipts pattern).
- APIs: GET /api/resources (public, published only; ?all=1 with admin key → all); POST (admin; multipart ≤4MB server-side store, or JSON to register a file already uploaded browser→Blob); DELETE (admin; removes row + file); GET /api/resources/upload-token (GET → {configured}; POST → @vercel/blob v2 handleUpload flow issuing a short-lived client token scoped by onBeforeGenerateToken to resources/<48-hex>.<allowed-ext> + locked MIME — the read-write token never reaches the browser); GET /api/resources/[id]/file (public download: streams from Blob with server auth — works for private stores too — or reads local FS; Content-Disposition attachment with RFC 5987 unicode filename; increments the downloads counter).
- Admin tab "Resources" (FolderDown icon) after Lessons: upload form (title/description/file) that picks the browser→Blob path when Blob is configured (multipart:true, any size) and falls back to the server multipart path otherwise; list with size/downloads/test-download and confirm-delete.
- Public section: ResourcesSection component at the bottom of /learn ("Free Library — Books & Study Materials") — hidden entirely when nothing is published; download buttons hit the file route.
- tests/resources.test.ts: 7 unit tests (extension allowlist/rejections, MIME coverage, sanitizers, caps, size formatting).

Verification: prisma generate OK (EPERM on the engine DLL was a stale server process holding the file — killed, regenerated clean); tsc 0 errors; eslint clean; bun test 49/49 (42 + 7 new); next build OK (37/37, all three /api/resources routes in output). Browser: /learn renders and correctly HIDES the library section while the DB is empty. API smoke: POST without admin key → 401; the two 500s seen locally are the pre-existing stale local DATABASE_URL (PrismaClientInitializationError in the log) — every DB-backed endpoint behaves the same locally; on Vercel+Neon they work. End-to-end upload/download needs staging/production with BLOB_READ_WRITE_TOKEN.

---
Task ID: EXAMS-1
Task: Exam section (owner request): visitors take HSK-style exams, get a server-graded score announced instantly; the owner creates/changes exams by importing an XML file from the panel.

Architecture:
- fast-xml-parser@5.11.2 added (only new dependency).
- prisma: `Exam` model (slug unique, title, description, level, durationMin [0=untimed], passPercent, published, sortOrder, questions JSON [{q, options[], answer}]) + migration 20261026000004_exams + self-heal DDLs (lms-schema.ts Postgres + ensure-schema.ts SQLite).
- src/lib/exams.ts — PURE logic shared by API/tests: parseExamXml (attributes slug/title/level/durationMin/passPercent/description, <question><text>+<option correct="true">; slugify fallback; entity decoding; per-question numbered errors; caps: 200 questions, 8 options, 1MB XML), safeParseExamQuestions (DB JSON guard), gradeExam (server-side; invalid/null answers = wrong; percent + passed threshold + per-question booleans). XML format documented in the file header and in the admin tab hint.
- APIs: GET /api/exams (public metadata only — question COUNT, never questions; ?all=1+admin → full with questions), POST (admin multipart XML → parse → upsert by slug, replaces questions), PATCH (admin publish toggle), DELETE (admin). GET /api/exams/[slug] (public: questions WITHOUT the answer field), POST /api/exams/[slug] (submit {answers:number[]} → server grade → score/percent/passed + full review incl. correct answers revealed only after grading; rate-limit 20/h/IP + same-origin guard).
- Public page /exams (static, in sitemap weekly 0.7) + ExamsHub client component: exam cards (level badge, question count, duration, pass threshold) → runner (question-by-question with progress bar, A/B/C/D option buttons, Prev/Next, optional countdown timer with auto-submit, unanswered counter, submit confirm) → result (percent hero, pass/fail banner, score line, retake/back) → per-question review (correct option highlighted sage, wrong pick peach, unanswered noted). Empty state when no published exams.
- Practice registry: new 'exams' activity (category quizzes, href /exams, new 'clipboard' icon in PracticeHub) + practice-registry.test allowlist + sitemap entry.
- Admin tab "Exams" (ListChecks icon) after Resources: XML upload form (published checkbox) with the format hint, exam list (slug, level, question count, duration, pass %), publish/draft toggle, confirm-delete.
- tests/exams.test.ts: 11 unit tests — parse happy path + entity decoding + slugify fallback, numbered validation errors (no text, <2 options, 0/2 correct answers, malformed XML), grading (100%/67% thresholds, null+invalid answers, non-array), DB-JSON guard.

Verification: prisma generate OK; tsc 0 errors; eslint clean (three react-hooks strictness iterations on the timer: submit moved out of the sync effect body into a setTimeout watcher); bun test 60/60 (49 + 11 new); next build OK (38/38 pages, /exams static ○, both API routes ƒ). Browser: /exams renders hero + graceful empty state locally (DB unreachable — pre-existing). End-to-end (XML import → take exam → score) needs staging/production with a real DATABASE_URL — parsing/grading logic itself is fully unit-covered.
