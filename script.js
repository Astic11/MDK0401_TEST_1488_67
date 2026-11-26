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

// Перемешивание массива (Алгоритм Фишера-Йетса)
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
    // Копируем вопросы и перемешиваем их
    currentQuestions = shuffle([...questions]);
    currentIndex = 0;
    userAnswers = [];
    totalMaxPoints = currentQuestions.reduce((sum, q) => sum + q.points, 0);

    startScreen.classList.remove('active');
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
        // Если на вопрос уже ответили, закрашиваем карточку
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

    // Сохраняем ответ пользователя
    userAnswers[currentIndex] = selected;
    
    // Переход к следующему вопросу или результатам
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

    // Подсчет баллов
    currentQuestions.forEach((q, index) => {
        const uAns = userAnswers[index] || [];
        
        if (q.type === 'text') {
            // Для текста проверяем, совпадает ли с любым из правильных вариантов (без учета регистра)
            const isCorrect = q.correct.some(c => c.toLowerCase() === uAns[0]);
            if (isCorrect) earnedPoints += q.points;
        } else if (q.type === 'checkbox') {
            // Для чекбоксов количество и сами варианты должны полностью совпасть
            const isCorrect = q.correct.length === uAns.length && q.correct.every(c => uAns.includes(c));
            if (isCorrect) earnedPoints += q.points;
        } else {
            // Для радио
            const isCorrect = q.correct[0] === uAns[0];
            if (isCorrect) earnedPoints += q.points;
        }
    });

    // Высчитываем процент от максимального возможного балла
    const percent = Math.round((earnedPoints / totalMaxPoints) * 100);
    let grade = 2;

    if (percent >= 85) grade = 5;
    else if (percent >= 75) grade = 4;
    else if (percent >= 50) grade = 3;

    document.getElementById('result-score').textContent = `Вы набрали ${percent}% (${earnedPoints} из ${totalMaxPoints} возможных баллов)`;
    
    const gradeEl = document.getElementById('result-grade');
    gradeEl.textContent = `Оценка: ${grade}`;
    
    // Красим оценку в зависимости от результата
    if (grade === 2) gradeEl.style.color = '#dc3545'; // красный
    else if (grade === 3) gradeEl.style.color = '#ffc107'; // желтый
    else if (grade === 4) gradeEl.style.color = '#17a2b8'; // голубой
    else gradeEl.style.color = '#28a745'; // зеленый
}

// Обработчики кнопок старта и рестарта
document.getElementById('start-btn').addEventListener('click', startTest);
document.getElementById('restart-btn').addEventListener('click', () => {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
});