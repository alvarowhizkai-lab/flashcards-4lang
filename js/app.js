// ============ 全局状态 ============
let vocabulary = [];
let learnedWords = new Set();      // 已掌握
let mistakeWords = new Set();      // 错题本
let quizHistory = [];              // 测验历史

// 学习模式状态
let studyIndex = 0;
let studyCategory = 'all';

// 测验模式状态
let quizCurrent = 0;
let quizScore = 0;
let quizQuestions = [];
let quizAnswered = false;

// DOM缓存
const elements = {};

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    loadProgress();
    await loadVocabulary();
    setupEventListeners();
    updateStats();
    showSection('study');
});

// 缓存DOM元素
function cacheElements() {
    // 导航
    elements.navTabs = document.querySelectorAll('.nav-tab');
    elements.sections = document.querySelectorAll('.section');
    
    // 学习模式
    elements.studyCard = document.getElementById('study-card');
    elements.studyWord = document.getElementById('study-word');
    elements.studyCn = document.getElementById('study-cn');
    elements.studyEs = document.getElementById('study-es');
    elements.studyPt = document.getElementById('study-pt');
    elements.studyExCn = document.getElementById('study-ex-cn');
    elements.studyExEn = document.getElementById('study-ex-en');
    elements.studyExEs = document.getElementById('study-ex-es');
    elements.studyExPt = document.getElementById('study-ex-pt');
    elements.studyProgress = document.getElementById('study-progress');
    elements.totalProgress = document.getElementById('total-progress');
    elements.studyBtnNo = document.getElementById('study-btn-no');
    elements.studyBtnYes = document.getElementById('study-btn-yes');
    elements.studyBtnShuffle = document.getElementById('study-btn-shuffle');
    elements.catBtns = document.querySelectorAll('.cat-btn');
    
    // 错题本
    elements.mistakesList = document.getElementById('mistakes-list');
    elements.mistakesCount = document.getElementById('mistakes-count');
    elements.reviewMistakes = document.getElementById('review-mistakes');
    elements.clearMistakes = document.getElementById('clear-mistakes');
    
    // 测验
    elements.quizCard = document.getElementById('quiz-card');
    elements.quizQuestion = document.getElementById('quiz-question');
    elements.quizOptions = document.getElementById('quiz-options');
    elements.quizProgress = document.getElementById('quiz-progress');
    elements.quizScore = document.getElementById('quiz-score');
    elements.quizResult = document.getElementById('quiz-result');
    elements.resultText = document.getElementById('result-text');
    elements.quizCount = document.getElementById('quiz-count');
    elements.quizType = document.getElementById('quiz-type');
    elements.startQuiz = document.getElementById('start-quiz');
    
    // 统计
    elements.statTotal = document.getElementById('stat-total');
    elements.statLearned = document.getElementById('stat-learned');
    elements.statMistakes = document.getElementById('stat-mistakes');
    elements.statAccuracy = document.getElementById('stat-accuracy');
    elements.catTechFill = document.getElementById('cat-tech-fill');
    elements.catEvFill = document.getElementById('cat-ev-fill');
    elements.catTradeFill = document.getElementById('cat-trade-fill');
    elements.catTech = document.getElementById('cat-tech');
    elements.catEv = document.getElementById('cat-ev');
    elements.catTrade = document.getElementById('cat-trade');
    elements.resetProgress = document.getElementById('reset-progress');
}

// 加载词汇
async function loadVocabulary() {
    try {
        const response = await fetch('data/vocabulary.json');
        const data = await response.json();
        vocabulary = [...data.tech, ...data.ev, ...data.trade];
        shuffleVocabulary();
        showStudyCard(0);
        updateStats();
    } catch (error) {
        console.error('加载词汇失败:', error);
        elements.studyWord.textContent = '加载失败，请刷新';
    }
}

// 加载进度
function loadProgress() {
    try {
        const saved = localStorage.getItem('flashcards-progress');
        if (saved) {
            const data = JSON.parse(saved);
            learnedWords = new Set(data.learned || []);
            mistakeWords = new Set(data.mistakes || []);
            quizHistory = data.quizHistory || [];
        }
    } catch (e) {
        console.error('加载进度失败:', e);
    }
}

// 保存进度
function saveProgress() {
    try {
        const data = {
            learned: [...learnedWords],
            mistakes: [...mistakeWords],
            quizHistory: quizHistory
        };
        localStorage.setItem('flashcards-progress', JSON.stringify(data));
    } catch (e) {
        console.error('保存进度失败:', e);
    }
}

// 设置事件监听
function setupEventListeners() {
    // 导航
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showSection(tab.dataset.tab);
        });
    });
    
    // 学习模式
    elements.studyCard.addEventListener('click', () => {
        elements.studyCard.classList.toggle('flipped');
    });
    
    elements.studyBtnNo.addEventListener('click', (e) => {
        e.stopPropagation();
        handleStudyResult(false);
    });
    
    elements.studyBtnYes.addEventListener('click', (e) => {
        e.stopPropagation();
        handleStudyResult(true);
    });
    
    elements.studyBtnShuffle.addEventListener('click', (e) => {
        e.stopPropagation();
        shuffleVocabulary();
        showStudyCard(0);
    });
    
    // 分类筛选
    elements.catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            studyCategory = btn.dataset.category;
            shuffleVocabulary();
            showStudyCard(0);
        });
    });
    
    // 错题本
    elements.reviewMistakes.addEventListener('click', () => {
        elements.navTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="study"]').classList.add('active');
        showSection('study');
        
        // 筛选错题
        const mistakesArray = vocabulary.filter(v => mistakeWords.has(v.id));
        if (mistakesArray.length > 0) {
            vocabulary = [...mistakesArray];
            shuffleVocabulary();
            showStudyCard(0);
        }
    });
    
    elements.clearMistakes.addEventListener('click', () => {
        if (confirm('确定清空所有错题吗？')) {
            mistakeWords.clear();
            saveProgress();
            renderMistakes();
            updateStats();
        }
    });
    
    // 测验
    elements.startQuiz.addEventListener('click', startQuiz);
    
    // 统计
    elements.resetProgress.addEventListener('click', () => {
        if (confirm('确定重置所有学习进度吗？\n这将清除已掌握和错题记录。')) {
            learnedWords.clear();
            mistakeWords.clear();
            quizHistory = [];
            saveProgress();
            updateStats();
            renderMistakes();
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        const activeSection = document.querySelector('.section.active').id;
        
        if (activeSection === 'study-section') {
            if (e.key === 'ArrowLeft') {
                handleStudyResult(false);
            } else if (e.key === 'ArrowRight') {
                handleStudyResult(true);
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                elements.studyCard.classList.toggle('flipped');
            }
        }
    });
}

// ============ 学习模式 ============
function shuffleVocabulary() {
    for (let i = vocabulary.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vocabulary[i], vocabulary[j]] = [vocabulary[j], vocabulary[i]];
    }
}

function showStudyCard(index) {
    if (vocabulary.length === 0) return;
    
    studyIndex = index % vocabulary.length;
    if (studyIndex < 0) studyIndex = vocabulary.length - 1;
    
    const card = vocabulary[studyIndex];
    
    // 重置翻转
    elements.studyCard.classList.remove('flipped');
    
    // 更新正面内容
    elements.studyWord.textContent = card.english;
    elements.studyCn.textContent = card.chinese;
    elements.studyEs.textContent = card.spanish;
    elements.studyPt.textContent = card.portuguese;
    
    // 更新背面例句
    elements.studyExCn.textContent = card.example_cn;
    elements.studyExEn.textContent = card.example_en;
    elements.studyExEs.textContent = card.example_es;
    elements.studyExPt.textContent = card.example_pt;
    
    // 更新进度
    const shown = studyIndex + 1;
    const total = vocabulary.length;
    elements.totalProgress.textContent = `${shown} / ${total}`;
    elements.studyProgress.style.width = `${(shown / total) * 100}%`;
}

function handleStudyResult(known) {
    const card = vocabulary[studyIndex];
    
    if (known) {
        learnedWords.add(card.id);
        mistakeWords.delete(card.id);
    } else {
        mistakeWords.add(card.id);
    }
    
    saveProgress();
    updateStats();
    renderMistakes();
    
    // 下一张
    setTimeout(() => {
        let nextIndex = studyIndex + 1;
        if (nextIndex >= vocabulary.length) {
            nextIndex = 0;
            shuffleVocabulary();
        }
        showStudyCard(nextIndex);
    }, 300);
}

// ============ 错题本 ============
function renderMistakes() {
    const mistakes = vocabulary.filter(v => mistakeWords.has(v.id));
    elements.mistakesCount.textContent = `${mistakes.length} 词`;
    
    if (mistakes.length === 0) {
        elements.mistakesList.innerHTML = '<div class="empty-state">还没有错题，继续加油！💪</div>';
        return;
    }
    
    elements.mistakesList.innerHTML = mistakes.map(v => `
        <div class="mistakes-item" data-id="${v.id}">
            <div>
                <div class="mistakes-word">${v.english}</div>
                <div class="mistakes-trans">${v.spanish} / ${v.portuguese}</div>
            </div>
            <button class="btn btn-primary" style="flex: 0; padding: 8px 15px;" onclick="removeMistake(${v.id})">消除</button>
        </div>
    `).join('');
}

function removeMistake(id) {
    mistakeWords.delete(id);
    saveProgress();
    renderMistakes();
    updateStats();
}

// ============ 测验模式 ============
function startQuiz() {
    const count = parseInt(elements.quizCount.value);
    const type = elements.quizType.value;
    
    // 随机选题
    const shuffled = [...vocabulary];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    quizQuestions = shuffled.slice(0, count);
    quizCurrent = 0;
    quizScore = 0;
    quizHistory = [];
    
    showQuizQuestion();
}

function showQuizQuestion() {
    if (quizCurrent >= quizQuestions.length) {
        // 测验结束
        const accuracy = Math.round((quizScore / quizQuestions.length) * 100);
        elements.quizQuestion.textContent = '测验完成！🎉';
        elements.quizOptions.innerHTML = `
            <div class="quiz-result" style="display: block; background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px;">
                <div class="result-icon" style="font-size: 3rem;">${accuracy >= 70 ? '🎉' : '💪'}</div>
                <div style="font-size: 1.2rem; margin-top: 10px;">
                    正确 ${quizScore} / ${quizQuestions.length} (${accuracy}%)
                </div>
            </div>
            <button class="quiz-option" onclick="startQuiz()">🔄 再测一次</button>
        `;
        
        // 保存记录
        quizHistory.push({
            date: new Date().toISOString(),
            score: quizScore,
            total: quizQuestions.length,
            accuracy: accuracy
        });
        saveProgress();
        return;
    }
    
    const card = quizQuestions[quizCurrent];
    const type = elements.quizType.value;
    
    quizAnswered = false;
    elements.quizResult.style.display = 'none';
    
    // 生成题目
    let question, answer, options;
    
    if (type === 'en2pt' || (type === 'random' && Math.random() > 0.5)) {
        question = card.english;
        answer = card.portuguese;
        options = generateOptions(card, 'portuguese');
    } else {
        question = card.english;
        answer = card.spanish;
        options = generateOptions(card, 'spanish');
    }
    
    // 随机正确答案位置
    const correctIndex = Math.floor(Math.random() * 4);
    options.splice(correctIndex, 0, answer);
    
    elements.quizProgress.textContent = `${quizCurrent + 1} / ${quizQuestions.length}`;
    elements.quizScore.textContent = `正确: ${quizScore}`;
    elements.quizQuestion.textContent = question;
    
    elements.quizOptions.innerHTML = options.map((opt, i) => `
        <button class="quiz-option" data-answer="${opt}" onclick="checkAnswer(this, '${answer}')">${opt}</button>
    `).join('');
}

function generateOptions(correctCard, lang) {
    const allTranslations = vocabulary
        .filter(v => v.id !== correctCard.id)
        .map(v => lang === 'spanish' ? v.spanish : v.portuguese);
    
    // 随机选3个干扰项
    const shuffled = [...allTranslations];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, 3);
}

function checkAnswer(btn, correctAnswer) {
    if (quizAnswered) return;
    quizAnswered = true;
    
    const buttons = document.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.disabled = true);
    
    if (btn.dataset.answer === correctAnswer) {
        btn.classList.add('correct');
        quizScore++;
        mistakeWords.delete(vocabulary[studyIndex]?.id);
    } else {
        btn.classList.add('wrong');
        // 显示正确答案
        buttons.forEach(b => {
            if (b.dataset.answer === correctAnswer) {
                b.classList.add('correct');
            }
        });
    }
    
    saveProgress();
    
    setTimeout(() => {
        quizCurrent++;
        showQuizQuestion();
    }, 1000);
}

// ============ 统计 ============
function updateStats() {
    const total = vocabulary.length;
    const learned = vocabulary.filter(v => learnedWords.has(v.id)).length;
    const mistakes = vocabulary.filter(v => mistakeWords.has(v.id)).length;
    const quizTotal = quizHistory.length;
    const quizCorrect = quizHistory.reduce((sum, h) => sum + h.score, 0);
    const quizQTotal = quizHistory.reduce((sum, h) => sum + h.total, 0);
    const accuracy = quizQTotal > 0 ? Math.round((quizCorrect / quizQTotal) * 100) : 0;
    
    elements.statTotal.textContent = total;
    elements.statLearned.textContent = learned;
    elements.statMistakes.textContent = mistakes;
    elements.statAccuracy.textContent = `${accuracy}%`;
    
    // 分类进度
    const tech = vocabulary.filter(v => v.category === 'tech');
    const ev = vocabulary.filter(v => v.category === 'ev');
    const trade = vocabulary.filter(v => v.category === 'trade');
    
    const techLearned = tech.filter(v => learnedWords.has(v.id)).length;
    const evLearned = ev.filter(v => learnedWords.has(v.id)).length;
    const tradeLearned = trade.filter(v => learnedWords.has(v.id)).length;
    
    elements.catTech.textContent = `${techLearned} / ${tech.length}`;
    elements.catTechFill.style.width = `${(techLearned / tech.length) * 100}%`;
    
    elements.catEv.textContent = `${evLearned} / ${ev.length}`;
    elements.catEvFill.style.width = `${(evLearned / ev.length) * 100}%`;
    
    elements.catTrade.textContent = `${tradeLearned} / ${trade.length}`;
    elements.catTradeFill.style.width = `${(tradeLearned / trade.length) * 100}%`;
    
    // 更新错题本
    renderMistakes();
}

// ============ 页面切换 ============
function showSection(name) {
    elements.sections.forEach(s => s.classList.remove('active'));
    document.getElementById(`${name}-section`).classList.add('active');
    
    if (name === 'stats') {
        updateStats();
    }
}

// 暴露全局函数
window.removeMistake = removeMistake;
