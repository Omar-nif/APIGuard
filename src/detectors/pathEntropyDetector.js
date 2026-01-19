import { createSignal } from "../signals/createSignal";
import { calculateEntropy } from "../utils/calculateEntropy";

export function createPathEntropyDetector({
    emitSignal,
    threshold = 3.5
} = {}) {
    if (typeof emitSignal !== 'function') {
        throw new Error('pathEntropyDetector requires emitSignal function');
    }

    return function pathEntropyDetector(event) {
        if (!event || event.meta.ignored) return;

        if (!path || path.lenght < 6) return;

        const entropy = calculateEntropy(path);

        if (entropy < threshold) return;

        emitSignal(
            createSignal({
                type: 'PATH_HIGH_ENTROPY',
                source: 'pathEntropyDetector',
                event,
                payload: {
                    path,
                    entropy
                }
            })
        );
    };
}