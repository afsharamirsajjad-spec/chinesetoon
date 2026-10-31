// ---------------------------------------------------------------------------
// 📖 HSK 1 grammar curriculum — 2–3 points per stage, following the grammar
// scope of the HSK 1 textbook (word order, 是, 吗, 很, 的, 这/那, 都, numbers,
// dates, time, 在/去, positions, 有/想, 一点儿, measure words, result 看见,
// adjectives, 回, weather, 会/能/喜欢, 了, 太…了, price questions).
//
// Example sentences only use words from the same or earlier stages (plus the
// textbook-standard proper names 玛丽/大卫/王/李/小明).
//
// CLIENT-SAFE: no answer keys here — keys for `grammarExercises` live in
// answers.ts, keyed by exercise id.
// ---------------------------------------------------------------------------

import type { GrammarPoint } from './types'

export const STAGE_GRAMMAR: GrammarPoint[][] = [
  // ===== Stage 1 =====
  [
    {
      id: 'g1-1',
      title: '“是” sentences (to be)',
      explanation:
        'In Chinese the verb 是 (shì) works like "am / is / are". The word order is the same as English: Subject + 是 + Noun. To say "not", put 不 (bù) in front of 是.',
      structure: 'Subject + 是 + Noun  ·  Negation: Subject + 不 + 是 + Noun',
      examples: [
        { hanzi: '我是大卫。', pinyin: 'Wǒ shì Dàwèi.', english: 'I am David.' },
        { hanzi: '她是我的妈妈。', pinyin: 'Tā shì wǒ de māma.', english: 'She is my mum.' },
        { hanzi: '我不是老师。', pinyin: 'Wǒ bú shì lǎoshī.', english: 'I am not a teacher.' },
      ],
      mistakes: [
        { wrong: '我学生。', right: '我是学生。', note: 'You cannot drop 是 before a noun like in some languages.' },
        { wrong: '我不学生。', right: '我不是学生。', note: 'Before a verb like 是, use 不 + 是 together.' },
      ],
    },
    {
      id: 'g1-2',
      title: 'Questions with 吗',
      explanation:
        'The easiest way to ask a yes/no question is to add 吗 (ma) at the end of a sentence. Nothing else changes — the word order stays exactly the same.',
      structure: 'Statement + 吗？',
      examples: [
        { hanzi: '你好吗？', pinyin: 'Nǐ hǎo ma?', english: 'How are you?' },
        { hanzi: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', english: 'Are you a student?' },
        { hanzi: '她是你的妈妈吗？', pinyin: 'Tā shì nǐ de māma ma?', english: 'Is she your mum?' },
      ],
      mistakes: [
        { wrong: '吗你是学生？', right: '你是学生吗？', note: '吗 always goes at the very end, never at the front.' },
        { wrong: '你是什么名字吗？', right: '你叫什么名字？', note: 'Use 吗 for yes/no questions only. “What” questions use 什么.' },
      ],
    },
    {
      id: 'g1-3',
      title: 'Adjectives with 很',
      explanation:
        'To say "I am fine" or "the weather is good", Chinese uses 很 (hěn, "very") + adjective. There is no 是 before an adjective: 我很好 — never 我是好.',
      structure: 'Subject + 很 + Adjective',
      examples: [
        { hanzi: '我很好，谢谢！', pinyin: 'Wǒ hěn hǎo, xièxie!', english: 'I am fine, thanks!' },
        { hanzi: '你的名字很好。', pinyin: 'Nǐ de míngzi hěn hǎo.', english: 'Your name is very nice.' },
        { hanzi: '我不好。', pinyin: 'Wǒ bù hǎo.', english: 'I am not well.' },
      ],
      mistakes: [
        { wrong: '我是好。', right: '我很好。', note: 'Adjectives do not need 是 — use 很 (or another adverb) directly.' },
        { wrong: '你好很。', right: '你很好。', note: '很 goes BEFORE the adjective, not after it.' },
      ],
    },
  ],

  // ===== Stage 2 =====
  [
    {
      id: 'g2-1',
      title: 'Possession with 的',
      explanation:
        '的 (de) links a person to a thing — it works like "’s" or "of" in English. Put 的 after the owner: 我 + 的 + 爸爸 = my dad.',
      structure: 'Owner + 的 + Thing',
      examples: [
        { hanzi: '这是我的妈妈。', pinyin: 'Zhè shì wǒ de māma.', english: 'This is my mum.' },
        { hanzi: '他的儿子是学生。', pinyin: 'Tā de érzi shì xuésheng.', english: 'His son is a student.' },
        { hanzi: '王老师的女儿很好。', pinyin: 'Wáng lǎoshī de nǚ’ér hěn hǎo.', english: 'Mr. Wang’s daughter is very well.' },
      ],
      mistakes: [
        { wrong: '我爸爸的。', right: '我的爸爸。', note: '的 comes after the owner and before the thing.' },
        { wrong: '这是我的。妈妈。', right: '这是我的妈妈。', note: '的 + noun stay together as one phrase.' },
      ],
    },
    {
      id: 'g2-2',
      title: '这 (this) and 那 (that)',
      explanation:
        '这 (zhè) points to something near you; 那 (nà) points to something far away. They usually come with 是: 这是…… / 那是……',
      structure: '这/那 + 是 + Noun  ·  Question: 这是什么？',
      examples: [
        { hanzi: '这是玛丽。', pinyin: 'Zhè shì Mǎlì.', english: 'This is Mary.' },
        { hanzi: '那是我的老师。', pinyin: 'Nà shì wǒ de lǎoshī.', english: 'That is my teacher.' },
        { hanzi: '这是什么？', pinyin: 'Zhè shì shénme?', english: 'What is this?' },
      ],
      mistakes: [
        { wrong: '这是谁？他是王老师。', right: '那是谁？他是王老师。', note: 'Both are possible — choose 这 for near, 那 for far.' },
        { wrong: '这什么？', right: '这是什么？', note: '这 needs 是 before 什么 in a full sentence.' },
      ],
    },
    {
      id: 'g2-3',
      title: '都 (all / both)',
      explanation:
        '都 (dōu) means "all" or "both". It always comes AFTER the subject and BEFORE the verb or adjective — never at the end of the sentence.',
      structure: 'Subject + 都 + Verb / 很 + Adjective',
      examples: [
        { hanzi: '我们都是学生。', pinyin: 'Wǒmen dōu shì xuésheng.', english: 'We are all students.' },
        { hanzi: '爸爸妈妈都很好。', pinyin: 'Bàba māma dōu hěn hǎo.', english: 'Dad and mum are both fine.' },
        { hanzi: '我的朋友们都很好。', pinyin: 'Wǒ de péngyoumen dōu hěn hǎo.', english: 'All my friends are very well.' },
      ],
      mistakes: [
        { wrong: '我们都是学生。都很好！', right: '我们都很好！', note: 'One 都 is enough for the whole subject.' },
        { wrong: '我们是都学生。', right: '我们都是学生。', note: '都 goes after the subject, before 是.' },
      ],
    },
  ],

  // ===== Stage 3 =====
  [
    {
      id: 'g3-1',
      title: 'Numbers and 个',
      explanation:
        'Chinese numbers 1–10 are 一二三四五六七八九十. To count things you add a measure word — for most objects that is 个 (gè): three students = 三个学生.',
      structure: 'Number + 个 + Noun',
      examples: [
        { hanzi: '三个学生。', pinyin: 'Sān gè xuésheng.', english: 'Three students.' },
        { hanzi: '他是个学生。', pinyin: 'Tā shì gè xuésheng.', english: 'He is a student.' },
        { hanzi: '我们五个人。', pinyin: 'Wǒmen wǔ gè rén.', english: 'We are five people.' },
      ],
      mistakes: [
        { wrong: '三学生。', right: '三个学生。', note: 'Most nouns need 个 between the number and the noun.' },
        { wrong: '个三学生。', right: '三个学生。', note: 'The number comes first, then 个, then the noun.' },
      ],
    },
    {
      id: 'g3-2',
      title: 'Saying your age with 岁',
      explanation:
        'To say your age, put the number before 岁 (suì): 我二十岁 — I am twenty years old. There is no verb "to be" needed.',
      structure: 'Subject + Number + 岁',
      examples: [
        { hanzi: '我二十岁。', pinyin: 'Wǒ èrshí suì.', english: 'I am twenty years old.' },
        { hanzi: '我的儿子三岁。', pinyin: 'Wǒ de érzi sān suì.', english: 'My son is three years old.' },
        { hanzi: '你二十岁吗？', pinyin: 'Nǐ èrshí suì ma?', english: 'Are you twenty years old?' },
      ],
      mistakes: [
        { wrong: '我是二十岁。', right: '我二十岁。', note: 'No 是 before an age — just number + 岁.' },
        { wrong: '我岁二十。', right: '我二十岁。', note: '岁 comes after the number.' },
      ],
    },
    {
      id: 'g3-3',
      title: 'Dates: 月 and 号',
      explanation:
        'To say a date, go from big to small: month first, then 号 (hào, day of the month): 十月三十一号 = October 31st.',
      structure: 'Number + 月 + Number + 号',
      examples: [
        { hanzi: '十月三十一号。', pinyin: 'Shí yuè sānshíyī hào.', english: 'October 31st.' },
        { hanzi: '一月一号。', pinyin: 'Yī yuè yī hào.', english: 'January 1st.' },
        { hanzi: '我的号是九。', pinyin: 'Wǒ de hào shì jiǔ.', english: 'My number is nine.' },
      ],
      mistakes: [
        { wrong: '一号十月。', right: '十月一号。', note: 'In Chinese dates the month always comes before the day.' },
        { wrong: '十月三十一日号。', right: '十月三十一号。', note: 'At HSK 1 use 号 for days of the month.' },
      ],
    },
  ],

  // ===== Stage 4 =====
  [
    {
      id: 'g4-1',
      title: 'Telling time: 点',
      explanation:
        '点 (diǎn) means "o’clock". Say the hour first, then 点: 十点 = ten o’clock. 分钟 (fēnzhōng) means "minute": 十五分钟 = fifteen minutes.',
      structure: 'Time + 点 (+ Number + 分钟)',
      examples: [
        { hanzi: '现在十点。', pinyin: 'Xiànzài shí diǎn.', english: 'It is ten o’clock now.' },
        { hanzi: '我们十点去学校。', pinyin: 'Wǒmen shí diǎn qù xuéxiào.', english: 'We go to school at ten o’clock.' },
        { hanzi: '十五分钟。', pinyin: 'Shíwǔ fēnzhōng.', english: 'Fifteen minutes.' },
      ],
      mistakes: [
        { wrong: '现在点十。', right: '现在十点。', note: 'The hour number comes before 点.' },
        { wrong: '我十点在去学校。', right: '我十点去学校。', note: 'Do not use 在 before another verb for planned actions.' },
      ],
    },
    {
      id: 'g4-2',
      title: 'Days of the week: 星期',
      explanation:
        '星期 (xīngqī) means "week". Days are 星期一 (Monday) to 星期六 (Saturday). Sunday is usually 星期日 or 星期天. “Weekday + I + verb” is the normal order.',
      structure: '星期 + Number: 我 + 星期一 + Verb + Place',
      examples: [
        { hanzi: '星期一我去学校。', pinyin: 'Xīngqīyī wǒ qù xuéxiào.', english: 'I go to school on Monday.' },
        { hanzi: '星期六我不去学校。', pinyin: 'Xīngqīliù wǒ bú qù xuéxiào.', english: 'I do not go to school on Saturday.' },
        { hanzi: '今天星期几？', pinyin: 'Jīntiān xīngqī jǐ?', english: 'What day is it today?' },
      ],
      mistakes: [
        { wrong: '我星期一在去学校。', right: '星期一我去学校。', note: 'Say the day, then the verb — no extra 在.' },
        { wrong: '星期天我去学校。', right: '星期日我不去学校。', note: '星期日/星期天 is Sunday — a day off, not a school day.' },
      ],
    },
    {
      id: 'g4-3',
      title: '在 (to be at) and 去 (to go)',
      explanation:
        '在 (zài) says where someone or something IS: 我在学校. 去 (qù) says where someone GOES: 我去学校. They are different verbs — do not mix them.',
      structure: 'Subject + 在 + Place  ·  Subject + 去 + Place',
      examples: [
        { hanzi: '我在学校。', pinyin: 'Wǒ zài xuéxiào.', english: 'I am at school.' },
        { hanzi: '妈妈在家。', pinyin: 'Māma zài jiā.', english: 'Mum is at home.' },
        { hanzi: '明天我去北京。', pinyin: 'Míngtiān wǒ qù Běijīng.', english: 'Tomorrow I go to Beijing.' },
      ],
      mistakes: [
        { wrong: '我在去学校。', right: '我去学校。', note: '在 = being there; 去 = going there. Pick one.' },
        { wrong: '我去在家。', right: '我在家。', note: '在 alone already means "to be at" a place.' },
      ],
    },
  ],

  // ===== Stage 5 =====
  [
    {
      id: 'g5-1',
      title: 'Position words: 上, 下, 前面, 后面, 里',
      explanation:
        'To say where something is, put the position word AFTER the place: 桌子上 = on the table, 杯子里 = in the cup. Then use 在 to build the full sentence.',
      structure: 'A + 在 + B + 上/下/里/前面/后面',
      examples: [
        { hanzi: '杯子在桌子上。', pinyin: 'Bēizi zài zhuōzi shàng.', english: 'The cup is on the table.' },
        { hanzi: '水在杯子里。', pinyin: 'Shuǐ zài bēizi lǐ.', english: 'The water is in the cup.' },
        { hanzi: '学校在商店前面。', pinyin: 'Xuéxiào zài shāngdiàn qiánmiàn.', english: 'The school is in front of the shop.' },
      ],
      mistakes: [
        { wrong: '杯子在上桌子。', right: '杯子在桌子上。', note: 'The position word comes AFTER the place, not before it.' },
        { wrong: '水在杯子。', right: '水在杯子里。', note: 'For "inside" you need 里 after the place.' },
      ],
    },
    {
      id: 'g5-2',
      title: 'Asking where with 哪儿',
      explanation:
        '哪儿 (nǎr) means "where". In a “where is …?” question, 哪儿 replaces the place — you do not need a different word order.',
      structure: '… + 在 + 哪儿？',
      examples: [
        { hanzi: '你的学校在哪儿？', pinyin: 'Nǐ de xuéxiào zài nǎr?', english: 'Where is your school?' },
        { hanzi: '饭店在哪儿？', pinyin: 'Fàndiàn zài nǎr?', english: 'Where is the restaurant?' },
        { hanzi: '我的杯子在哪儿？', pinyin: 'Wǒ de bēizi zài nǎr?', english: 'Where is my cup?' },
      ],
      mistakes: [
        { wrong: '哪儿你的学校？', right: '你的学校在哪儿？', note: '哪儿 goes at the end, after 在.' },
        { wrong: '你的学校是在哪儿？', right: '你的学校在哪儿？', note: 'With places use 在 — do not add 是.' },
      ],
    },
    {
      id: 'g5-3',
      title: '来 and 去 — coming and going',
      explanation:
        '去 (qù) is to go AWAY from where the speaker is; 来 (lái) is to come TOWARD the speaker. Both go straight before the place or action.',
      structure: 'Subject + 去/来 + Place',
      examples: [
        { hanzi: '我去中国。', pinyin: 'Wǒ qù Zhōngguó.', english: 'I go to China.' },
        { hanzi: '王老师来学校。', pinyin: 'Wáng lǎoshī lái xuéxiào.', english: 'Mr. Wang comes to school.' },
        { hanzi: '你来我的家。', pinyin: 'Nǐ lái wǒ de jiā.', english: 'You come to my home.' },
      ],
      mistakes: [
        { wrong: '我来去学校。', right: '我去学校。', note: 'Choose 来 or 去 — never both together.' },
        { wrong: '我去我的家。', right: '我回家。', note: 'For “go home” Chinese normally says 回家.' },
      ],
    },
  ],

  // ===== Stage 6 =====
  [
    {
      id: 'g6-1',
      title: '有 — to have',
      explanation:
        '有 (yǒu) means "to have" or "there is/are". To say you do NOT have something, use 没有 (méiyǒu) — not 不有.',
      structure: 'Subject + 有 + Thing  ·  Negation: Subject + 没有 + Thing',
      examples: [
        { hanzi: '我有一个儿子。', pinyin: 'Wǒ yǒu yí gè érzi.', english: 'I have a son.' },
        { hanzi: '桌子上有一个杯子。', pinyin: 'Zhuōzi shàng yǒu yí gè bēizi.', english: 'There is a cup on the table.' },
        { hanzi: '我没有猫。', pinyin: 'Wǒ méiyǒu māo.', english: 'I do not have a cat.' },
      ],
      mistakes: [
        { wrong: '我不有猫。', right: '我没有猫。', note: '有 is always negated with 没, never with 不.' },
        { wrong: '我有是猫。', right: '我有一只猫。/ 我有个猫。', note: 'Do not put 是 after 有 — add a number/measure word instead.' },
      ],
    },
    {
      id: 'g6-2',
      title: '想 — to want to',
      explanation:
        '想 (xiǎng) + verb means "want to do" something: 我想吃 = I want to eat. It goes before the verb, like "want to" in English.',
      structure: 'Subject + 想 + Verb (+ Object)',
      examples: [
        { hanzi: '我想喝水。', pinyin: 'Wǒ xiǎng hē shuǐ.', english: 'I want to drink water.' },
        { hanzi: '我想吃苹果。', pinyin: 'Wǒ xiǎng chī píngguǒ.', english: 'I want to eat an apple.' },
        { hanzi: '你想喝茶吗？', pinyin: 'Nǐ xiǎng hē chá ma?', english: 'Do you want to drink tea?' },
      ],
      mistakes: [
        { wrong: '我喝水想。', right: '我想喝水。', note: '想 comes BEFORE the verb, not after.' },
        { wrong: '我想水。', right: '我想喝水。', note: '想 + verb: you “want TO DRINK water”, not “want water”.' },
      ],
    },
    {
      id: 'g6-3',
      title: '一点儿 — a little',
      explanation:
        '一点儿 (yìdiǎnr) means "a little (bit)". Put it before a noun to make the amount small: 我喝一点儿水.',
      structure: 'Verb + 一点儿 + Noun',
      examples: [
        { hanzi: '我喝一点儿水。', pinyin: 'Wǒ hē yìdiǎnr shuǐ.', english: 'I drink a little water.' },
        { hanzi: '我买一点儿苹果。', pinyin: 'Wǒ mǎi yìdiǎnr píngguǒ.', english: 'I buy a few apples.' },
        { hanzi: '一点儿米饭，谢谢。', pinyin: 'Yìdiǎnr mǐfàn, xièxie.', english: 'A little rice, please.' },
      ],
      mistakes: [
        { wrong: '我喝一点儿。水', right: '我喝一点儿水。', note: '一点儿 + noun stay together before the sentence ends.' },
        { wrong: '我很一点儿水。', right: '我喝一点儿水。', note: '一点儿 describes an amount — pair it with a verb like 喝/吃/买.' },
      ],
    },
  ],

  // ===== Stage 7 =====
  [
    {
      id: 'g7-1',
      title: 'Measure word 本 for books',
      explanation:
        'Books and notebooks use their own measure word 本 (běn) instead of 个: 一本书 = one book, 三本书 = three books.',
      structure: 'Number + 本 + 书/本子',
      examples: [
        { hanzi: '我买三本书。', pinyin: 'Wǒ mǎi sān běn shū.', english: 'I buy three books.' },
        { hanzi: '一本汉语书。', pinyin: 'Yì běn hànyǔ shū.', english: 'One Chinese book.' },
        { hanzi: '这是五本书。', pinyin: 'Zhè shì wǔ běn shū.', english: 'These are five books.' },
      ],
      mistakes: [
        { wrong: '三个书。', right: '三本书。', note: 'Books take 本, not 个.' },
        { wrong: '书三本。', right: '三本书。', note: 'Number first, then 本, then the noun.' },
      ],
    },
    {
      id: 'g7-2',
      title: '看见 — to see (result)',
      explanation:
        '看 means "to look at"; 看见 means the action WORKED — you actually saw it. The second verb 见 shows the result. 看书 = read a book; 看见老师 = catch sight of the teacher.',
      structure: '看 (look) + 见 (result) = 看见 (to see)',
      examples: [
        { hanzi: '我看书。', pinyin: 'Wǒ kàn shū.', english: 'I read a book.' },
        { hanzi: '我看见王老师。', pinyin: 'Wǒ kànjiàn Wáng lǎoshī.', english: 'I see Mr. Wang.' },
        { hanzi: '你看见我的猫吗？', pinyin: 'Nǐ kànjiàn wǒ de māo ma?', english: 'Did you see my cat?' },
      ],
      mistakes: [
        { wrong: '我看书王老师。', right: '我看见王老师。', note: 'Use 看见 for spotting someone, not 看书.' },
        { wrong: '我看见书。', right: '我看书。', note: 'Reading a book is 看 (or 读), not 看见.' },
      ],
    },
    {
      id: 'g7-3',
      title: 'Asking about work and study: 什么',
      explanation:
        'Put 什么 (what) before the noun you are asking about: 做什么工作 = do what job, 学习什么 = study what. The question word sits where the answer would be.',
      structure: 'Subject + Verb + 什么 + Noun？',
      examples: [
        { hanzi: '你做什么工作？', pinyin: 'Nǐ zuò shénme gōngzuò?', english: 'What work do you do?' },
        { hanzi: '你学习什么？', pinyin: 'Nǐ xuéxí shénme?', english: 'What do you study?' },
        { hanzi: '你看什么书？', pinyin: 'Nǐ kàn shénme shū?', english: 'What book are you reading?' },
      ],
      mistakes: [
        { wrong: '你什么做工作？', right: '你做什么工作？', note: '什么 comes before the noun, after the verb.' },
        { wrong: '什么你学习？', right: '你学习什么？', note: 'The subject stays first — 什么 replaces the missing object.' },
      ],
    },
  ],

  // ===== Stage 8 =====
  [
    {
      id: 'g8-1',
      title: 'Big, small, many, few',
      explanation:
        'Adjectives 大 (big), 小 (small), 多 (many), 少 (few) work with 很: 我的学校很大. You can contrast two things: 这个大，那个小.',
      structure: 'A + 很 + 大/小/多/少  ·  这(个) + Adj，那(个) + Adj',
      examples: [
        { hanzi: '我的学校很大。', pinyin: 'Wǒ de xuéxiào hěn dà.', english: 'My school is very big.' },
        { hanzi: '我的桌子很小。', pinyin: 'Wǒ de zhuōzi hěn xiǎo.', english: 'My table is very small.' },
        { hanzi: '我的书很多，水很少。', pinyin: 'Wǒ de shū hěn duō, shuǐ hěn shǎo.', english: 'I have many books and little water.' },
      ],
      mistakes: [
        { wrong: '我的学校是很大。', right: '我的学校很大。', note: 'No 是 with adjectives — use 很.' },
        { wrong: '这个很大，那个大。', right: '这个大，那个小。', note: 'Pick the adjective each thing actually needs.' },
      ],
    },
    {
      id: 'g8-2',
      title: '回 — going back',
      explanation:
        '回 (huí) means to go BACK to a place you belong to: 回家 = go home, 回北京 = go back to Beijing. It replaces 去 — you do not say 去回家.',
      structure: 'Subject + 回 + Place',
      examples: [
        { hanzi: '我回家。', pinyin: 'Wǒ huí jiā.', english: 'I go home.' },
        { hanzi: '王老师回学校。', pinyin: 'Wáng lǎoshī huí xuéxiào.', english: 'Mr. Wang goes back to school.' },
        { hanzi: '明天我回北京。', pinyin: 'Míngtiān wǒ huí Běijīng.', english: 'Tomorrow I go back to Beijing.' },
      ],
      mistakes: [
        { wrong: '我去回家。', right: '我回家。', note: '回 already contains “go” — never add 去 before it.' },
        { wrong: '我回在家的。', right: '我回家。', note: 'After 回 say the place directly, with no 的 or 在.' },
      ],
    },
    {
      id: 'g8-3',
      title: 'Talking about the weather',
      explanation:
        '天气 (tiānqì) means weather. Say how it is with 很 + adjective: 天气很热. Rain is a verb: 下雨 — 今天下雨 means "it rains today".',
      structure: 'Time + 天气 + 很 + 冷/热  ·  Time + 下雨',
      examples: [
        { hanzi: '北京天气很好。', pinyin: 'Běijīng tiānqì hěn hǎo.', english: 'The weather in Beijing is very good.' },
        { hanzi: '今天很冷。', pinyin: 'Jīntiān hěn lěng.', english: 'Today is very cold.' },
        { hanzi: '今天下雨。', pinyin: 'Jīntiān xiàyǔ.', english: 'It is raining today.' },
      ],
      mistakes: [
        { wrong: '今天天气是热。', right: '今天天气很热。', note: 'Adjectives take 很, not 是.' },
        { wrong: '今天有下雨。', right: '今天下雨。', note: '下雨 is already a verb — do not add 有.' },
      ],
    },
  ],

  // ===== Stage 9 =====
  [
    {
      id: 'g9-1',
      title: '会 — can (a learned skill)',
      explanation:
        '会 (huì) means you CAN do something because you learned it: 我会说汉语 (I can speak Chinese — I studied it). It goes before the verb.',
      structure: 'Subject + 会 + Verb (+ Object)',
      examples: [
        { hanzi: '我会说汉语。', pinyin: 'Wǒ huì shuō hànyǔ.', english: 'I can speak Chinese.' },
        { hanzi: '他会写汉字。', pinyin: 'Tā huì xiě hànzì.', english: 'He can write Chinese characters.' },
        { hanzi: '我不会打……', pinyin: 'Wǒ bú huì dǎ…', english: 'I cannot play… (learned skills: 会 with 不 → bú huì)' },
      ],
      mistakes: [
        { wrong: '我很会说汉语。', right: '我会说汉语。', note: 'With 会 you do not need 很 before it.' },
        { wrong: '我说话汉语。', right: '我说汉语。/ 我会说汉语。', note: '说 already means “speak” — 会 adds the “can”.' },
      ],
    },
    {
      id: 'g9-2',
      title: '能 — can / may (possibility & permission)',
      explanation:
        '能 (néng) means something is possible or allowed: 我能坐这儿吗？(May I sit here?). Use 能 for permission and circumstances, 会 for skills you learned.',
      structure: 'Subject + 能 + Verb (+ 吗？)',
      examples: [
        { hanzi: '我能坐这儿吗？', pinyin: 'Wǒ néng zuò zhèr ma?', english: 'May I sit here?' },
        { hanzi: '我能吃这个苹果吗？', pinyin: 'Wǒ néng chī zhè gè píngguǒ ma?', english: 'May I eat this apple?' },
        { hanzi: '今天我不能来。', pinyin: 'Jīntiān wǒ bù néng lái.', english: 'Today I cannot come.' },
      ],
      mistakes: [
        { wrong: '我能够吗？', right: '我能坐这儿吗？', note: 'At HSK 1, 能 + verb is enough — no extra words needed.' },
        { wrong: '我能说汉语，我学习了。', right: '我会说汉语，我学习了。', note: 'A learned skill takes 会; 能 is about possibility/permission.' },
      ],
    },
    {
      id: 'g9-3',
      title: '喜欢 — to like',
      explanation:
        '喜欢 (xǐhuan) means "to like". It can take a noun (我喜欢猫) or another verb (我喜欢看书 = I like reading).',
      structure: 'Subject + 喜欢 + Noun / Verb (+ Object)',
      examples: [
        { hanzi: '我喜欢猫。', pinyin: 'Wǒ xǐhuan māo.', english: 'I like cats.' },
        { hanzi: '我喜欢看书。', pinyin: 'Wǒ xǐhuan kàn shū.', english: 'I like reading books.' },
        { hanzi: '你喜欢吃米饭吗？', pinyin: 'Nǐ xǐhuan chī mǐfàn ma?', english: 'Do you like eating rice?' },
      ],
      mistakes: [
        { wrong: '我猫喜欢。', right: '我喜欢猫。', note: '喜欢 comes before the thing you like.' },
        { wrong: '我很喜欢是猫。', right: '我很喜欢猫。', note: 'Do not put 是 after 喜欢.' },
      ],
    },
  ],

  // ===== Stage 10 =====
  [
    {
      id: 'g10-1',
      title: '了 — it happened / it is done',
      explanation:
        '了 (le) after a verb shows the action is completed — often like the English past tense: 我买了一本书 = I bought a book. 了 also follows 太……了 for strong feelings.',
      structure: 'Subject + Verb + 了 + Object',
      examples: [
        { hanzi: '我买了一本书。', pinyin: 'Wǒ mǎi le yì běn shū.', english: 'I bought a book.' },
        { hanzi: '他来了。', pinyin: 'Tā lái le.', english: 'He has come.' },
        { hanzi: '我吃了米饭。', pinyin: 'Wǒ chī le mǐfàn.', english: 'I ate the rice.' },
      ],
      mistakes: [
        { wrong: '我买一本书了书。', right: '我买了一本书。', note: '了 comes right after the verb, before the object.' },
        { wrong: '昨天我买书。', right: '昨天我买了书。', note: 'With a finished action like 昨天, use verb + 了.' },
      ],
    },
    {
      id: 'g10-2',
      title: '太……了 — so / too',
      explanation:
        '太 (tài) + adjective + 了 (le) is a set pattern meaning "so / too": 太好了！= Wonderful! The 了 at the end is part of the pattern.',
      structure: 'Subject + 太 + Adjective + 了',
      examples: [
        { hanzi: '太好了！', pinyin: 'Tài hǎo le!', english: 'Wonderful!' },
        { hanzi: '今天天气太热了！', pinyin: 'Jīntiān tiānqì tài rè le!', english: 'The weather today is way too hot!' },
        { hanzi: '你的猫太漂亮了！', pinyin: 'Nǐ de māo tài piàoliang le!', english: 'Your cat is so pretty!' },
      ],
      mistakes: [
        { wrong: '太好了吗。', right: '太好了！', note: '太……了 is an exclamation — no 吗 at the end.' },
        { wrong: '这个太贵。', right: '这个太贵了。', note: 'The pattern needs the final 了.' },
      ],
    },
    {
      id: 'g10-3',
      title: 'Asking prices and amounts: 多少 / 几 / 块',
      explanation:
        'Ask a price with 多少钱: 这个多少钱？ (How much is this?) Money is counted in 块 (kuài, yuan): 五块 = five yuan. For small numbers use 几: 你几岁？',
      structure: '这个 + 多少钱？  ·  Number + 块  ·  几 + Measure/Noun',
      examples: [
        { hanzi: '这个多少钱？', pinyin: 'Zhè gè duōshao qián?', english: 'How much is this?' },
        { hanzi: '一个苹果五块。', pinyin: 'Yí gè píngguǒ wǔ kuài.', english: 'An apple is five yuan.' },
        { hanzi: '你几岁？', pinyin: 'Nǐ jǐ suì?', english: 'How old are you?' },
      ],
      mistakes: [
        { wrong: '这个几钱？', right: '这个多少钱？', note: 'The price question word is 多少钱 — one fixed phrase.' },
        { wrong: '苹果五块儿钱。', right: '一个苹果五块。', note: 'At HSK 1 say number + 块, nothing extra.' },
      ],
    },
  ],
]

