export function createSlowRequestDetector(options = {}) {
    const {
        onSlow = null,
        minDuration = null
    } = options;

    return function slowRequestDetector(event) {
        if (!event || event.meta.ignored) return;

        const { performance } = event;

        if (!performance.slow) return;

        if (minDuration !== null && performance.duration < minDuration) {
            return;
        }

        if (typeof onSlow === 'function') {
            onSlow(event);
        }
    };
}