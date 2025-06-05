const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const quotationsRouter = require('./routes/quotations');
const serviceRouter = require('./routes/serviceRoutes');
 
// Register routes
app.use('/api/quotations', quotationsRouter);
app.use('/api/services', serviceRouter); 