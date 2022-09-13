import express from 'express';
import { PORT } from './utils/config';
import { requestLogger } from './utils/middleware';
import authRouter from './controllers/auth';
const app = express();

import cors = require('cors')

app.use(cors())
app.use(express.json());
app.use(requestLogger)
app.use('/api/auth', authRouter);
app.use(express.static('out'))
app.listen(PORT, () => {
  console.log(`\n⚡️[server]: Server is running at http://localhost:${PORT}`);
});
