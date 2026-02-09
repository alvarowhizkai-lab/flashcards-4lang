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
const cardCategory = document.getElementById('card-category');
const cardFrontWord = document.getElementById('card-front');
const wordEn = document.getElementById('word-en');
const wordEs = document.getElementById('word-es');
const wordPt = document.getElementById('word-pt');
const exampleCn = document.getElementById('example-cn');
const exampleEn = document.getElementById('example-en');
const exampleEs = document.getElementById('example-es');
const examplePt = document.getElementById('example-pt');
const examplesDiv = document.getElementById('examples');
const examplesToggle = document.getElementById('examples-toggle');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress');
const knownBadge = document.getElementById('known-count');
const categoryBtns = document.querySelectorAll('.cat-btn');
const btnNo = document.getElementById('btn-no');
const btnYes = document.getElementById('btn-yes');
const btnShuffle = document.getElementById('btn-shuffle');
const showPtCheckbox = document.getElementById('show-pt');

// 分类映射
const categoryMap = {
    'tech': '科技',
    'ev': '电动车',
    'trade': '外贸'
};

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
        cardFrontWord.textContent = '加载失败，请刷新页面';
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
    examplesDiv.style.display = 'none';
    examplesToggle.textContent = '点击显示例句';
    
    // 更新索引
    currentIndex = index % vocabulary.length;
    if (currentIndex < 0) currentIndex = vocabulary.length - 1;
    
    currentCard = vocabulary[currentIndex];
    
    // 更新卡片内容
    cardCategory.textContent = categoryMap[currentCard.category] || currentCard.category;
    cardFrontWord.textContent = currentCard.chinese;
    
    wordEn.textContent = currentCard.english;
    wordEs.textContent = currentCard.spanish;
    wordPt.textContent = currentCard.portuguese;
    
    exampleCn.textContent = currentCard.example_cn;
    exampleEn.textContent = currentCard.example_en;
    exampleEs.textContent = currentCard.example_es;
    examplePt.textContent = currentCard.example_pt;
    
    // 根据模式调整显示
    updateDisplayMode();
    
    // 更新进度
    updateProgress();
}

// 更新显示模式
function updateDisplayMode() {
    if (showPTMode) {
        wordPt.style.color = '#e74c3c';
        wordPt.style.fontWeight = 'bold';
    } else {
        wordPt.style.color = '#333';
        wordPt.style.fontWeight = 'normal';
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
    if (!flashcard.classList.contains('flipped')) {
        flashcard.classList.add('flipped');
    }
});

// 显示例句
examplesToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (examplesDiv.style.display === 'none') {
        examplesDiv.style.display = 'block';
        examplesToggle.textContent = '点击隐藏例句';
    } else {
        examplesDiv.style.display = 'none';
        examplesToggle.textContent = '点击显示例句';
    }
});

// 不认识
btnNo.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 标记为已学
    knownWords.add(currentCard.id);
    
    // 稍微延迟后下一张
    setTimeout(() => {
        let nextIndex = currentIndex + 1;
        
        // 如果是最后一个，回到开头
        if (nextIndex >= vocabulary.length) {
            nextIndex = 0;
            // 重新打乱未学的词
            const unknownWords = vocabulary.filter(w => !knownWords.has(w.id));
            if (unknownWords.length > 0) {
                vocabulary = shuffleWithUnknown(vocabulary, knownWords);
            }
        }
        
        showCard(nextIndex);
    }, 300);
});

// 认识
btnYes.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 标记为已学
    knownWords.add(currentCard.id);
    
    // 稍微延迟后下一张
    setTimeout(() => {
        let nextIndex = currentIndex + 1;
        
        // 如果是最后一个，回到开头
        if (nextIndex >= vocabulary.length) {
            nextIndex = 0;
            // 重新打乱
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
        // 移除active状态
        categoryBtns.forEach(b => b.classList.remove('active'));
        // 添加active状态
        btn.classList.add('active');
        
        currentCategory = btn.dataset.category;
        
        // 重新加载词汇
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
        
        // 重置状态
        knownWords.clear();
        showCard(0);
    } catch (error) {
        console.error('过滤词汇失败:', error);
    }
}

// 打乱但保留已学词位置
function shuffleWithUnknown(arr, knownSet) {
    const unknown = arr.filter(w => !knownSet.has(w.id));
    const known = arr.filter(w => knownSet.has(w.id));
    
    shuffleVocabulary.call(unknown);
    
    return [...unknown, ...known];
}

// 葡语模式切换
showPtCheckbox.addEventListener('change', (e) => {
    showPTMode = e.target.checked;
    updateDisplayMode();
    if (flashcard.classList.contains('flipped')) {
        flashcard.classList.remove('flipped');
        setTimeout(() => flashcard.classList.add('flipped'), 50);
    }
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
