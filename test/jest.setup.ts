import dotenv from 'dotenv';

// Loaded before any spec imports a Nest module, so modules that read
// process.env while being imported see the test configuration.
dotenv.config({ path: '_test.env' });

// Rate limit counters live in Redis and outlive the process. Without a prefix
// unique to this run, a second `npm test` inside the same window inherits the
// previous run's counters and trips the auth throttle.
process.env.REDIS_PREFIX = `badrgo-test-${process.pid}-${Date.now()}:`;

jest.setTimeout(120000);
