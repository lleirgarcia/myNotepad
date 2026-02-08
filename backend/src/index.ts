import { config } from './config.js';
import { app } from './app.js';
import { ensureDefaultUser } from './lib/ensureDefaultUser.js';

async function start() {
  await ensureDefaultUser();
  app.listen(config.server.port, () => {
    console.log(`Backend running at http://localhost:${config.server.port}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
