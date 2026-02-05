export function createErrorRequestDetector(options = {}) {
    const {
        onError = null,
        minStatusCode = 500
    } = options;

    const detector = function errorRequestDetector(event) {
        if (!event || event.meta.ignored) return;

        const { response } = event;

        if (!response || typeof response.statusCode !== 'number') return;

        if (response.statusCode < minStatusCode) return;

        if (typeof onError === 'function') {
            onError(event);
        }
    };

    //Metadata del detector
    detector.meta = {
        name: 'error-request',
        description: 'Detects HTTP error response'
    };

    return detector
}