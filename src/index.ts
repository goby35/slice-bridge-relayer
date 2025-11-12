import 'dotenv/config'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'
import apiRoutes from './api/server'

const app = new Hono()
app.use(logger())
app.use(prettyJSON())
app.route('/api', apiRoutes)

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Local server listening: http://localhost:${info.port}`)
})

export default app