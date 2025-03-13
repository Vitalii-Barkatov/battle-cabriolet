/**
 * GameTexts.js
 * Contains all UI-facing text strings for easy editing and localization
 */

const GameTexts = {
    // Global elements
    global: {
        gameTitle: "Бойовий кабріолет",
        bestScore: "Кращий результат:",
        footerLink: "(Не) З Неба"
    },
    
    // Menu Screen
    menu: {
        howToPlay: "Як грати",
        startGame: "Почати гру",
        share: "Поділитися",
        donate: "Підтримати",
        leaderboard: "Таблиця лідерів",
        introduction: "Ця гра створена, щоб популяризувати наш збір на Беспілотну платфорому і РЕБ до неї для ББС ʼНебесна Мараʼ 43ї ОМБр."
    },
    
    // How To Play Screen
    howToPlay: {
        title: "Як грати",
        instructions: [
            "Рухайте платформу стрілками ←↑↓→",
            "Активуйте РЕБ клавішею ʼпробілʼ (тривалість 3с, перезарядка 10с)",
            "Виконуйте місії, щоб отримати +10 очок",
            "Знищуйте дрони за допомогою РЕБа, щоб отримати +5 очок",
            "Уникайте мін та ворожих дронів - одне влучення означає знищення!"
        ],
        backToMenu: "Назад до меню"
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
        promoCodeInstructions: "Ти можеш продовжити гру зберігши рахунок. Для цього отримай код на сторінці банки після донату :)",
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
            monobank: "Банка",
            privat: "Конверт",
            paypal: "PayPal"
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
        droneDestroyed: (count, points) => `+${points} очок! ${count} дрон${count > 1 ? 'и' : ''} знищено!`
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
        rank: "Ранг",
        name: "Ім'я",
        score: "Рахунок",
        viewLeaderboard: "Переглянути таблицю лідерів"
    }
};

// If we're in a CommonJS environment (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameTexts;
} 