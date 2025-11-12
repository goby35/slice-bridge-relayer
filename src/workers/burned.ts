import 'dotenv/config';
import { burnedListener } from '@/listeners/burned';

export async function burnedListenWorker() {
  console.log('🔥 BurnedWorker starting...');
  const unwatch = await burnedListener();
  process.on('SIGINT', () => { unwatch?.(); process.exit(0); });
  process.on('SIGTERM', () => { unwatch?.(); process.exit(0); });
}