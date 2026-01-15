export default function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
