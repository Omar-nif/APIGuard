// src/core/reporter.js

const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

function resolveReporterConfig(config = {}) {
  const reporting = config?.reporting || config?.telemetry || {};
  const apiKey =
    config?.api_key ||
    reporting?.api_key ||
    config?.apiKey ||
    config?.apikey ||
    reporting?.apiKey;
  const installationId =
    reporting?.installation_id ||
    reporting?.installationId ||
    config?.installation_id ||
    config?.installationId;

  let endpoint = reporting?.endpoint || null;

  if (!endpoint && (reporting?.base_url || reporting?.baseUrl)) {
    const baseUrl = reporting?.base_url || reporting?.baseUrl;
    endpoint = `${baseUrl.replace(/\/$/, '')}/api/ingest/security-events`;
  }

  return {
    enabled: Boolean(reporting?.enabled),
    endpoint,
    apiKey,
    installationId
  };
}

function mapEventType(type = '') {
  if (type === 'threat.sql_injection') return 'sql_injection';
  if (type === 'threat.nosql_injection') return 'nosql_injection';
  if (type === 'threat.auth_bruteforce') return 'brute_force';
  if (type === 'threat.endpoint_enumeration' || type === 'threat.scraping') return 'reconnaissance';
  if (type.startsWith('threat.dos.')) return 'ddos_attempt';
  return 'other';
}

function mapSeverity(level = 'medium') {
  const normalized = String(level).toLowerCase();
  return VALID_SEVERITIES.has(normalized) ? normalized : 'medium';
}

function buildDetectorCode(signal) {
  const detections = signal?.data?.detections;

  if (Array.isArray(detections) && detections.length > 0) {
    return String(detections[0]);
  }

  return signal?.source || signal?.type || 'unknown_detector';
}

function buildSummary(signal, eventType) {
  const path = signal?.event?.request?.path || 'unknown_path';
  const ip = signal?.event?.request?.ip || 'unknown_ip';
  return `[${eventType}] threat detected on ${path} from ${ip}`;
}

export function createTelemetryReporter({ bus, config, logger }) {
  const reporterConfig = resolveReporterConfig(config);

  if (
    !reporterConfig.enabled ||
    !reporterConfig.endpoint ||
    !reporterConfig.apiKey ||
    !reporterConfig.installationId
  ) {
    logger?.debug?.('[REPORTER] Remote reporting disabled or incomplete config.');
    return;
  }

  const reportAction = (signal) => {
    const eventType = mapEventType(signal?.type);
    const severity = mapSeverity(signal?.level);
    const summary = buildSummary(signal, eventType);
    const score =
      signal?.data?.score ??
      signal?.data?.attempts ??
      signal?.data?.requests ??
      null;

    const payload = {
      installation_id: reporterConfig.installationId,
      detected_at: new Date(signal?.timestamp || Date.now()).toISOString(),
      event_type: eventType,
      severity,
      summary,
      description: summary,
      detector_code: buildDetectorCode(signal),
      ip: signal?.event?.request?.ip || null,
      method: signal?.event?.request?.method || null,
      path: signal?.event?.request?.path || null,
      status_code: signal?.event?.response?.statusCode ?? null,
      score,
      payload_json: {
        request_id: signal?.event?.id || null,
        source: signal?.source || null,
        signal_type: signal?.type || null,
        detections: signal?.data?.detections || [],
        data: signal?.data || {},
        request: {
          query: signal?.event?.request?.query || {},
          body: signal?.event?.request?.body || {}
        }
      }
    };

    fetch(reporterConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': reporterConfig.apiKey
      },
      body: JSON.stringify(payload)
    }).catch((err) => {
      logger?.threat?.('[REPORTER] Failed to send SecurityEvent:', err?.message || err);
    });
  };

  bus.registerAction(reportAction);
  logger?.debug?.(`[REPORTER] SecurityEvent reporter connected to ${reporterConfig.endpoint}`);
}