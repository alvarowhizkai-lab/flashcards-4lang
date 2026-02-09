// 全局变量
let vocabulary = [];
let currentCard = null;
let currentIndex = 0;
let knownWords = new Set();
let currentCategory = 'all';
let showPTMode = false;

// DOM元素
const flashcard = document.getElementById('flashcard');
const cardFront = document.querySelector('.card-front');
const cardBack = document.querySelector('.card-back');
const wordMain = document.getElementById('word-main');
const transCn = document.getElementById('trans-cn');
const transEs = document.getElementById('trans-es');
const transPt = document.getElementById('trans-pt');
const exampleCn = document.getElementById('example-cn');
const exampleEn = document.getElementById('example-en');
const exampleEs = document.getElementById('example-es');
const examplePt = document.getElementById('example-pt');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress');
const knownBadge = document.getElementById('known-count');
const categoryBtns = document.querySelectorAll('.cat-btn');
const btnNo = document.getElementById('btn-no');
const btnYes = document.getElementById('btn-yes');
const btnShuffle = document.getElementById('btn-shuffle');
const showPtCheckbox = document.getElementById('show-pt');

// 初始化
async function init() {
    try {
        const response = await fetch('data/vocabulary.json');
        const data = await response.json();
        
        // 合并所有词汇
        vocabulary = [
            ...data.tech,
            ...data.ev,
            ...data.trade
        ];
        
        // 打乱顺序
        shuffleVocabulary();
        
        // 显示第一张卡片
        showCard(0);
        
        // 更新UI
        updateProgress();
    } catch (error) {
        console.error('加载词汇表失败:', error);
        wordMain.textContent = '加载失败，请刷新页面';
    }
}

// 打乱词汇顺序
function shuffleVocabulary() {
    for (let i = vocabulary.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vocabulary[i], vocabulary[j]] = [vocabulary[j], vocabulary[i]];
    }
}

// 显示卡片
function showCard(index) {
    if (vocabulary.length === 0) return;
    
    // 重置卡片状态
    flashcard.classList.remove('flipped');
    
    // 更新索引
    currentIndex = index % vocabulary.length;
    if (currentIndex < 0) currentIndex = vocabulary.length - 1;
    
    currentCard = vocabulary[currentIndex];
    
    // 更新正面内容
    wordMain.textContent = currentCard.english;
    transCn.textContent = currentCard.chinese;
    transEs.textContent = currentCard.spanish;
    transPt.textContent = currentCard.portuguese;
    
    // 更新背面内容（例句）
    exampleCn.textContent = currentCard.example_cn;
    exampleEn.textContent = currentCard.example_en;
    exampleEs.textContent = currentCard.example_es;
    examplePt.textContent = currentCard.example_pt;
    
    // 葡语高亮模式
    updatePTMode();
    
    // 更新进度
    updateProgress();
}

// 更新葡语高亮
function updatePTMode() {
    const ptBlock = document.querySelector('.pt-highlight');
    if (showPTMode) {
        transPt.style.color = '#ffd700';
        transPt.style.fontWeight = 'bold';
        if (ptBlock) {
            ptBlock.style.display = 'flex';
        }
    } else {
        transPt.style.color = '#fff';
        transPt.style.fontWeight = 'normal';
        if (ptBlock) {
            ptBlock.style.display = 'flex';
        }
    }
}

// 更新进度
function updateProgress() {
    const shown = vocabulary.filter((_, idx) => idx <= currentIndex).length;
    const total = vocabulary.length;
    const percent = total > 0 ? (shown / total) * 100 : 0;
    
    progressText.textContent = `${shown} / ${total}`;
    progressFill.style.width = `${percent}%`;
    knownBadge.textContent = `已学: ${knownWords.size}`;
}

// 卡片翻转
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
});

// 不认识
btnNo.addEventListener('click', (e) => {
    e.stopPropagation();
    knownWords.delete(currentCard.id);
    
    setTimeout(() => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= vocabulary.length) {
            nextIndex = 0;
        }
        showCard(nextIndex);
    }, 300);
});

// 认识
btnYes.addEventListener('click', (e) => {
    e.stopPropagation();
    knownWords.add(currentCard.id);
    
    setTimeout(() => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= vocabulary.length) {
            nextIndex = 0;
            shuffleVocabulary();
        }
        showCard(nextIndex);
    }, 300);
});

// 随机
btnShuffle.addEventListener('click', (e) => {
    e.stopPropagation();
    shuffleVocabulary();
    showCard(0);
});

// 分类筛选
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterVocabulary();
    });
});

// 过滤词汇
async function filterVocabulary() {
    try {
        const response = await fetch('data/vocabulary.json');
        const data = await response.json();
        
        if (currentCategory === 'all') {
            vocabulary = [...data.tech, ...data.ev, ...data.trade];
        } else {
            vocabulary = data[currentCategory] || [];
        }
        
        knownWords.clear();
        showCard(0);
    } catch (error) {
        console.error('过滤词汇失败:', error);
    }
}

// 葡语模式切换
showPtCheckbox.addEventListener('change', (e) => {
    showPTMode = e.target.checked;
    updatePTMode();
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            flashcard.click();
            break;
        case 'ArrowRight':
            btnYes.click();
            break;
        case 'ArrowLeft':
            btnNo.click();
            break;
        case 's':
        case 'S':
            btnShuffle.click();
            break;
    }
});
