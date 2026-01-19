/*
Del RequestEvent solo trabajaremos con:

event.response.statusCode
event.meta.ignored
event.request.path

*/

import { createSignal } from "../signals/createSignal";

export function createNotFoundDetector({ emitSignal } = {}) {

    if (typeof emitSignal !== 'function') {
        throw new Error('notFoundDetector requires emitSignal function');
    } 

    return function notFoundDetector(event) {
        if (!event || event.meta.ignored) return;

        const { statusCode } = event.response;

        if (statusCode !== 404) return;

        emitSignal(
            createSignal({
                type: 'NOT_Found',
                source: 'notFoundDetector',
                event,
                payload: {
                    path: event.request.path,
                    statusCode
                }
            })
        );
    };
}