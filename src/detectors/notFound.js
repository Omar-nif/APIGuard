/*
Del RequestEvent solo trabajaremos con:

event.response.statusCode
event.meta.ignored
event.request.path

*/

import { createSignal } from "../signals/createSignal";

export function createNotFoundDetector({ bus }) {

    if (!bus) {
        throw new Error('notFoundDetector requires a signal bus');
    } 

    return function notFoundDetector(event) {
        if (!event || event.meta.ignored) return;

        const { response, request } = event;

        if (response.statusCode !== 404) return;

        const signal = createSignal({
                type: 'NOT_Found',
                source: 'notFoundDetector',
                event,
                payload: {
                    path: event.request.path,
                    statusCode
                }
            })
    };
}