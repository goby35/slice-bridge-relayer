import 'dotenv/config'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'
import { logger as custormLogger } from "@/core/logger";
import { lockedListenWorker, burnedListenWorker } from './workers'
import apiRoutes from './api/server'

const app = new Hono()
app.use(logger())
app.use(prettyJSON())
app.route('/api', apiRoutes)

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, (info) => {
  custormLogger.info(`Local server listening: http://localhost:${info.port}`)
})

lockedListenWorker().catch((e) => {
  custormLogger.error('LockedWorker crashed:', e);
  process.exit(1);
});

burnedListenWorker().catch((e) => {
  custormLogger.error('BurnedWorker crashed:', e);
  process.exit(1);
});

export default app