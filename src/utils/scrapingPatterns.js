export const SCRAPING_PATTERNS = {
  BOT_AGENTS: [
    { name: 'Python Requests', regex: /python-requests/i, score: 10 }, // Bajamos de 15 a 10
    { name: 'Axios Node.js', regex: /axios/i, score: 5 },             // Bajamos de 10 a 5
    { name: 'Postman Runtime', regex: /PostmanRuntime/i, score: 2 },  // Casi inofensivo
    { name: 'Curl', regex: /curl/i, score: 5 },
  ],

  AUTOMATION_TOOLS: [
    { name: 'Puppeteer/Headless', regex: /HeadlessChrome/i, score: 15 }, // Bajamos de 20 a 15
    { name: 'Selenium/WebDriver', regex: /selenium|webdriver/i, score: 15 }
  ],

  HUMAN_INDICATORS: ['accept-language', 'sec-ch-ua'] // Quitamos 'referer' (es el que más falla en humanos)
};