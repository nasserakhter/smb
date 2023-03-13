import { isNode } from 'browser-or-node';

import SambaClient from './node';

// Import NodeSambaClient from './src/node';

let Library: typeof SambaClient | undefined;

if (isNode) {
  Library = SambaClient;
} else {
  throw new Error('Browser not supported');
}

(async () => {
  const client = new Library();
  await client.init();
  console.log('Cdir:', await client.cd());
  console.log('Cdir:', await client.cd('Family'));
  console.log('listing:', await client.ls());
})();
