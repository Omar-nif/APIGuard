export function applyDecision(decision, req, res) {
    if (!decision || !decision.type) {
      return false;
    }
  
    switch (decision.type) {
      case 'block': {
        res.setHeader('X-Apiguard-Blocked', 'true');
  
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Your access has been temporarily restricted.'
        });
  
        return true;
      }
  
      case 'shadow': {
        res.setHeader('X-Apiguard-Shadowed', 'true');
  
        res.status(404).json({
          error: 'Not Found'
        });
  
        return true;
      }
  
      default:
        return false;
    }
  }