
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

let selectedDepartment = "";
let selectedSubject = "";
let selectedSubjectName = "";
let selectedMode = "";

let loadedSubjectFiles = {};

const departments = {
    pediatric: {
        title: "Pediatric Department",
        subjects: {
            pediatricNursing: "Pediatric Nursing",
            pediatricMedicine: "Pediatric Medicine",
            pediatricSurgery: "Pediatric Surgery",
            evidenceBasedPractice: "Evidence-Based Practice",
            pediatricSpecialNeeds: "Pediatric with Special Needs",
            stressAndCoping: "Stress and Coping",
            sportsCulture: "Sports Culture"
        }
    },

    obgyn: {
        title: "Obstetrics & Gynecological Health Department",
        subjects: {
            obstetricNursing: "Obstetric Nursing",
            obstetricsGynecology: "Obstetrics and Gynecology",
            criticalCareEmergency: "Critical Care and Emergency Nursing",
            statistics: "Statistics",
            humanBehavior: "Human Behavior",
            pediatricEmergencies: "Pediatric Emergencies"
        }
    }
};

/* Hide all screens */

function hideAllScreens() {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });
}

/* Welcome screen */

function showDepartments() {
    hideAllScreens();
    document.getElementById("department-screen").classList.remove("hidden");
}

/* Department selection */

function showSubjects(departmentKey) {
    selectedDepartment = departmentKey;

    hideAllScreens();

    const department = departments[departmentKey];

    document.getElementById("department-title").textContent =
        department.title + " - Select Subject";

    const container = document.getElementById("subjects-container");

    container.innerHTML = "";

    Object.entries(department.subjects).forEach(([key, name]) => {
        const button = document.createElement("button");

        button.textContent = name;

        button.onclick = () => selectSubject(key, name);

        container.appendChild(button);
    });

    document.getElementById("subject-screen").classList.remove("hidden");
}

/* Subject selection */

function selectSubject(subjectKey, subjectName) {
    selectedSubject = subjectKey;
    selectedSubjectName = subjectName;

    hideAllScreens();

    document.getElementById("subject-selected-title").textContent =
        subjectName + " - Select Quiz Mode";

    document.getElementById("mode-screen").classList.remove("hidden");
}

/* Load the selected subject file */

function loadSubjectFile(subjectKey) {

    if (loadedSubjectFiles[subjectKey]) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src = "questions/" + subjectKey + ".js";

        script.onload = () => {
            loadedSubjectFiles[subjectKey] = true;
            resolve();
        };

        script.onerror = () => {
            reject(
                new Error(
                    "Could not load questions for " + subjectKey
                )
            );
        };

        document.body.appendChild(script);
    });
}

/* Start quiz */

async function startQuiz(mode) {

    selectedMode = mode;

    const nextButton = document.getElementById("next-btn");

    nextButton.disabled = true;

    try {

        await loadSubjectFile(selectedSubject);

        const bank = window.subjectQuestionBank;

        if (!bank || bank.subject !== selectedSubject) {
            throw new Error("Subject question file is missing or incorrect.");
        }

        let mcqQuestions = bank.mcq || [];
        let tfQuestions = bank.tf || [];

        if (mode === "mcq") {
            currentQuestions = [...mcqQuestions];
        }

        else if (mode === "tf") {
            currentQuestions = [...tfQuestions];
        }

        else {
            currentQuestions = [
                ...mcqQuestions,
                ...tfQuestions
            ];
        }

        if (currentQuestions.length === 0) {
            alert("No questions have been added to this subject yet.");
            return;
        }

        currentIndex = 0;
        score = 0;
        answered = false;

        hideAllScreens();

        document.getElementById("quiz-screen").classList.remove("hidden");

        showQuestion();

    } catch (error) {

        alert(
            "Questions could not be loaded. Please check the subject file."
        );

        console.error(error);
    }
}

/* Display question */

function showQuestion() {

    answered = false;

    const question = currentQuestions[currentIndex];

    document.getElementById("question-counter").textContent =
        "Question " + (currentIndex + 1) +
        " of " + currentQuestions.length;

    document.getElementById("score-display").textContent =
        "Score: " + score;

    document.getElementById("question-text").textContent =
        question.question;

    document.getElementById("feedback").innerHTML = "";

    const optionsContainer =
        document.getElementById("options-container");

    optionsContainer.innerHTML = "";

    let options;

    if (question.type === "tf") {
        options = ["True", "False"];
    }

    else if (question.options) {
        options = question.options;
    }

    else {
        options = [];
    }

    options.forEach((option, index) => {

        const button = document.createElement("button");

        button.className = "option-btn";
        button.textContent = option;

        button.onclick = () => selectAnswer(option);

        optionsContainer.appendChild(button);
    });

    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

    document.getElementById("progress-bar").style.width =
        progress + "%";

    const nextButton = document.getElementById("next-btn");

    nextButton.disabled = true;

    if (currentIndex === currentQuestions.length - 1) {
        nextButton.textContent = "Finish";
    } else {
        nextButton.textContent = "Next";
    }
}

/* Check answer */

function selectAnswer(selectedOption) {

    if (answered) return;

    answered = true;

    const question = currentQuestions[currentIndex];

    const buttons =
        document.querySelectorAll(".option-btn");

    let correctAnswer;

    if (question.type === "tf") {

        if (typeof question.answer === "boolean") {
            correctAnswer = question.answer ? "True" : "False";
        }

        else {
            correctAnswer = String(question.answer);
        }

    } else {

        correctAnswer = question.answer;
    }

    const isCorrect =
        String(selectedOption) === String(correctAnswer);

    buttons.forEach(button => {

        button.disabled = true;

        if (button.textContent === String(correctAnswer)) {
            button.classList.add("correct");
        }

        if (
            button.textContent === String(selectedOption) &&
            !isCorrect
        ) {
            button.classList.add("wrong");
        }
    });

    const feedback = document.getElementById("feedback");

    if (isCorrect) {

        score++;

        feedback.innerHTML =
            '<p class="correct-feedback">Correct Answer!</p>';

    } else {

        feedback.innerHTML =
            '<p class="wrong-feedback">Incorrect!</p>' +
            '<p>Correct answer: ' +
            correctAnswer +
            '</p>';
    }

    document.getElementById("score-display").textContent =
        "Score: " + score;

    document.getElementById("next-btn").disabled = false;
}

/* Next question */

function nextQuestion() {

    if (!answered) return;

    currentIndex++;

    if (currentIndex < currentQuestions.length) {
        showQuestion();
    }

    else {
        showResults();
    }
}

/* Results */

function showResults() {

    hideAllScreens();

    document.getElementById("result-screen").classList.remove("hidden");

    document.getElementById("final-score").textContent =
        score + " / " + currentQuestions.length;

    const percentage =
        (score / currentQuestions.length) * 100;

    document.getElementById("result-message").textContent =
        "Your score: " + percentage.toFixed(1) + "%";
}

/* Restart quiz */

function restartQuiz() {
    startQuiz(selectedMode);
}

/* Back navigation */

function goBack(screenId) {

    hideAllScreens();

    document.getElementById(screenId).classList.remove("hidden");
}

/* Home */

function goHome() {

    hideAllScreens();

    document.getElementById("welcome-screen").classList.remove("hidden");
  }
