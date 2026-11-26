let currentQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let totalMaxPoints = 0;

const startScreen = document.getElementById('start-screen');
const testScreen = document.getElementById('test-screen');
const resultScreen = document.getElementById('result-screen');
const cardsContainer = document.getElementById('cards-container');
const questionText = document.getElementById('question-text');
const questionTypeHint = document.getElementById('question-type-hint');
const answersContainer = document.getElementById('answers-container');
const answerBtn = document.getElementById('answer-btn');

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function startTest() {
    currentQuestions = shuffle([...questions]);
    currentIndex = 0;
    userAnswers = [];
    totalMaxPoints = currentQuestions.reduce((sum, q) => sum + q.points, 0);

    startScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    testScreen.classList.add('active');
    
    renderCards();
    loadQuestion();
}

function renderCards() {
    cardsContainer.innerHTML = '';
    currentQuestions.forEach((_, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.textContent = index + 1;
        
        if (index === currentIndex) card.classList.add('current');
        if (userAnswers[index] !== undefined) card.classList.add('done');
        
        cardsContainer.appendChild(card);
    });
}

function loadQuestion() {
    const q = currentQuestions[currentIndex];
    questionText.textContent = q.text;
    answersContainer.innerHTML = '';
    answerBtn.disabled = true;
    
    if (q.type === 'radio') {
        questionTypeHint.textContent = "Выберите один вариант ответа:";
        const shuffledOptions = shuffle([...q.options]);
        
        shuffledOptions.forEach(opt => {
            const label = document.createElement('label');
            label.classList.add('answer-label');
            label.innerHTML = `<input type="radio" name="q_answer" value="${opt}"> <span>${opt}</span>`;
            label.querySelector('input').addEventListener('change', () => answerBtn.disabled = false);
            answersContainer.appendChild(label);
        });
        
    } else if (q.type === 'checkbox') {
        questionTypeHint.textContent = "Выберите несколько вариантов ответа:";
        const shuffledOptions = shuffle([...q.options]);
        
        shuffledOptions.forEach(opt => {
            const label = document.createElement('label');
            label.classList.add('answer-label');
            label.innerHTML = `<input type="checkbox" name="q_answer" value="${opt}"> <span>${opt}</span>`;
            label.querySelector('input').addEventListener('change', () => {
                const checked = answersContainer.querySelectorAll('input[type="checkbox"]:checked');
                answerBtn.disabled = checked.length === 0;
            });
            answersContainer.appendChild(label);
        });
        
    } else if (q.type === 'text') {
        questionTypeHint.textContent = "Впишите ответ в строку:";
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'text-answer';
        input.placeholder = "Ваш ответ...";
        input.classList.add('text-input');
        
        input.addEventListener('input', (e) => {
            answerBtn.disabled = e.target.value.trim().length === 0;
        });
        
        answersContainer.appendChild(input);
    }
    
    renderCards();
}

answerBtn.addEventListener('click', () => {
    const q = currentQuestions[currentIndex];
    let selected = [];

    if (q.type === 'radio') {
        const checked = answersContainer.querySelector('input[name="q_answer"]:checked');
        if (checked) selected.push(checked.value);
    } else if (q.type === 'checkbox') {
        const checked = answersContainer.querySelectorAll('input[name="q_answer"]:checked');
        checked.forEach(c => selected.push(c.value));
    } else if (q.type === 'text') {
        const textVal = document.getElementById('text-answer').value.trim().toLowerCase();
        selected.push(textVal);
    }

    userAnswers[currentIndex] = selected;
    
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        loadQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    testScreen.classList.remove('active');
    resultScreen.classList.add('active');

    let earnedPoints = 0;
    let mistakesCount = 0;
    
    const mistakesContainer = document.getElementById('mistakes-container');
    const mistakesList = document.getElementById('mistakes-list');
    
    // Очищаем старые результаты при перезапуске
    mistakesList.innerHTML = '';

    // Проверяем каждый вопрос
    currentQuestions.forEach((q, index) => {
        const uAns = userAnswers[index] || [];
        let isCorrect = false;

        // Логика проверки
        if (q.type === 'text') {
            const userText = (uAns[0] || '').trim().toLowerCase();
            isCorrect = q.correct.some(c => c.trim().toLowerCase() === userText);
        } else if (q.type === 'checkbox') {
            isCorrect = q.correct.length === uAns.length && q.correct.every(c => uAns.includes(c));
        } else {
            isCorrect = q.correct[0] === uAns[0];
        }

        if (isCorrect) {
            earnedPoints += q.points;
        } else {
            mistakesCount++;
            
            // Создаем HTML-блок для ошибки
            const item = document.createElement('div');
            item.classList.add('mistake-item');
            
            let userAnswerText = uAns.length > 0 ? uAns.join(', ') : '<i>Нет ответа</i>';
            let correctAnswerText = q.correct.join(', ');

            item.innerHTML = `
                <div class="mistake-question">${index + 1}. ${q.text}</div>
                <div class="user-answer"><b>Ваш ответ:</b> ${userAnswerText}</div>
                <div class="correct-answer"><b>Правильный ответ:</b> ${correctAnswerText}</div>
            `;
            mistakesList.appendChild(item);
        }
    });

    // Показываем блок ошибок, если они есть
    if (mistakesCount > 0) {
        mistakesContainer.style.display = 'block';
    } else {
        mistakesContainer.style.display = 'none';
    }

    // Подсчет процентов и оценок
    const percent = Math.round((earnedPoints / totalMaxPoints) * 100);
    let grade = 2;

    if (percent >= 85) grade = 5;
    else if (percent >= 75) grade = 4;
    else if (percent >= 50) grade = 3;

    document.getElementById('result-score').textContent = `Вы набрали ${percent}% (${earnedPoints} из ${totalMaxPoints} возможных баллов)`;
    
    const gradeEl = document.getElementById('result-grade');
    gradeEl.textContent = `Оценка: ${grade}`;
    
    if (grade === 2) gradeEl.style.color = '#dc3545';
    else if (grade === 3) gradeEl.style.color = '#ffc107';
    else if (grade === 4) gradeEl.style.color = '#17a2b8';
    else gradeEl.style.color = '#28a745';
}

document.getElementById('start-btn').addEventListener('click', startTest);
document.getElementById('restart-btn').addEventListener('click', () => {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
});
