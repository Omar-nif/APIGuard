const TARGET = 'http://localhost:3000/fast';
const TOTAL_REQUESTS = 10000;
const CONCURRENCY = 1;

async function attack() {
  let sent = 0;

  async function worker() {
    while (sent < TOTAL_REQUESTS) {
      sent++;

      try {
        const res = await fetch(TARGET);

        console.log(
          res.status,
          res.headers.get('x-apiguard-action') ?? 'allow'
        );

      } catch (err) {
        console.log('error', err.message);
      }
    }
  }

  const workers = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  console.log('Attack finished');
}

attack();