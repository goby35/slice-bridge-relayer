import 'dotenv/config'
import { Hono } from 'hono'
import { health } from './routes/health'
import bridgeRoutes from './routes/bridge'

const apiRoutes = new Hono()

apiRoutes.route('/health', health)
apiRoutes.route('/bridge', bridgeRoutes)

apiRoutes.notFound((c) => c.json({ message: 'Not Found' }, 404))
apiRoutes.onError((err, c) => {
  console.error('Unhandled Error:', err)
  return c.json({ message: 'Internal Server Error' }, 500)
})

export default apiRoutes