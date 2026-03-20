// src/utils/scrapingPatterns.js
export const SCRAPING_PATTERNS = {
  // 1. Librerías de programación (User-Agents por defecto)
  BOT_AGENTS: [
    { name: 'Python Requests', regex: /python-requests/i, score: 15 },
    { name: 'Axios Node.js', regex: /axios/i, score: 10 },
    { name: 'Go HTTP Client', regex: /Go-http-client/i, score: 15 },
    { name: 'Java Client', regex: /Java\//i, score: 10 },
    { name: 'Postman Runtime', regex: /PostmanRuntime/i, score: 5 },
    { name: 'Curl', regex: /curl/i, score: 10 },
    { name: 'Wget', regex: /Wget/i, score: 10 },
    { name: 'AIOHTTP (Python)', regex: /aiohttp/i, score: 15 }
  ],

  // 2. Herramientas de automatización (Headless)
  AUTOMATION_TOOLS: [
    { name: 'Puppeteer/Headless', regex: /HeadlessChrome/i, score: 20 },
    { name: 'Selenium/WebDriver', regex: /selenium|webdriver/i, score: 20 },
    { name: 'Playwright', regex: /playwright/i, score: 20 }
  ],

  // 3. Headers obligatorios para un "humano"
  // Si faltan estos, la sospecha aumenta
  HUMAN_INDICATORS: ['accept-language', 'sec-ch-ua', 'referer']
};