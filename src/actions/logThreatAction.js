// utils/logThreatAction.js
export function createLogThreatAction(config) {

  return function logThreatAction(signal) {
    if (!signal || !signal.type.startsWith('threat.')) return;

    const { type, level, data, event, action } = signal;
    const ip = data?.ip || event?.request?.ip || 'unknown';
    const path = data?.path || event?.request?.path || 'unknown';
    const timestamp = new Date().toLocaleTimeString();

    // Un formato limpio y visual para el usuario de npm
    console.warn(
      `[APIGuard][${timestamp}] THREAT DETECTED\n` +
      ` > Type:  ${type}\n` +
      ` > Level: ${level.toUpperCase()}\n` +
      ` > IP:    ${ip}\n` +
      ` > Path:  ${path}\n` +
      ` -----------------------------------------`
    );
  };
}