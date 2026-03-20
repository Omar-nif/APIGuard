import generateId from '../utils/generateRequestId.js';

export function createSignal({
  type,
  level,
  source,
  event,
  data = {}
}) {
  if (!type) throw new Error('Signal type is required');
  if (!source) throw new Error('Signal source is required');
  if (!event) throw new Error('Request event is required');

  return {
    id: generateId('sig'),
    type,
    level,
    source,
    timestamp: Date.now(),
    event, // contexto completo (read-only por convención)
    data
  };
}

