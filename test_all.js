const puppeteer = require('puppeteer');

async function runTests() {
    console.log("Starting Puppeteer test for all Escape The Room activities...");
    
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    try {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
        console.log("-> Navigating to http://localhost:3000/");
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        
        // --- MOCK BACKEND API ---
        await page.setRequestInterception(true);
        let currentStage = 1;
        
        page.on('request', request => {
            if (request.url().includes('/api/teams/TEAM_TEST')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'TEAM_TEST',
                        stage: currentStage,
                        status: 'active',
                        timeEvents: [],
                        resetEvents: []
                    })
                });
            } else if (request.url().includes('/api/settings')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ gameOver: 'false' })
                });
            } else if (request.url().includes('/api/teams') && request.method() === 'POST') {
                const postData = JSON.parse(request.postData() || '{}');
                if (postData.stage) {
                    currentStage = postData.stage;
                }
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, team: { vaultFinishRank: 1, stage: currentStage } })
                });
            } else if (request.url().includes('/api/')) {
                request.respond({ status: 200, body: '{}' });
            } else {
                request.continue();
            }
        });

        // --- STAGE 0: LOGIN BYPASS ---
        console.log("-> Bypassing Login via LocalStorage");
        await page.evaluate(() => {
            localStorage.setItem('escape_team_id', 'TEAM_TEST');
            localStorage.setItem('escape_unlocked_level', '1');
        });
        
        await page.goto('http://localhost:3000/home.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#navTeamId', { timeout: 5000 });
        const dashTeam = await page.$eval('#navTeamId', el => el.textContent);
        if (dashTeam !== 'TEAM_TEST') throw new Error("Dashboard team ID mismatch");
        console.log("✓ Login successful");

        // Click PROCEED to Stage 1
        await page.evaluate(() => document.querySelector('#card-act-1 .unlocked-btn').click());
        await page.waitForSelector('#startPlayingBtn', { visible: true, timeout: 5000 });
        await page.click('#startPlayingBtn');
        await page.waitForSelector('#crosswordGrid', { visible: true, timeout: 5000 });
        console.log("✓ Navigated to Stage 1: Crossword");
        
        // --- STAGE 1: CROSSWORD ---
        console.log("-> Solving Crossword");
        await page.evaluate(() => {
            const puzzleDataStr = localStorage.getItem('escape_crossword_TEAM_TEST');
            if (!puzzleDataStr) throw new Error("No crossword data");
            const puzzleData = JSON.parse(puzzleDataStr);
            const inputs = document.querySelectorAll('input.crossword-cell-input, .crossword-cell input');
            
            inputs.forEach(input => {
                const r = input.dataset.row;
                const c = input.dataset.col;
                const char = puzzleData.grid[r][c];
                if (char) {
                    input.value = char;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            
            document.getElementById('checkButton').click();
        });
        
        await page.waitForSelector('#successModal', { visible: true, timeout: 5000 });
        const cwScore = await page.$eval('#completeScore', el => el.textContent);
        console.log(`✓ Crossword completed. Score: ${cwScore}`);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
            page.click('#closeSuccess')
        ]);
        
        await page.waitForSelector('#card-act-2 .unlocked-btn', { visible: true, timeout: 5000 });
        console.log("✓ Returned to Dashboard at Stage 2");
        
        // --- STAGE 2: SCAVENGER HUNT ---
        await page.evaluate(() => document.querySelector('#card-act-2 .unlocked-btn').click());
        await page.waitForSelector('#startPlayingBtn', { visible: true, timeout: 5000 });
        await page.click('#startPlayingBtn');
        await page.waitForSelector('#workspaceSection', { visible: true, timeout: 5000 });
        console.log("✓ Navigated to Stage 2: Scavenger Hunt");
        
        console.log("-> Solving Scavenger Hunt");
        await page.evaluate(async () => {
            console.log("Starting clue loop, CLUES length: " + CLUES.length);
            for (let i = 0; i < CLUES.length; i++) {
                console.log("Answering clue " + i + " with: " + CLUES[i].answer);
                document.getElementById('answerInput').value = CLUES[i].answer;
                document.getElementById('submitAnswerBtn').click();
                await new Promise(r => setTimeout(r, 1600));
            }
            console.log("Finished clue loop. Current index is: " + currentClueIndex);
        });
        
        await page.waitForSelector('#completionOverlay', { visible: true, timeout: 20000 });
        const shScore = await page.$eval('#finalScore', el => el.textContent);
        console.log(`✓ Scavenger Hunt completed. Score: ${shScore}`);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
            page.click('.proceed-btn')
        ]);
        await page.waitForSelector('#card-act-3 .unlocked-btn', { visible: true, timeout: 5000 });
        console.log("✓ Returned to Dashboard at Stage 3");

        // --- STAGE 3: CIPHER CHASE ---
        await page.evaluate(() => document.querySelector('#card-act-3 .unlocked-btn').click());
        await page.waitForSelector('#startPlayingBtn', { visible: true, timeout: 5000 });
        await page.click('#startPlayingBtn');
        await page.waitForSelector('#caesarAnswerInput', { visible: true, timeout: 5000 });
        console.log("✓ Navigated to Stage 3: Cipher Chase");

        console.log("-> Solving Cipher Chase");
        await page.evaluate(async () => {
            function getAnswers(seed) {
                seed = parseInt(seed, 10);
                function randomInt(max) {
                    seed = (seed * 9301 + 49297) % 233280;
                    return Math.floor((seed / 233280) * max);
                }
                const STAGE3_WORDS = [
                    'CYBER', 'ENIGMA', 'MATRIX', 'KERNEL', 
                    'BINARY', 'SECURE', 'NEXUS', 'BUFFER', 
                    'SOCKET', 'ROUTER', 'SERVER', 'VAULT', 
                    'SYSTEM', 'PORTAL', 'HEXAGON', 'DECODE', 
                    'PYTHON', 'PIXELS', 'LOGGER', 'SENSORS', 
                    'SCRIPTS', 'COMPASS', 'OVERLAY', 'LANTERN'
                ];
                
                const w1Index = randomInt(STAGE3_WORDS.length);
                const w2Index = randomInt(STAGE3_WORDS.length);
                const w3Index = randomInt(STAGE3_WORDS.length);
                const w4Index = randomInt(STAGE3_WORDS.length);
                const w5Index = randomInt(STAGE3_WORDS.length);
                const w6Index = randomInt(STAGE3_WORDS.length);
                const w7Index = randomInt(STAGE3_WORDS.length);
                const w8Index = randomInt(STAGE3_WORDS.length);
                const w9Index = randomInt(STAGE3_WORDS.length);
                
                return [
                    STAGE3_WORDS[w1Index],
                    STAGE3_WORDS[w2Index] + " " + STAGE3_WORDS[w3Index],
                    STAGE3_WORDS[w4Index] + " " + STAGE3_WORDS[w5Index],
                    STAGE3_WORDS[w6Index] + " " + STAGE3_WORDS[w7Index],
                    STAGE3_WORDS[w8Index] + " " + STAGE3_WORDS[w9Index]
                ];
            }
            const seedStr = localStorage.getItem('escape_cipher_seed');
            if(!seedStr) throw new Error("No seed found");
            const answers = getAnswers(seedStr);
            
            for(let i=0; i<5; i++) {
                document.getElementById('caesarAnswerInput').value = answers[i];
                document.querySelector('#cipherChaseForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                await new Promise(r => setTimeout(r, 600));
            }
        });
        
        await page.waitForSelector('#successModal', { visible: true, timeout: 5000 });
        const ccScore = await page.$eval('#cipherScore', el => el.textContent);
        console.log(`✓ Cipher Chase completed. Score: ${ccScore}`);
        
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
        console.log("✓ Returned to Dashboard at Stage 4");
        
        // --- STAGE 4: VAULT ---
        await page.evaluate(() => document.querySelector('#card-act-4 .unlocked-btn').click());
        await page.waitForSelector('.cards', { visible: true, timeout: 5000 });
        console.log("✓ Navigated to Stage 4: StreamWave Vault");

        console.log("-> Solving StreamWave Vault");
        await page.evaluate(async () => {
            for(let i=1; i<=6; i++) {
                const qs = document.querySelector(`.secret-qr-spot[data-qr-index="${i}"], .poster-qr[data-qr-index="${i}"]`);
                if(qs) {
                    qs.click();
                    await new Promise(r => setTimeout(r, 500));
                    document.getElementById('closeQr').click();
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        });
        
        await page.waitForSelector('#victoryOverlay', { visible: true, timeout: 5000 });
        const vScore = await page.$eval('#vaultScore', el => el.textContent);
        console.log(`✓ Vault completed! Final Score: ${vScore}`);
        
        console.log("\n=============================================");
        console.log("🎉 ALL STAGES PASSED SUCCESSFULLY! 🎉");
        console.log("=============================================");
        
    } catch (e) {
        console.error("\n❌ TEST FAILED:");
        console.error(e.message);
        console.log("Current URL:", page.url());
        console.log("Current body HTML snippet:", await page.evaluate(() => document.body.innerHTML.substring(0, 1000)));
        process.exit(1);
    } finally {
        await browser.close();
        process.exit(0);
    }
}

runTests();
