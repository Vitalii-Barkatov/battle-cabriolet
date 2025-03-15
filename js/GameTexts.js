/**
 * GameTexts.js
 * Contains all UI-facing text strings for easy editing and localization
 */

const GameTexts = {
    // Global elements
    global: {
        gameTitle: "Бойовий кабріолет",
        bestScore: "Кращий результат:",
        footerLink: "Більше про ініціативу (Не) З Неба"
    },
    
    // Menu Screen
    menu: {
        startGame: "Почати гру",
        share: "Поділитися",
        donate: "Підтримати",
        leaderboard: "Таблиця лідерів",
        introduction: "<div class='instructions-table'>" +
            "<div class='instruction-row'><div class='instruction-label'>Рух платформи</div><div class='instruction-value'>←↑↓→</div></div>" +
            "<div class='instruction-row'><div class='instruction-label'>Активація РЕБ</div><div class='instruction-value'>SPACE  (працює 3с, перезарядка 10с)</div></div>" +
            "</div>" +
            "<div class='instructions-spacing'></div>" +
            "<div class='instructions-table'>" +
            "<div class='instruction-row'><div class='instruction-label'>Виконана місія</div><div class='instruction-value'>+10 очок</div></div>" +
            "<div class='instruction-row'><div class='instruction-label'>Знищений дрон</div><div class='instruction-value'>+5 очок</div></div>" +
            "</div>" +
            "<div class='instructions-spacing'></div>" +
            "<div class='instructions-warning'>Уникайте мін та ворожих дронів - одне влучення означає знищення!</div>"
    },
    
    // Game Over Screen
    gameOver: {
        title: "Гра закінчена",
        finalScore: "Фінальний рахунок: ",
        donationText: "Ця гра створена, щоб популяризувати наш збір на Беспілотну платфорому і РЕБ до неї для ББС ʼНебесна Мараʼ 43ї ОМБр.\n" +
        "Тому, прошу тебе долучитись донатом і поділитись грою з друзями.\n" +
        "Дякую за підтримку!",
        qrPlaceholder: "QR КОД ТУТ",
        promoCodePlaceholder: "Введіть код...",
        promoCodeInstructions: "Ти можеш продовжити гру зберігши рахунок. Для цього отримай код на сторінці mono-банки після донату :)",
        submitCode: "Продовжити",
        restartGame: "Почати заново",
        shareText: (score) => `Я набрав ${score} очок у грі Battle Cabriolet! Спробуй сам!`,
        shareSuccess: "Текст для поширення скопійовано в буфер обміну!"
    },
    
    // Donation Screen
    donation: {
        title: "Підтримати проєкт",
        backToMenu: "Назад до меню",
        links: {
            monobank: "Підтримати"
        }
    },
    
    // Mission Preparation Screen
    missionPrep: {
        title: "Готуйся",
        missionTypeLabel: "Тип місії: ",
        countdownInitial: "5",
        missionTypes: {
            evacuation: "Евакуація пораненого",
            delivery: "Доставка боєприпасів"
        },
        missionDescriptions: {
            evacuation: "Врятуйте пораненого солдата і безпечно поверніться на базу.",
            delivery: "Доставте важливий вантаж до позначеного місця і поверніться на базу.",
            fallback: "Виконайте цілі місії."
        }
    },
    
    // HUD Elements
    hud: {
        score: "Рахунок: ",
        missionObjective: "Місія: ",
        ewLabel: "РЕБ:"
    },
    
    // Mission Objectives
    mission: {
        evacuation: {
            phase0: "Врятувати пораненого солдата",
            phase1: "Повернутися на базу з солдатом"
        },
        delivery: {
            phase0: "Доставити вантаж до пункту призначення",
            phase1: "Повернутися на базу"
        },
        none: "Немає"
    },
    
    // In-game Messages
    messages: {
        codeAccepted: "Код прийнято! Продовження гри...",
        invalidCode: "Недійсний промокод!",
        revivalSuccess: "Відродження успішне! Гра продовжена зі збереженням рахунку.",
        droneDestroyed: (count, points) => `${count} ${count === 1 ? 'дрон знищено' : 'дронів знищено'} (+${points} очок)`,
        missionComplete: (points) => `Місію виконано! (+${points} очок)`,
        cargoDelivered: 'Вантаж доставлено',
        evacSuccessful: 'Евакуація успішна',
        newMission: 'Нове завдання',
        touchControls: 'Використовуйте D-pad для руху і кнопку РЕБ для активації радіоелектронної боротьби'
    },
    
    // Leaderboard
    leaderboard: {
        title: "Рейтинг гравців",
        yourScore: "Твій рахунок: ",
        enterName: "Введи своє ім'я:",
        submit: "Відправити",
        close: "Закрити",
        loading: "Завантаження результатів...",
        error: "Помилка завантаження. Спробуйте пізніше.",
        nameRequired: "Будь ласка, введіть ім'я",
        scoreSubmitted: "Твій результат додано до таблиці лідерів!",
        scoreQualifies: "Вітаємо! Ваш результат потрапляє до таблиці лідерів!",
        rank: "Ранг",
        name: "Ім'я",
        score: "Рахунок",
        viewLeaderboard: "Переглянути таблицю лідерів"
    },
    
    missions: {
        evacuationTitle: 'Евакуація',
        evacuationDescription: 'До вас надійшла інформація про цивільних, які перебувають у небезпеці. Ваше завдання — евакуювати їх у безпечне місце.',
        deliveryTitle: 'Доставка вантажу',
        deliveryDescription: 'На вас очікує важливий вантаж. Доставте його у зазначену точку, уникаючи контакту з дронами та мінами.',
        evacuationObjective: 'Відшукайте цивільних для евакуації',
        returnWithEvacuees: 'Поверніться на початкову точку з евакуйованими',
        deliveryObjective: 'Доставте вантаж у зазначену точку',
        returnToBriefing: 'Поверніться на початкову точку',
        complete: 'Місію виконано!'
    }
};

// If we're in a CommonJS environment (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameTexts;
} 