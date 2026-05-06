const fs = require('fs');
const path = require('path');

require('dotenv').config();

const distServerPath = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distServerPath)) {
  console.error('Missing build artifact:', distServerPath);
  process.exit(1);
}

process.env.PORT = process.env.PORT || '5000';

require(distServerPath);
