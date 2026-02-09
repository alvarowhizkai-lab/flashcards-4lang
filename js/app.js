// Global state
let vocab = [];
let learned = new Set();
let quizHist = [];
let idx = 0;
let cat = 'all';

// Quiz state
let qList = [];
let qIdx = 0;
let qScore = 0;

// Init
document.addEventListener('DOMContentLoaded', async () => {
    loadData();
    await loadVocab();
    bindEvents();
    showCard(0);
    updateStats();
});

// Load progress
function loadData() {
    try {
        const d = JSON.parse(localStorage.getItem('fc4-prog') || '{}');
        learned = new Set(d.learned || []);
        quizHist = d.quiz || [];
    } catch(e) {}
}

// Save progress
function saveData() {
    localStorage.setItem('fc4-prog', JSON.stringify({
        learned: [...learned],
        quiz: quizHist
    }));
}

// Load vocabulary
async function loadVocab() {
    try {
        const r = await fetch('data/vocabulary.json');
        const d = await r.json();
        vocab = [...d.tech, ...d.ev, ...d.trade];
        shuffle();
    } catch(e) {
        console.error('Load vocab error:', e);
    }
}

// Shuffle
function shuffle() {
    for (let i = vocab.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vocab[i], vocab[j]] = [vocab[j], vocab[i]];
    }
}

// Show card
function showCard(i) {
    if (!vocab.length) return;
    idx = (i % vocab.length + vocab.length) % vocab.length;
    const v = vocab[idx];
    
    // Reset flip
    document.getElementById('flashcard').classList.remove('flipped');
    
    // Update front
    document.getElementById('word-en').textContent = v.english;
    document.getElementById('word-phonetic').textContent = v.phonetic ? `/${v.phonetic}/` : '';
    document.getElementById('trans-es').textContent = v.spanish;
    document.getElementById('trans-pt').textContent = v.portuguese;
    document.getElementById('trans-cn').textContent = v.chinese;
    
    // Update back
    document.getElementById('ex-cn').textContent = v.example_cn;
    document.getElementById('ex-en').textContent = v.example_en;
    document.getElementById('ex-es').textContent = v.example_es;
    document.getElementById('ex-pt').textContent = v.example_pt;
    
    // Update progress
    const total = vocab.length;
    document.getElementById('total-progress').textContent = `${idx + 1} / ${total}`;
    document.getElementById('study-progress').style.width = `${((idx + 1) / total) * 100}%`;
}

// Handle result
function handleResult(known) {
    const v = vocab[idx];
    if (known) {
        learned.add(v.id);
    } else {
        learned.delete(v.id);
    }
    saveData();
    updateStats();
    
    setTimeout(() => {
        let ni = idx + 1;
        if (ni >= vocab.length) {
            ni = 0;
            shuffle();
        }
        showCard(ni);
    }, 200);
}

// Bind events
function bindEvents() {
    // Flip card
    document.getElementById('flashcard').addEventListener('click', () => {
        document.getElementById('flashcard').classList.toggle('flipped');
    });
    
    // Buttons
    document.getElementById('btn-no').onclick = (e) => { e.stopPropagation(); handleResult(false); };
    document.getElementById('btn-yes').onclick = (e) => { e.stopPropagation(); handleResult(true); };
    document.getElementById('btn-shuffle').onclick = (e) => { e.stopPropagation(); shuffle(); showCard(0); };
    
    // Category filter
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            cat = b.dataset.cat;
            filterVocab();
        };
    });
    
    // Tabs
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.nav-tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            showSection(t.dataset.tab);
        };
    });
    
    // Quiz
    document.getElementById('start-quiz').onclick = startQuiz;
    
    // Reset
    document.getElementById('reset-all').onclick = () => {
        if (confirm('重置所有进度？')) {
            learned.clear();
            quizHist = [];
            saveData();
            updateStats();
        }
    };
    
    // Keyboard
    document.addEventListener('keydown', e => {
        const sec = document.querySelector('.section.active').id;
        if (sec === 'study-section') {
            if (e.key === 'ArrowLeft') handleResult(false);
            else if (e.key === 'ArrowRight') handleResult(true);
            else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('flashcard').classList.toggle('flipped');
            }
        }
    });
}

// Filter vocab
function filterVocab() {
    loadVocab().then(() => {
        if (cat !== 'all') {
            vocab = vocab.filter(v => v.category === cat);
        }
        showCard(0);
    });
}

// Show section
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(name + '-section').classList.add('active');
    if (name === 'stats') updateStats();
}

// Update stats
function updateStats() {
    const total = vocab.length;
    const learn = vocab.filter(v => learned.has(v.id)).length;
    const qTotal = quizHist.reduce((a, b) => a + b.total, 0);
    const qCorrect = quizHist.reduce((a, b) => a + b.correct, 0);
    const rate = qTotal ? Math.round((qCorrect / qTotal) * 100) : 0;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-learned').textContent = learn;
    document.getElementById('stat-mistakes').textContent = vocab.filter(v => learned.has(v.id) === false).length;
    document.getElementById('stat-rate').textContent = rate + '%';
    
    // Categories
    ['tech', 'ev', 'trade'].forEach(c => {
        const arr = vocab.filter(v => v.category === c);
        const l = arr.filter(v => learned.has(v.id)).length;
        document.getElementById('prog-' + c).style.width = (arr.length ? (l / arr.length) * 100 : 0) + '%';
        document.getElementById('cnt-' + c).textContent = l + '/' + arr.length;
    });
}

// Quiz functions
function startQuiz() {
    const count = parseInt(document.getElementById('quiz-count').value);
    const type = document.getElementById('quiz-type').value;
    
    qList = [...vocab].sort(() => Math.random() - 0.5).slice(0, count);
    qIdx = 0;
    qScore = 0;
    showQuizQ();
}

function showQuizQ() {
    if (qIdx >= qList.length) {
        const rate = Math.round((qScore / qList.length) * 100);
        quizHist.push({ total: qList.length, correct: qScore });
        saveData();
        
        document.getElementById('quiz-q').innerHTML = `
            <div style="font-size:2rem;margin-bottom:10px;">${rate >= 70 ? '🎉' : '💪'}</div>
            <div>完成！${qScore}/${qList.length} (${rate}%)</div>
        `;
        document.getElementById('quiz-options').innerHTML = `
            <button class="quiz-option" onclick="startQuiz()">🔄 再测一次</button>
        `;
        return;
    }
    
    const v = qList[qIdx];
    const type = document.getElementById('quiz-type').value;
    let qText, ans, opts;
    
    if (type === 'pt' || (type === 'mixed' && Math.random() > 0.5)) {
        qText = v.english;
        ans = v.portuguese;
        opts = getOpts(v, 'portuguese');
    } else {
        qText = v.english;
        ans = v.spanish;
        opts = getOpts(v, 'spanish');
    }
    
    const correctIdx = Math.floor(Math.random() * 4);
    opts.splice(correctIdx, 0, ans);
    
    document.getElementById('quiz-q').textContent = qText;
    document.getElementById('quiz-info').textContent = `${qIdx + 1} / ${qList.length} | 正确: ${qScore}`;
    document.getElementById('quiz-options').innerHTML = opts.map((o, i) => 
        `<button class="quiz-option" onclick="checkQuiz(this, '${ans.replace(/'/g, "\\'")}')">${o}</button>`
    ).join('');
}

function getOpts(correct, lang) {
    const all = vocab.filter(v => v.id !== correct.id).map(v => v[lang]);
    return all.sort(() => Math.random() - 0.5).slice(0, 3);
}

function checkQuiz(btn, correct) {
    if (btn.classList.contains('answered')) return;
    btn.classList.add('answered');
    
    const opts = document.querySelectorAll('.quiz-option');
    opts.forEach(o => o.disabled = true);
    
    if (btn.textContent === correct) {
        btn.classList.add('correct');
        qScore++;
    } else {
        btn.classList.add('wrong');
        opts.forEach(o => {
            if (o.textContent === correct) o.classList.add('correct');
        });
    }
    
    setTimeout(() => {
        qIdx++;
        showQuizQ();
    }, 800);
}
