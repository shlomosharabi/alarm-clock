// Task generator for wake-up challenges

// ─── MATH TASKS ────────────────────────────────────────────────────────────────
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMathTask(difficulty) {
  switch (difficulty) {
    case 'easy': {
      const a = randomInt(1, 20);
      const b = randomInt(1, 20);
      const ops = ['+', '-'];
      const op = ops[randomInt(0, 1)];
      const answer = op === '+' ? a + b : a - b;
      return {
        question: `${a} ${op} ${b} = ?`,
        answer: answer.toString(),
        hint: `חשב ${a} ${op} ${b}`,
      };
    }
    case 'medium': {
      const type = randomInt(0, 2);
      if (type === 0) {
        const a = randomInt(2, 12);
        const b = randomInt(2, 12);
        return {
          question: `${a} × ${b} = ?`,
          answer: (a * b).toString(),
          hint: `כפל: ${a} פעמים ${b}`,
        };
      } else if (type === 1) {
        const a = randomInt(10, 99);
        const b = randomInt(10, 99);
        return {
          question: `${a} + ${b} = ?`,
          answer: (a + b).toString(),
          hint: `חבר את המספרים`,
        };
      } else {
        const a = randomInt(20, 99);
        const b = randomInt(10, a);
        return {
          question: `${a} - ${b} = ?`,
          answer: (a - b).toString(),
          hint: `חסר ${b} מ-${a}`,
        };
      }
    }
    case 'hard': {
      const type = randomInt(0, 2);
      if (type === 0) {
        const a = randomInt(11, 25);
        const b = randomInt(11, 25);
        return {
          question: `${a} × ${b} = ?`,
          answer: (a * b).toString(),
          hint: `${a} × ${b} = ${a} × 10 + ${a} × ${b - 10}`,
        };
      } else if (type === 1) {
        const a = randomInt(100, 999);
        const b = randomInt(100, 999);
        return {
          question: `${a} + ${b} = ?`,
          answer: (a + b).toString(),
          hint: `חבר ספרה ספרה`,
        };
      } else {
        const base = randomInt(2, 5);
        const exp = randomInt(2, 4);
        const ans = Math.pow(base, exp);
        return {
          question: `${base}^${exp} = ?`,
          answer: ans.toString(),
          hint: `${base} בחזקת ${exp}`,
        };
      }
    }
    default:
      return generateMathTask('medium');
  }
}

// ─── WORD TASKS ─────────────────────────────────────────────────────────────────
const wordBanks = {
  easy: [
    { word: 'שמ_ש', answer: 'ש', display: 'שמ_ש', full: 'שמש', hint: 'כוכב במרכז מערכת השמש' },
    { word: 'כלב', answer: '', display: 'כ_ב', full: 'כלב', hint: 'חיית מחמד נאמנה' },
    { word: 'ספר', answer: '', display: 'ס_ר', full: 'ספר', hint: 'קוראים אותו' },
    { word: 'ים', answer: '', display: 'י_', full: 'ים', hint: 'גוף מים גדול' },
    { word: 'עץ', answer: '', display: '_ץ', full: 'עץ', hint: 'גדל ביער' },
    { word: 'בית', answer: '', display: 'ב_ת', full: 'בית', hint: 'גרים בו' },
    { word: 'אור', answer: '', display: '_ור', full: 'אור', hint: 'ההפך מחושך' },
    { word: 'יד', answer: '', display: 'י_', full: 'יד', hint: 'חלק מהגוף' },
  ],
  medium: [
    { word: 'מחשב', answer: '', display: 'מח_ב', full: 'מחשב', hint: 'מכשיר אלקטרוני' },
    { word: 'שולחן', answer: '', display: 'שולח_', full: 'שולחן', hint: 'רהיט לכתיבה' },
    { word: 'תפוח', answer: '', display: 'ת_וח', full: 'תפוח', hint: 'פרי אדום או ירוק' },
    { word: 'חלון', answer: '', display: 'ח_ון', full: 'חלון', hint: 'פתח בקיר' },
    { word: 'כלכלה', answer: '', display: 'כל_לה', full: 'כלכלה', hint: 'ניהול כסף ומשאבים' },
    { word: 'מרפסת', answer: '', display: 'מרפ_ת', full: 'מרפסת', hint: 'פתח בחוץ בבניין' },
    { word: 'אוניברסיטה', answer: '', display: 'אוני_רסיטה', full: 'אוניברסיטה', hint: 'מוסד להשכלה גבוהה' },
  ],
  hard: [
    { word: 'אינטליגנציה', answer: '', display: 'אינטל_גנציה', full: 'אינטליגנציה', hint: 'כושר שכלי' },
    { word: 'פסיכולוגיה', answer: '', display: 'פסיכ_לוגיה', full: 'פסיכולוגיה', hint: 'חקר הנפש' },
    { word: 'ביולוגיה', answer: '', display: 'ביו_וגיה', full: 'ביולוגיה', hint: 'מדע החיים' },
    { word: 'ארכיטקטורה', answer: '', display: 'ארכיט_טורה', full: 'ארכיטקטורה', hint: 'תכנון בניינים' },
    { word: 'פילוסופיה', answer: '', display: 'פילו_ופיה', full: 'פילוסופיה', hint: 'חכמת חיים' },
  ],
};

function generateWordTask(difficulty) {
  const bank = wordBanks[difficulty] || wordBanks.medium;
  const item = bank[randomInt(0, bank.length - 1)];
  // Build missing letters
  const full = item.full;
  const display = item.display;
  const missing = [];
  for (let i = 0; i < display.length; i++) {
    if (display[i] === '_') missing.push(full[i]);
  }
  return {
    question: `השלם את המילה: ${display}`,
    answer: missing.join(''),
    hint: item.hint,
    display: display,
    full: full,
  };
}

// ─── SEQUENCE TASKS ─────────────────────────────────────────────────────────────
function generateSequenceTask(difficulty) {
  switch (difficulty) {
    case 'easy': {
      const start = randomInt(1, 10);
      const step = randomInt(1, 5);
      const seq = [start, start + step, start + 2 * step, start + 3 * step];
      return {
        question: `מה הבא בסדרה?\n${seq.slice(0, 3).join(' , ')} , ?`,
        answer: seq[3].toString(),
        hint: `הצעד בין כל מספר הוא ${step}`,
      };
    }
    case 'medium': {
      const type = randomInt(0, 1);
      if (type === 0) {
        // geometric
        const start = randomInt(1, 5);
        const ratio = randomInt(2, 4);
        const seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
        return {
          question: `מה הבא בסדרה?\n${seq.slice(0, 3).join(' , ')} , ?`,
          answer: seq[3].toString(),
          hint: `כל מספר מוכפל ב-${ratio}`,
        };
      } else {
        // fibonacci-like
        const a = randomInt(1, 5);
        const b = randomInt(1, 5);
        const c = a + b;
        const d = b + c;
        const e = c + d;
        return {
          question: `מה הבא בסדרה?\n${a} , ${b} , ${c} , ${d} , ?`,
          answer: e.toString(),
          hint: `כל מספר הוא סכום שני הקודמים`,
        };
      }
    }
    case 'hard': {
      // squares or mixed
      const start = randomInt(1, 4);
      const seq = [start ** 2, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
      return {
        question: `מה הבא בסדרה?\n${seq.slice(0, 3).join(' , ')} , ?`,
        answer: seq[3].toString(),
        hint: `${start}², ${start + 1}², ${start + 2}²...`,
      };
    }
    default:
      return generateSequenceTask('medium');
  }
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────────
export function generateTask(type, difficulty) {
  switch (type) {
    case 'math':
      return { ...generateMathTask(difficulty), type: 'math', typeLabel: '🧮 מתמטיקה' };
    case 'word':
      return { ...generateWordTask(difficulty), type: 'word', typeLabel: '📝 השלמת מילה' };
    case 'sequence':
      return { ...generateSequenceTask(difficulty), type: 'sequence', typeLabel: '🔢 סדרות' };
    default:
      return null;
  }
}

export const TASK_TYPES = [
  { key: 'none', label: 'ללא משימה', icon: '😴' },
  { key: 'math', label: 'מתמטיקה', icon: '🧮' },
  { key: 'word', label: 'השלמת מילה', icon: '📝' },
  { key: 'sequence', label: 'סדרות מספרים', icon: '🔢' },
];

export const DIFFICULTY_LEVELS = [
  { key: 'easy', label: 'קל', color: '#4ade80' },
  { key: 'medium', label: 'בינוני', color: '#facc15' },
  { key: 'hard', label: 'קשה', color: '#f87171' },
];
