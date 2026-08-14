import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    iterations: 10000,
    vus: 100,
    thresholds: {
        http_req_failed: ['rate<0.01'],    // Failure rate must be under 1%
        http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    },
};

const EMULATOR_BASE_URL = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';

// 1. SETUP BLOCK: Runs ONCE before the 10,000 requests start
export function setup() {
    const signupUrl = `${EMULATOR_BASE_URL}/accounts:signUp?key=fake-api-key`;
    const payload = JSON.stringify({
        email: 'admin.control@google.com',
        password: 'adminPassword123',
        returnSecureToken: true,
    });

    const params = { headers: { 'Content-Type': 'application/json' } };
    
    // Create the test user in the emulator
    const res = http.post(signupUrl, payload, params);
    console.log(`Setup complete: User created in emulator (Status ${res.status})`);
}

// 2. MAIN TEST BLOCK: Fires 10,000 login requests
export default function () {
    const loginUrl = `${EMULATOR_BASE_URL}/accounts:signInWithPassword?key=fake-api-key`;
    const payload = JSON.stringify({
        email: 'admin.control@google.com',
        password: 'adminPassword123',
        returnSecureToken: true,
    });

    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post(loginUrl, payload, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has idToken': (r) => r.json().idToken !== undefined,
    });

    sleep(0.01);
}