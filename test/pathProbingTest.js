// save as: pathProbingTester.js
import { request } from 'http';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const PATHS = [
    '/.env', '/.git/config', '/wp-admin', '/wp-login.php',
    '/phpinfo.php', '/admin123', '/config.php', '/backup.zip',
    '/admin', '/test.php', '/shell.php', '/cgi-bin/test.cgi',
    '/.htaccess', '/.htpasswd', '/wp-config.php', '/database.sql',
    '/backup.sql', '/debug.php', '/info.php', '/api/v1/users/all'
];

// Usando curl nativo (si prefieres curl)
function testWithCurl() {
    PATHS.forEach((path, index) => {
        setTimeout(() => {
            const curl = spawn('curl', [
                '-s',
                '-o', '/dev/null',
                '-w', `%{http_code} ${path}\\n`,
                `${BASE_URL}${path}`
            ]);
            
            curl.stdout.on('data', (data) => {
                process.stdout.write(data.toString());
            });
            
            curl.stderr.on('data', (data) => {
                // Silenciar errores
            });
        }, index * 100); // 100ms entre requests
    });
}

// Usando fetch API (Node.js 18+) 
async function testWithFetch() {
    for (const path of PATHS) {
        try {
            const start = Date.now();
            const response = await fetch(`${BASE_URL}${path}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'PathProbingTester/1.0'
                }
            });
            const elapsed = Date.now() - start;
            
            console.log(`${response.status} - ${path} (${elapsed}ms)`);
            
            // Pequeña pausa aleatoria entre 50-200ms
            await new Promise(resolve => 
                setTimeout(resolve, 50 + Math.random() * 150)
            );
            
        } catch (error) {
            console.log(`ERROR - ${path}: ${error.message}`);
        }
    }
}

// Modo de ataque más realista - con variaciones
function advancedProbing() {
    const commonPaths = [
        'admin', 'login', 'wp-admin', 'wp-login', 'dashboard',
        'config', 'backup', 'database', 'sql', 'phpinfo',
        'test', 'debug', 'api', 'user', 'admin.php'
    ];
    
    const extensions = ['', '.php', '.asp', '.aspx', '.jsp', '.html', '.txt'];
    const prefixes = ['', '/api/v1/', '/v1/', '/v2/', '/api/', '/app/'];
    
    const attacks = [];
    
    // Generar combinaciones
    for (const prefix of prefixes) {
        for (const path of commonPaths) {
            for (const ext of extensions) {
                attacks.push(`${prefix}${path}${ext}`);
            }
        }
    }
    
    // Añadir algunos paths específicos
    const specificPaths = [
        '/.env', '/.git/HEAD', '/.svn/entries',
        '/WEB-INF/web.xml', '/phpmyadmin/index.php',
        '/server-status', '/actuator/health'
    ];
    
    return [...specificPaths, ...attacks.slice(0, 50)]; // Limitar a 50 ataques
}

// Ejecutar
console.log('🚀 Iniciando simulador de Path Probing...\n');

// Elegir el método que prefieras:
testWithCurl();
//testWithFetch();

console.log('\n✅ Prueba completada. Revisa los logs de tu middleware.');