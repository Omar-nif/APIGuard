//import { generateId } from '../utils/generateRequestId.js';
 import generateId from '../utils/generateRequestId.js';

export function createSignal({
  type,
  source,
  event,
  level = 'low',
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
    event,   // CLAVE
    data     // CLAVE
  };
}

/*
import { request } from 'express';
import { generateId } from '../utils/generateRequestId.js';

export function createSignal({ type, source, event, payload = {} }) {
    if (!type) {
        throw new Error('Signal type is required');
    }

    if (!source) {
        throw new Error('Signal source is required');
    }

    if (!event) {
        throw new Error('Request event is required to create a signal');
    }

    return {
        id: generateId('sig'),
        type,
        source,
        timestamp: Date.now(),

        context: {
            requestId: event.id,
            ip: event.request.ip,
            method: event.request.method,
            path: event.request.path,
            userAgent: event.request.userAgent
        },

        payload
    };
}*/