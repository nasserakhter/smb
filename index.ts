import BrowserOrNode from 'browser-or-node';

// Import NodeSambaClient from './src/node';

let library = null;

if (BrowserOrNode.isNode) {
  library = {};
} else {
  throw new Error('Browser not supported');
}

export default library;
