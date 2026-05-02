# APIGuard

**High-performance, event-driven security middleware for Node.js.**

APIGuard is a robust security layer designed to protect your Express/Node.js APIs from common threats without compromising performance. Built with a "fail-open" philosophy and optimized memory management.

## Features

* **DoS Protection:** Protection against request floods and specific endpoint protection.
* **Injection Defense:** Scanning protection against SQL and NoSQL injections.
* **Brute Force Mitigation:** Customizable auth-path monitoring.
* **Scraping Detection:** Intelligent bot detection with "soft-delay" policies.
* **Real-time Telemetry:** Built-in buffering system to send signals to your dashboard.
* **Zero-Dep Core:** Lightweight and fast, using Node.js native features.

## Quick Start

### Installation

```bash
npm install apiguard-js
```

### Basic Usage
```javascript
import express from 'express';
import { apiguard } from 'apiguard';

const app = express();
const guard = apiguard();

// Use it as a global middleware
app.use(guard);

app.get('/api/data', (req, res) => {
  res.json({ message: "Protected by APIGuard" });
});

app.listen(3000);
```


## Configuration

### CLI Tools

APIGuard comes with a command-line interface to help you get started:

```bash
# Initialize a default configuration file
npx apiguard-js init

# Check your current protection status
npx apiguard-js status
```

APIGuard is ready to work out of the box, but you can customize its behavior by creating an `apiguard.config.json` file in your root directory.

### Environment Variables
For sensitive data, APIGuard prioritizes environment variables:

| Variable | Description |
| :--- | :--- |
| `APIGUARD_API_KEY` | Your unique key for the dashboard. |
| `APIGUARD_TELEMETRY_URL` | The endpoint where signals will be sent. |

### Configuration File Example
```json
{
  "security": {
    "detectors": {
      "sqlInjection": { "threshold": 20 },
      "dos": { "requestFlood": { "threshold": 100 } }
    }
  }
}
```

## Architecture & Performance

- **Event-Driven:** Uses an internal EventBus for non-blocking security analysis.
- **Memory Efficient:** Implements strict limits on IP tracking to prevent RAM exhaustion.
- **Fail-Open Philosophy:** If the middleware encounters an unexpected error, it allows traffic to pass rather than crashing your server.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
