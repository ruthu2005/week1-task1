/**
 * e2e.test.js — Full-Stack Capstone End-to-End Test Suite
 * 
 * Verifies complete system workflow:
 * 1. GET /api/health (200 OK)
 * 2. POST /api/auth/register (Create Member User)
 * 3. POST /api/auth/register (Create Admin User)
 * 4. Role Authorization: Member attempting to create project is rejected (403 Forbidden)
 * 5. Admin creating project succeeds (201 Created)
 * 6. Authenticated user creates task under project (201 Created)
 * 7. GET /api/projects (Authenticated project list retrieval - 200 OK)
 * 8. GET /api/tasks (Authenticated task list retrieval - 200 OK)
 * 9. Unauthenticated request rejected (401 Unauthorized)
 */

const http = require('http');
const { app } = require('../src/server');

const PORT = 5099;
let testServer;
let memberToken = '';
let adminToken = '';
let projectId = null;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : '';
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        if (body) reqHeaders['Content-Length'] = Buffer.byteLength(postData);

        const req = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path,
            method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(postData);
        req.end();
    });
}

async function runE2ETests() {
    console.log('\n======================================================');
    console.log('🚀 RUNNING TASKFLOW CAPSTONE E2E INTEGRATION TESTS');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    try {
        testServer = app.listen(PORT, '127.0.0.1');
        await new Promise(r => setTimeout(r, 400));

        const timestamp = Date.now();
        const memberEmail = `member_${timestamp}@example.com`;
        const adminEmail = `admin_${timestamp}@example.com`;

        // 1. Health Check
        console.log('Test 1: GET /api/health (System Health Check)');
        const res1 = await makeRequest('/api/health', 'GET');
        if (res1.status === 200 && res1.body.status === 'ok') {
            console.log(`  └─ Status: 200 OK | Uptime: ${res1.body.uptime}s ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res1.status} ❌ FAIL\n`);
            failed++;
        }

        // 2. Member User Registration
        console.log('Test 2: POST /api/auth/register (Register Member User)');
        const res2 = await makeRequest('/api/auth/register', 'POST', {
            name: 'Member User',
            email: memberEmail,
            password: 'Password123!',
            role: 'member'
        });
        if (res2.status === 201 && res2.body.success) {
            memberToken = res2.body.token;
            console.log(`  └─ Status: 201 Created | Member Token Issued ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res2.status} ❌ FAIL\n`);
            failed++;
        }

        // 3. Admin User Registration
        console.log('Test 3: POST /api/auth/register (Register Admin User)');
        const res3 = await makeRequest('/api/auth/register', 'POST', {
            name: 'Ruthu Lead Admin',
            email: adminEmail,
            password: 'AdminPassword123!',
            role: 'admin'
        });
        if (res3.status === 201 && res3.body.success) {
            adminToken = res3.body.token;
            console.log(`  └─ Status: 201 Created | Admin Token Issued ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res3.status} ❌ FAIL\n`);
            failed++;
        }

        // 4. Role Authorization: Member attempting to create project (Expect 403)
        console.log('Test 4: POST /api/projects as Member (Expect 403 Forbidden)');
        const res4 = await makeRequest('/api/projects', 'POST', {
            name: 'Unauthorized Member Project',
            description: 'This should be blocked by RBAC middleware.'
        }, { 'Authorization': `Bearer ${memberToken}` });
        if (res4.status === 403) {
            console.log(`  └─ Status: 403 Forbidden | RBAC boundary enforced ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Expected 403, got ${res4.status} ❌ FAIL\n`);
            failed++;
        }

        // 5. Admin Project Creation (Expect 201)
        console.log('Test 5: POST /api/projects as Admin (Expect 201 Created)');
        const res5 = await makeRequest('/api/projects', 'POST', {
            name: 'Student Placement Tracker Platform',
            description: 'Production full-stack capstone deliverable.'
        }, { 'Authorization': `Bearer ${adminToken}` });
        if (res5.status === 201 && res5.body.data) {
            projectId = res5.body.data.id;
            console.log(`  └─ Status: 201 Created | Project ID: #${projectId} ("${res5.body.data.name}") ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res5.status} ❌ FAIL\n`);
            failed++;
        }

        // 6. Create Task under Project
        console.log('Test 6: POST /api/tasks (Create Task in Project)');
        const res6 = await makeRequest('/api/tasks', 'POST', {
            title: 'Setup Database Migrations & Constraints',
            description: 'Verify foreign keys and indexing in SQLite schema.',
            status: 'todo',
            priority: 'high',
            project_id: projectId
        }, { 'Authorization': `Bearer ${adminToken}` });
        if (res6.status === 201 && res6.body.data) {
            console.log(`  └─ Status: 201 Created | Task ID: #${res6.body.data.id} ("${res6.body.data.title}") ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res6.status} ❌ FAIL\n`);
            failed++;
        }

        // 7. Get Projects (Expect 200)
        console.log('Test 7: GET /api/projects (Fetch Authenticated Projects)');
        const res7 = await makeRequest('/api/projects', 'GET', null, {
            'Authorization': `Bearer ${memberToken}`
        });
        if (res7.status === 200 && Array.isArray(res7.body.data)) {
            console.log(`  └─ Status: 200 OK | Found ${res7.body.data.length} project(s) ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res7.status} ❌ FAIL\n`);
            failed++;
        }

        // 8. Get Tasks (Expect 200)
        console.log('Test 8: GET /api/tasks (Fetch Authenticated Tasks)');
        const res8 = await makeRequest('/api/tasks', 'GET', null, {
            'Authorization': `Bearer ${memberToken}`
        });
        if (res8.status === 200 && Array.isArray(res8.body.data)) {
            console.log(`  └─ Status: 200 OK | Found ${res8.body.data.length} task(s) ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Failed with status ${res8.status} ❌ FAIL\n`);
            failed++;
        }

        // 9. Unauthenticated Access Protection (Expect 401)
        console.log('Test 9: GET /api/projects without token (Security Check)');
        const res9 = await makeRequest('/api/projects', 'GET');
        if (res9.status === 401) {
            console.log(`  └─ Status: 401 Unauthorized | Endpoint properly protected ✅ PASS\n`);
            passed++;
        } else {
            console.error(`  └─ Expected 401, got ${res9.status} ❌ FAIL\n`);
            failed++;
        }

        console.log('======================================================');
        console.log(`🏁 CAPSTONE E2E RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('======================================================\n');

        if (failed > 0) process.exitCode = 1;
    } catch (err) {
        console.error('E2E Test Runner Error:', err);
        process.exitCode = 1;
    } finally {
        if (testServer) testServer.close();
        process.exit(process.exitCode || 0);
    }
}

runE2ETests();
