const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { verifyConnectivity } = require('./config/neo4j');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Mount REST API routes
app.use('/api', routes);

// Serve frontend static files
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Fallback route for SPA
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Central error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  BUILDFORGE DA3 BACKEND & APP RUNNING ON PORT ${PORT}`);
  console.log(`  WEBSITE URL: http://localhost:${PORT}             `);
  console.log(`  API BASE:    http://localhost:${PORT}/api         `);
  console.log(`====================================================`);

  const status = await verifyConnectivity();
  if (status.connected) {
    console.log(`[Neo4j Status] Connected to ${status.uri} (${status.database})`);
  } else {
    console.warn(`[Neo4j Status] Disconnected: ${status.error}`);
    console.warn(`[Neo4j Notice] Please configure your Neo4j instance in backend/.env`);
  }
});

module.exports = app;
