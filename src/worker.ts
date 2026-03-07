import 'dotenv/config';
import { startWorkers } from './workers';

console.log('Starting background worker process...');
startWorkers();
