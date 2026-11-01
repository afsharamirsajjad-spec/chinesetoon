// ---------------------------------------------------------------------------
// 📝 Exam seeding (SERVER-ONLY) — آزمون‌های آمادهٔ HSK 1/2/3
//
// درخواست مالک: برای هر سه سطح آزمون تعریف شود چون تب Practice (امتحان‌ها)
// خالی بود. برای هر سطح دو آزمون ساخته می‌شود:
//   • Mock Exam — ۲۰ سؤال ترکیبی (واژگان/گرامر/خواندن) با تایمر
//   • Vocabulary Practice — ۱۰ سؤال واژگان بدون تایمر
//
// قوانین idempotency (همان الگوی hsk-seed):
//   • اگر برای یک سطح «هر» آزمونی موجود باشد، آن سطح کامل skip می‌شود —
//     پنل ادمین بعد از اولین تعریف، منبع حقیقت است و seed هرگز چیزی را
//     بازنویسی/حذف نمی‌کند.
//   • شکست یک سطح بقیهٔ سطوح را نمی‌بندد.
//
// کلید سؤال‌ها (قرارداد موتور آزمون): mcq/truefalse → options+answerIndex؛
// match → matchLeft[i] جفتِ matchOptions[i] (نمایش به‌هم‌ریخته می‌شود، نمره‌دهی
// بر اساس متن است و جابه‌جایی گزینه‌ها نتیجه را عوض نمی‌کند).
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'

type SeedSkill = 'vocabulary' | 'grammar' | 'reading'

interface SeedQuestion {
  kind: 'mcq' | 'truefalse' | 'match'
  prompt: string
  hanzi?: string
  pinyin?: string
  options?: string[]
  answerIndex?: number
  matchLeft?: string[]
  matchOptions?: string[]
  explanation?: string
  skill: SeedSkill
}

interface SeedExam {
  slug: string
  title: string
  description: string
  examType: 'mock' | 'vocabulary'
  durationMin: number
  passPercent: number
  sortOrder: number
  questions: SeedQuestion[]
}

const TF = ['True', 'False']

// ────────────────────────────── HSK 1 ──────────────────────────────
const HSK1: SeedExam[] = [
  {
    slug: 'hsk1-mock-exam',
    title: 'HSK 1 Mock Exam',
    description:
      'Full HSK 1 mock exam — 20 questions covering vocabulary, grammar and reading from the official 150-word list. Pass line: 60%.',
    examType: 'mock',
    durationMin: 25,
    passPercent: 60,
    sortOrder: 1,
    questions: [
      { kind: 'mcq', prompt: 'What does 我 mean?', hanzi: '我', pinyin: 'wǒ', options: ['I / me', 'you', 'he', 'they'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 你 mean?', hanzi: '你', pinyin: 'nǐ', options: ['they', 'you', 'I / me', 'he'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 他 mean?', hanzi: '他', pinyin: 'tā', options: ['he / him', 'she', 'you', 'we'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 我们 mean?', hanzi: '我们', pinyin: 'wǒmen', options: ['we / us', 'you (plural)', 'they', 'he'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 你好 mean?', hanzi: '你好', pinyin: 'nǐ hǎo', options: ['hello', 'goodbye', 'thank you', 'sorry'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 谢谢 mean?', hanzi: '谢谢', pinyin: 'xièxie', options: ['sorry', 'hello', 'thank you', 'please'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 再见 mean?', hanzi: '再见', pinyin: 'zàijiàn', options: ['goodbye', 'thanks', "you're welcome", 'please'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 对不起 mean?', hanzi: '对不起', pinyin: 'duìbuqǐ', options: ['sorry', "you're welcome", 'thank you', 'no problem'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 不客气 mean?', hanzi: '不客气', pinyin: 'bú kèqi', options: ['sorry', 'thank you', "you're welcome", 'goodbye'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 是 mean?', hanzi: '是', pinyin: 'shì', options: ['to be (am / is / are)', 'to have', 'to go', 'to like'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 有 mean?', hanzi: '有', pinyin: 'yǒu', options: ['to be', 'to have / there is', 'to want', 'to do'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 没有 mean?', hanzi: '没有', pinyin: 'méiyǒu', options: ['to not have', 'to have', 'to not be', 'to not go'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 中国 mean?', hanzi: '中国', pinyin: 'Zhōngguó', options: ['Chinese people', 'China', 'the Chinese language', 'middle school'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 汉语 mean?', hanzi: '汉语', pinyin: 'Hànyǔ', options: ['the Chinese language', 'China', 'a Chinese class', 'Chinese food'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'Complete the sentence: 我___学生。 (I am a student.)', hanzi: '我___学生。', options: ['是', '不', '没', '有'], answerIndex: 0, explanation: '是 = to be: 我是学生。', skill: 'grammar' },
      { kind: 'mcq', prompt: 'Complete the sentence: 他___是中国人。 (He is NOT Chinese.)', hanzi: '他___是中国人。', options: ['不', '没', '没有', '很'], answerIndex: 0, explanation: 'With 是 the negation is 不是.', skill: 'grammar' },
      { kind: 'truefalse', prompt: '我是中国人。 means "I am Chinese."', hanzi: '我是中国人。', options: TF, answerIndex: 0, skill: 'reading' },
      { kind: 'truefalse', prompt: '你好吗？ means "How are you?"', hanzi: '你好吗？', options: TF, answerIndex: 0, skill: 'reading' },
      { kind: 'mcq', prompt: 'What does 喝 mean?', hanzi: '喝', pinyin: 'hē', options: ['to eat', 'to drink', 'to sleep', 'to read'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'match', prompt: 'Match the Chinese greeting with its meaning.', matchLeft: ['你好', '谢谢', '再见'], matchOptions: ['hello', 'thank you', 'goodbye'], skill: 'vocabulary' },
    ],
  },
  {
    slug: 'hsk1-vocabulary-practice',
    title: 'HSK 1 Vocabulary Practice',
    description: 'Quick HSK 1 vocabulary check — 10 untimed questions on people, family, animals, food and places. Untimed practice.',
    examType: 'vocabulary',
    durationMin: 0,
    passPercent: 60,
    sortOrder: 2,
    questions: [
      { kind: 'mcq', prompt: 'What does 学生 mean?', hanzi: '学生', pinyin: 'xuésheng', options: ['student', 'teacher', 'doctor', 'boss'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 老师 mean?', hanzi: '老师', pinyin: 'lǎoshī', options: ['student', 'teacher', 'father', 'mother'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 爸爸 mean?', hanzi: '爸爸', pinyin: 'bàba', options: ['mom', 'older brother', 'dad', 'younger sister'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 妈妈 mean?', hanzi: '妈妈', pinyin: 'māma', options: ['dad', 'mom', 'aunt', 'grandma'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 猫 mean?', hanzi: '猫', pinyin: 'māo', options: ['dog', 'cat', 'fish', 'horse'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 狗 mean?', hanzi: '狗', pinyin: 'gǒu', options: ['cat', 'horse', 'dog', 'fish'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 水 mean?', hanzi: '水', pinyin: 'shuǐ', options: ['tea', 'water', 'rice', 'fruit'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 茶 mean?', hanzi: '茶', pinyin: 'chá', options: ['water', 'coffee', 'tea', 'milk'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 苹果 mean?', hanzi: '苹果', pinyin: 'píngguǒ', options: ['apple', 'pear', 'banana', 'watermelon'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 学校 mean?', hanzi: '学校', pinyin: 'xuéxiào', options: ['school', 'shop', 'restaurant', 'hospital'], answerIndex: 0, skill: 'vocabulary' },
    ],
  },
]

// ────────────────────────────── HSK 2 ──────────────────────────────
const HSK2: SeedExam[] = [
  {
    slug: 'hsk2-mock-exam',
    title: 'HSK 2 Mock Exam',
    description:
      'Full HSK 2 mock exam — 20 questions on the ~300-word HSK 2 list plus core grammar (了, 比, 会, 没…过). Pass line: 60%.',
    examType: 'mock',
    durationMin: 40,
    passPercent: 60,
    sortOrder: 1,
    questions: [
      { kind: 'mcq', prompt: 'What does 帮助 mean?', hanzi: '帮助', pinyin: 'bāngzhù', options: ['to help', 'to ask', 'to wait', 'to find'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 但是 mean?', hanzi: '但是', pinyin: 'dànshì', options: ['because', 'but', 'so', 'and'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 因为 mean?', hanzi: '因为', pinyin: 'yīnwèi', options: ['so', 'but', 'because', 'if'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 已经 mean?', hanzi: '已经', pinyin: 'yǐjīng', options: ['already', 'still', 'again', 'never'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 一起 mean?', hanzi: '一起', pinyin: 'yìqǐ', options: ['together', 'alone', 'quickly', 'slowly'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 可能 mean?', hanzi: '可能', pinyin: 'kěnéng', options: ['impossible', 'maybe / possible', 'certainly', 'usually'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 觉得 mean?', hanzi: '觉得', pinyin: 'juéde', options: ['to sleep', 'to think / to feel', 'to buy', 'to look'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 希望 mean?', hanzi: '希望', pinyin: 'xīwàng', options: ['to hope', 'to need', 'to give', 'to take'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 认识 mean?', hanzi: '认识', pinyin: 'rènshi', options: ['to recognize / to know (someone)', 'to understand a subject', 'to meet by chance', 'to forget'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 便宜 mean?', hanzi: '便宜', pinyin: 'piányi', options: ['expensive', 'cheap', 'new', 'old'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 贵 mean?', hanzi: '贵', pinyin: 'guì', options: ['cheap', 'fast', 'expensive', 'slow'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 生日 mean?', hanzi: '生日', pinyin: 'shēngrì', options: ['birthday', 'date', 'weekend', 'party'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'Complete: 我昨天买___两本书。 (I bought two books yesterday.)', hanzi: '我昨天买___两本书。', options: ['了', '过', '的', '是'], answerIndex: 0, explanation: '了 marks a completed action.', skill: 'grammar' },
      { kind: 'mcq', prompt: 'Complete: 今天比昨天___。 (Today is better than yesterday.)', hanzi: '今天比昨天___。', options: ['好', '很好', '好了', '很好了'], answerIndex: 0, explanation: 'In 比 sentences the plain adjective is used — no 很.', skill: 'grammar' },
      { kind: 'mcq', prompt: 'Complete: 他___去过北京。 (He has NEVER been to Beijing.)', hanzi: '他___去过北京。', options: ['没', '不', '是', '很'], answerIndex: 0, explanation: '没 + 过 negates a past experience.', skill: 'grammar' },
      { kind: 'truefalse', prompt: '我会说一点儿汉语。 means "I can speak a little Chinese."', hanzi: '我会说一点儿汉语。', options: TF, answerIndex: 0, skill: 'reading' },
      { kind: 'mcq', prompt: 'What does 懂 mean?', hanzi: '懂', pinyin: 'dǒng', options: ['to hear', 'to read', 'to understand', 'to write'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 意思 mean?', hanzi: '意思', pinyin: 'yìsi', options: ['meaning', 'question', 'answer', 'word'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'match', prompt: 'Match the Chinese word with its meaning.', matchLeft: ['帮忙', '电视', '题目'], matchOptions: ['to help', 'TV', 'question / problem'], skill: 'vocabulary' },
      { kind: 'truefalse', prompt: '我已经吃了。 means "I have already eaten."', hanzi: '我已经吃了。', options: TF, answerIndex: 0, skill: 'reading' },
    ],
  },
  {
    slug: 'hsk2-vocabulary-practice',
    title: 'HSK 2 Vocabulary Practice',
    description: 'Quick HSK 2 vocabulary check — 10 untimed questions on everyday places and things. Untimed practice.',
    examType: 'vocabulary',
    durationMin: 0,
    passPercent: 60,
    sortOrder: 2,
    questions: [
      { kind: 'mcq', prompt: 'What does 电视 mean?', hanzi: '电视', pinyin: 'diànshì', options: ['radio', 'TV', 'movie', 'phone'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 电脑 mean?', hanzi: '电脑', pinyin: 'diànnǎo', options: ['computer', 'camera', 'game', 'screen'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 蛋糕 mean?', hanzi: '蛋糕', pinyin: 'dàngāo', options: ['bread', 'egg', 'cake', 'candy'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 公园 mean?', hanzi: '公园', pinyin: 'gōngyuán', options: ['garden', 'park', 'playground', 'zoo'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 超市 mean?', hanzi: '超市', pinyin: 'chāoshì', options: ['market street', 'supermarket', 'shop', 'mall'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 银行 mean?', hanzi: '银行', pinyin: 'yínháng', options: ['bank', 'office', 'post office', 'hotel'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 医院 mean?', hanzi: '医院', pinyin: 'yīyuàn', options: ['pharmacy', 'clinic', 'hospital', 'laboratory'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 动物园 mean?', hanzi: '动物园', pinyin: 'dòngwùyuán', options: ['pet shop', 'farm', 'nature park', 'zoo'], answerIndex: 3, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 饭馆 mean?', hanzi: '饭馆', pinyin: 'fànguǎn', options: ['restaurant', 'kitchen', 'café', 'food market'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 题目 mean?', hanzi: '题目', pinyin: 'tímù', options: ['title of a book', 'question / problem', 'subject at school', 'topic sentence'], answerIndex: 1, skill: 'vocabulary' },
    ],
  },
]

// ────────────────────────────── HSK 3 ──────────────────────────────
const HSK3: SeedExam[] = [
  {
    slug: 'hsk3-mock-exam',
    title: 'HSK 3 Mock Exam',
    description:
      'Full HSK 3 mock exam — 20 questions on the ~600-word HSK 3 list plus 把, 越来越 and 一边…一边 structures. Pass line: 60%.',
    examType: 'mock',
    durationMin: 60,
    passPercent: 60,
    sortOrder: 1,
    questions: [
      { kind: 'mcq', prompt: 'What does 解决 mean?', hanzi: '解决', pinyin: 'jiějué', options: ['to solve', 'to answer', 'to ask', 'to decide'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 提高 mean?', hanzi: '提高', pinyin: 'tígāo', options: ['to lower', 'to improve', 'to finish', 'to repeat'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 影响 mean?', hanzi: '影响', pinyin: 'yǐngxiǎng', options: ['influence', 'effort', 'result', 'reason'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 打算 mean?', hanzi: '打算', pinyin: 'dǎsuàn', options: ['to plan / intend', 'to finish', 'to cancel', 'to delay'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 决定 mean?', hanzi: '决定', pinyin: 'juédìng', options: ['to agree', 'to decide', 'to refuse', 'to accept'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 同意 mean?', hanzi: '同意', pinyin: 'tóngyì', options: ['to agree', 'to disagree', 'to decide', 'to sign'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 认真 mean?', hanzi: '认真', pinyin: 'rènzhēn', options: ['careless', 'serious / careful', 'fast', 'friendly'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 马上 mean?', hanzi: '马上', pinyin: 'mǎshàng', options: ['immediately', 'later', 'early', 'finally'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 其实 mean?', hanzi: '其实', pinyin: 'qíshí', options: ['actually', 'of course', 'suddenly', 'finally'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 习惯 mean?', hanzi: '习惯', pinyin: 'xíguàn', options: ['hobby', 'habit', 'job', 'skill'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 世界 mean?', hanzi: '世界', pinyin: 'shìjiè', options: ['world', 'country', 'city', 'nation'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 地铁 mean?', hanzi: '地铁', pinyin: 'dìtiě', options: ['subway', 'train', 'bus', 'taxi'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 机场 mean?', hanzi: '机场', pinyin: 'jīchǎng', options: ['airport', 'station', 'harbor', 'highway'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'Complete the 把 sentence: 请___门打开。 (Please open the door.)', hanzi: '请___门打开。', options: ['把', '被', '让', '给'], answerIndex: 0, explanation: '把 + object + verb: 把门打开。', skill: 'grammar' },
      { kind: 'mcq', prompt: 'Complete: 天气越来越___了。 (The weather is getting colder and colder.)', hanzi: '天气越来越___了。', options: ['冷', '很冷', '冷了', '很冷了'], answerIndex: 0, explanation: '越来越 + plain adjective.', skill: 'grammar' },
      { kind: 'truefalse', prompt: '我一边吃饭，一边看电视。 means "I eat while watching TV."', hanzi: '我一边吃饭，一边看电视。', options: TF, answerIndex: 0, skill: 'reading' },
      { kind: 'truefalse', prompt: '除了汉语，我还学英语。 means "Besides Chinese, I also study English."', hanzi: '除了汉语，我还学英语。', options: TF, answerIndex: 0, skill: 'reading' },
      { kind: 'match', prompt: 'Match the Chinese word with its meaning.', matchLeft: ['坚持', '爱好', '自行车'], matchOptions: ['to persist', 'hobby', 'bicycle'], skill: 'vocabulary' },
      { kind: 'truefalse', prompt: '虽然很难，但是我要试试。 means "Although it is hard, I want to try."', hanzi: '虽然很难，但是我要试试。', options: TF, answerIndex: 0, skill: 'grammar' },
      { kind: 'truefalse', prompt: '我每天坐地铁去上班。 means "I take the subway to work every day."', hanzi: '我每天坐地铁去上班。', options: TF, answerIndex: 0, skill: 'reading' },
    ],
  },
  {
    slug: 'hsk3-vocabulary-practice',
    title: 'HSK 3 Vocabulary Practice',
    description: 'Quick HSK 3 vocabulary check — 10 untimed questions on verbs, feelings and everyday nouns. Untimed practice.',
    examType: 'vocabulary',
    durationMin: 0,
    passPercent: 60,
    sortOrder: 2,
    questions: [
      { kind: 'mcq', prompt: 'What does 关心 mean?', hanzi: '关心', pinyin: 'guānxīn', options: ['to care about', 'to close', 'to worry about money', 'to depend on'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 坚持 mean?', hanzi: '坚持', pinyin: 'jiānchí', options: ['to give up', 'to persist', 'to hold', 'to support'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 夏天 mean?', hanzi: '夏天', pinyin: 'xiàtiān', options: ['summer', 'winter', 'season', 'weekend'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 冬天 mean?', hanzi: '冬天', pinyin: 'dōngtiān', options: ['autumn', 'spring', 'winter', 'weather'], answerIndex: 2, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 历史 mean?', hanzi: '历史', pinyin: 'lìshǐ', options: ['story', 'history', 'geography', 'news'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 自行车 mean?', hanzi: '自行车', pinyin: 'zìxíngchē', options: ['motorcycle', 'bicycle', 'car', 'bus'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 爱好 mean?', hanzi: '爱好', pinyin: 'àihào', options: ['love', 'hobby', 'friendship', 'interest rate'], answerIndex: 1, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 需要 mean?', hanzi: '需要', pinyin: 'xūyào', options: ['to need', 'to want', 'to request', 'to demand'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 粗心 mean?', hanzi: '粗心', pinyin: 'cūxīn', options: ['careless', 'kind-hearted', 'nervous', 'hardworking'], answerIndex: 0, skill: 'vocabulary' },
      { kind: 'mcq', prompt: 'What does 叔叔 mean?', hanzi: '叔叔', pinyin: 'shūshu', options: ['grandfather', 'uncle', 'teacher', 'neighbor'], answerIndex: 1, skill: 'vocabulary' },
    ],
  },
]

const LEVELS: Array<'hsk1' | 'hsk2' | 'hsk3'> = ['hsk1', 'hsk2', 'hsk3']
const SEEDS: Record<(typeof LEVELS)[number], SeedExam[]> = { hsk1: HSK1, hsk2: HSK2, hsk3: HSK3 }

let seedPromise: Promise<{ created: number }> | null = null

async function runSeed(): Promise<{ created: number }> {
  let created = 0
  for (const level of LEVELS) {
    try {
      // 🛡️ مالک منبع حقیقت است — اگر برای این سطح «هر» آزمونی موجود باشد، skip
      const existing = await db.hskExam.count({ where: { level } })
      if (existing > 0) continue

      for (const exam of SEEDS[level]) {
        const slugTaken = await db.hskExam.findUnique({ where: { slug: exam.slug }, select: { id: true } })
        if (slugTaken) continue

        const questionIds: string[] = []
        for (let i = 0; i < exam.questions.length; i++) {
          const q = exam.questions[i]
          const row = await db.hskQuestion.create({
            data: {
              kind: q.kind,
              prompt: q.prompt,
              hanzi: q.hanzi ?? '',
              pinyin: q.pinyin ?? '',
              options: JSON.stringify(q.options ?? []),
              // match: کلید = جفت‌شدن matchLeft[i] با matchOptions[i]
              answerIndex: q.kind === 'match' ? null : (q.answerIndex ?? 0),
              matchLeft: JSON.stringify(q.matchLeft ?? []),
              matchOptions: JSON.stringify(q.matchOptions ?? []),
              tiles: JSON.stringify([]),
              explanation: q.explanation ?? '',
              level,
              skill: q.skill,
              stageNumber: null,
              points: 1,
              difficulty: 'easy',
              published: true,
              sortOrder: i,
            },
          })
          questionIds.push(row.id)
        }

        await db.hskExam.create({
          data: {
            slug: exam.slug,
            title: exam.title,
            description: exam.description,
            level,
            examType: exam.examType,
            durationMin: exam.durationMin,
            passPercent: exam.passPercent,
            questionIds: JSON.stringify(questionIds),
            access: 'free',
            published: true,
            sortOrder: exam.sortOrder,
          },
        })
        created++
      }
    } catch (e) {
      console.error(`[hsk-exam-seed] level ${level} failed:`, e instanceof Error ? e.message : e)
    }
  }
  return { created }
}

/**
 * Seed the starter exams once per level. Concurrent cold starts share one
 * promise; failures are logged and never break startup.
 */
export function ensureExamSeed(): Promise<{ created: number }> {
  if (!seedPromise) {
    seedPromise = runSeed()
      .then((r) => {
        if (r.created > 0) console.info(`[hsk-exam-seed] ${r.created} starter exams created`)
        return r
      })
      .catch((e) => {
        console.error('[hsk-exam-seed] failed:', e instanceof Error ? e.message : e)
        seedPromise = null
        return { created: 0 }
      })
  }
  return seedPromise
}
