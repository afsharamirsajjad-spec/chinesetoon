// ---------------------------------------------------------------------------
// 📚 HSK 1 vocabulary — the complete official 150-word list (HSK 2.0 standard),
// distributed progressively over 10 stages and grouped by the stage themes of
// the HSK 1 textbook. Every entry carries hanzi, tone-marked pinyin, English
// meaning, category and a simple example sentence built from words taught in
// the same or earlier stages (a few textbook-standard proper names — 玛丽,
// 大卫, 王, 李, 小明 — also appear, as in the textbook itself).
//
// Sources cross-checked: hsk.academy/en/hsk_1 (exactly 150) and
// mandarinbean.com HSK 1 list (exactly 150) — both match the official
// Hanban word list.
//
// CLIENT-SAFE: no answer keys here.
// ---------------------------------------------------------------------------

import type { HskWord } from './types'

export const STAGE_WORDS: HskWord[][] = [
  // =======================================================================
  // Stage 1 — Hello! First words: pronouns, greetings, 是, 吗, particles
  // =======================================================================
  [
    {
      hanzi: '你', pinyin: 'nǐ', meaning: 'you', category: 'pronoun',
      example: '你好！', examplePinyin: 'nǐ hǎo!', exampleEnglish: 'Hello!',
    },
    {
      hanzi: '我', pinyin: 'wǒ', meaning: 'I; me', category: 'pronoun',
      example: '我是大卫。', examplePinyin: 'wǒ shì Dàwèi.', exampleEnglish: 'I am David.',
    },
    {
      hanzi: '好', pinyin: 'hǎo', meaning: 'good; fine', category: 'adjective',
      example: '我很好，谢谢！', examplePinyin: 'wǒ hěn hǎo, xièxie!', exampleEnglish: 'I am fine, thanks!',
    },
    {
      hanzi: '很', pinyin: 'hěn', meaning: 'very', category: 'adverb',
      example: '我很好。', examplePinyin: 'wǒ hěn hǎo.', exampleEnglish: 'I am very well.',
    },
    {
      hanzi: '不', pinyin: 'bù', meaning: 'not; no', category: 'adverb',
      example: '我不叫玛丽。', examplePinyin: 'wǒ bú jiào Mǎlì.', exampleEnglish: 'My name is not Mary.',
    },
    {
      hanzi: '吗', pinyin: 'ma', meaning: 'question particle', category: 'particle',
      example: '你好吗？', examplePinyin: 'nǐ hǎo ma?', exampleEnglish: 'How are you?',
    },
    {
      hanzi: '呢', pinyin: 'ne', meaning: 'question particle (and you?)', category: 'particle',
      example: '我很好，你呢？', examplePinyin: 'wǒ hěn hǎo, nǐ ne?', exampleEnglish: 'I am fine, and you?',
    },
    {
      hanzi: '的', pinyin: 'de', meaning: 'shows possession (like ’s)', category: 'particle',
      example: '我的名字是大卫。', examplePinyin: 'wǒ de míngzi shì Dàwèi.', exampleEnglish: 'My name is David.',
    },
    {
      hanzi: '是', pinyin: 'shì', meaning: 'to be (am / is / are)', category: 'verb',
      example: '你是学生吗？', examplePinyin: 'nǐ shì xuésheng ma?', exampleEnglish: 'Are you a student?',
    },
    {
      hanzi: '叫', pinyin: 'jiào', meaning: 'to be called; to call', category: 'verb',
      example: '你叫什么名字？', examplePinyin: 'nǐ jiào shénme míngzi?', exampleEnglish: 'What is your name?',
    },
    {
      hanzi: '名字', pinyin: 'míngzi', meaning: 'name', category: 'noun',
      example: '我的名字是小明。', examplePinyin: 'wǒ de míngzi shì Xiǎomíng.', exampleEnglish: 'My name is Xiaoming.',
    },
    {
      hanzi: '什么', pinyin: 'shénme', meaning: 'what', category: 'pronoun',
      example: '这是什么？', examplePinyin: 'zhè shì shénme?', exampleEnglish: 'What is this?',
    },
    {
      hanzi: '谢谢', pinyin: 'xièxie', meaning: 'thank you', category: 'verb',
      example: '谢谢你的书。', examplePinyin: 'xièxie nǐ de shū.', exampleEnglish: 'Thanks for your book.',
    },
    {
      hanzi: '不客气', pinyin: 'bú kèqi', meaning: 'you are welcome', category: 'other',
      example: '——谢谢！ ——不客气！', examplePinyin: '——xièxie! ——bú kèqi!', exampleEnglish: '—Thank you! —You are welcome!',
    },
    {
      hanzi: '再见', pinyin: 'zàijiàn', meaning: 'goodbye', category: 'other',
      example: '老师，再见！', examplePinyin: 'lǎoshī, zàijiàn!', exampleEnglish: 'Goodbye, teacher!',
    },
  ],

  // =======================================================================
  // Stage 2 — People around you: family, people, 这/那, 都
  // =======================================================================
  [
    {
      hanzi: '我们', pinyin: 'wǒmen', meaning: 'we; us', category: 'pronoun',
      example: '我们都是学生。', examplePinyin: 'wǒmen dōu shì xuésheng.', exampleEnglish: 'We are all students.',
    },
    {
      hanzi: '他', pinyin: 'tā', meaning: 'he; him', category: 'pronoun',
      example: '他是我的爸爸。', examplePinyin: 'tā shì wǒ de bàba.', exampleEnglish: 'He is my dad.',
    },
    {
      hanzi: '她', pinyin: 'tā', meaning: 'she; her', category: 'pronoun',
      example: '她是我的妈妈。', examplePinyin: 'tā shì wǒ de māma.', exampleEnglish: 'She is my mum.',
    },
    {
      hanzi: '这', pinyin: 'zhè', meaning: 'this (also 这儿 zhèr “here”)', category: 'pronoun',
      example: '这是玛丽。', examplePinyin: 'zhè shì Mǎlì.', exampleEnglish: 'This is Mary.',
    },
    {
      hanzi: '那', pinyin: 'nà', meaning: 'that (also 那儿 nàr “there”)', category: 'pronoun',
      example: '那是我的老师。', examplePinyin: 'nà shì wǒ de lǎoshī.', exampleEnglish: 'That is my teacher.',
    },
    {
      hanzi: '谁', pinyin: 'shéi', meaning: 'who', category: 'pronoun',
      example: '他是谁？', examplePinyin: 'tā shì shéi?', exampleEnglish: 'Who is he?',
    },
    {
      hanzi: '都', pinyin: 'dōu', meaning: 'all; both', category: 'adverb',
      example: '我们都是学生。', examplePinyin: 'wǒmen dōu shì xuésheng.', exampleEnglish: 'We are all students.',
    },
    {
      hanzi: '爸爸', pinyin: 'bàba', meaning: 'dad; father', category: 'noun',
      example: '我的爸爸是老师。', examplePinyin: 'wǒ de bàba shì lǎoshī.', exampleEnglish: 'My dad is a teacher.',
    },
    {
      hanzi: '妈妈', pinyin: 'māma', meaning: 'mum; mother', category: 'noun',
      example: '你的妈妈好吗？', examplePinyin: 'nǐ de māma hǎo ma?', exampleEnglish: 'How is your mum?',
    },
    {
      hanzi: '儿子', pinyin: 'érzi', meaning: 'son', category: 'noun',
      example: '他的儿子是学生。', examplePinyin: 'tā de érzi shì xuésheng.', exampleEnglish: 'His son is a student.',
    },
    {
      hanzi: '女儿', pinyin: 'nǚ’ér', meaning: 'daughter', category: 'noun',
      example: '他的女儿叫玛丽。', examplePinyin: 'tā de nǚ’ér jiào Mǎlì.', exampleEnglish: 'His daughter is called Mary.',
    },
    {
      hanzi: '先生', pinyin: 'xiānsheng', meaning: 'Mr.; sir', category: 'noun',
      example: '王先生是我的老师。', examplePinyin: 'Wáng xiānsheng shì wǒ de lǎoshī.', exampleEnglish: 'Mr. Wang is my teacher.',
    },
    {
      hanzi: '小姐', pinyin: 'xiǎojiě', meaning: 'Miss; young lady', category: 'noun',
      example: '李小姐是老师。', examplePinyin: 'Lǐ xiǎojiě shì lǎoshī.', exampleEnglish: 'Miss Li is a teacher.',
    },
    {
      hanzi: '老师', pinyin: 'lǎoshī', meaning: 'teacher', category: 'noun',
      example: '王老师很好。', examplePinyin: 'Wáng lǎoshī hěn hǎo.', exampleEnglish: 'Mr. Wang is very kind.',
    },
    {
      hanzi: '学生', pinyin: 'xuésheng', meaning: 'student', category: 'noun',
      example: '我们都是学生。', examplePinyin: 'wǒmen dōu shì xuésheng.', exampleEnglish: 'We are all students.',
    },
  ],

  // =======================================================================
  // Stage 3 — Numbers, age & dates
  // =======================================================================
  [
    {
      hanzi: '一', pinyin: 'yī', meaning: 'one', category: 'number',
      example: '一月一号。', examplePinyin: 'yī yuè yī hào.', exampleEnglish: 'January 1st.',
    },
    {
      hanzi: '二', pinyin: 'èr', meaning: 'two', category: 'number',
      example: '二月二号。', examplePinyin: 'èr yuè èr hào.', exampleEnglish: 'February 2nd.',
    },
    {
      hanzi: '三', pinyin: 'sān', meaning: 'three', category: 'number',
      example: '我三岁。', examplePinyin: 'wǒ sān suì.', exampleEnglish: 'I am three years old.',
    },
    {
      hanzi: '四', pinyin: 'sì', meaning: 'four', category: 'number',
      example: '四月四号。', examplePinyin: 'sì yuè sì hào.', exampleEnglish: 'April 4th.',
    },
    {
      hanzi: '五', pinyin: 'wǔ', meaning: 'five', category: 'number',
      example: '我们五个人。', examplePinyin: 'wǒmen wǔ gè rén.', exampleEnglish: 'We are five people.',
    },
    {
      hanzi: '六', pinyin: 'liù', meaning: 'six', category: 'number',
      example: '六月六号。', examplePinyin: 'liù yuè liù hào.', exampleEnglish: 'June 6th.',
    },
    {
      hanzi: '七', pinyin: 'qī', meaning: 'seven', category: 'number',
      example: '七月七号。', examplePinyin: 'qī yuè qī hào.', exampleEnglish: 'July 7th.',
    },
    {
      hanzi: '八', pinyin: 'bā', meaning: 'eight', category: 'number',
      example: '八月八号。', examplePinyin: 'bā yuè bā hào.', exampleEnglish: 'August 8th.',
    },
    {
      hanzi: '九', pinyin: 'jiǔ', meaning: 'nine', category: 'number',
      example: '九月九号。', examplePinyin: 'jiǔ yuè jiǔ hào.', exampleEnglish: 'September 9th.',
    },
    {
      hanzi: '十', pinyin: 'shí', meaning: 'ten', category: 'number',
      example: '十月十号。', examplePinyin: 'shí yuè shí hào.', exampleEnglish: 'October 10th.',
    },
    {
      hanzi: '岁', pinyin: 'suì', meaning: 'years old (age)', category: 'measure',
      example: '我二十岁。', examplePinyin: 'wǒ èrshí suì.', exampleEnglish: 'I am twenty years old.',
    },
    {
      hanzi: '个', pinyin: 'gè', meaning: 'general measure word', category: 'measure',
      example: '他是个学生。', examplePinyin: 'tā shì gè xuésheng.', exampleEnglish: 'He is a student.',
    },
    {
      hanzi: '年', pinyin: 'nián', meaning: 'year', category: 'noun',
      example: '一年、二年、三年。', examplePinyin: 'yì nián, liǎng nián, sān nián.', exampleEnglish: 'One year, two years, three years.',
    },
    {
      hanzi: '月', pinyin: 'yuè', meaning: 'month', category: 'noun',
      example: '十月是我的月。', examplePinyin: 'shí yuè shì wǒ de yuè.', exampleEnglish: 'October is my month.',
    },
    {
      hanzi: '号', pinyin: 'hào', meaning: 'date (day of month); number', category: 'noun',
      example: '我的号是九。', examplePinyin: 'wǒ de hào shì jiǔ.', exampleEnglish: 'My number is nine.',
    },
  ],

  // =======================================================================
  // Stage 4 — Time & days; 在 and 去
  // =======================================================================
  [
    {
      hanzi: '点', pinyin: 'diǎn', meaning: "o'clock", category: 'measure',
      example: '现在十点。', examplePinyin: 'xiànzài shí diǎn.', exampleEnglish: 'It is ten o’clock now.',
    },
    {
      hanzi: '分钟', pinyin: 'fēnzhōng', meaning: 'minute', category: 'noun',
      example: '十五分钟。', examplePinyin: 'shíwǔ fēnzhōng.', exampleEnglish: 'Fifteen minutes.',
    },
    {
      hanzi: '星期', pinyin: 'xīngqī', meaning: 'week; weekday', category: 'noun',
      example: '星期一我去学校。', examplePinyin: 'xīngqī yī wǒ qù xuéxiào.', exampleEnglish: 'I go to school on Monday.',
    },
    {
      hanzi: '今天', pinyin: 'jīntiān', meaning: 'today', category: 'noun',
      example: '今天我很好。', examplePinyin: 'jīntiān wǒ hěn hǎo.', exampleEnglish: 'Today I am fine.',
    },
    {
      hanzi: '明天', pinyin: 'míngtiān', meaning: 'tomorrow', category: 'noun',
      example: '明天我去北京。', examplePinyin: 'míngtiān wǒ qù Běijīng.', exampleEnglish: 'Tomorrow I go to Beijing.',
    },
    {
      hanzi: '昨天', pinyin: 'zuótiān', meaning: 'yesterday', category: 'noun',
      example: '昨天是十月十号。', examplePinyin: 'zuótiān shì shí yuè shí hào.', exampleEnglish: 'Yesterday was October 10th.',
    },
    {
      hanzi: '上午', pinyin: 'shàngwǔ', meaning: 'morning (before noon)', category: 'noun',
      example: '上午我在家。', examplePinyin: 'shàngwǔ wǒ zài jiā.', exampleEnglish: 'In the morning I am at home.',
    },
    {
      hanzi: '中午', pinyin: 'zhōngwǔ', meaning: 'noon; midday', category: 'noun',
      example: '中午我在家。', examplePinyin: 'zhōngwǔ wǒ zài jiā.', exampleEnglish: 'At noon I am at home.',
    },
    {
      hanzi: '下午', pinyin: 'xiàwǔ', meaning: 'afternoon', category: 'noun',
      example: '下午我去学校。', examplePinyin: 'xiàwǔ wǒ qù xuéxiào.', exampleEnglish: 'In the afternoon I go to school.',
    },
    {
      hanzi: '现在', pinyin: 'xiànzài', meaning: 'now', category: 'noun',
      example: '现在十点。', examplePinyin: 'xiànzài shí diǎn.', exampleEnglish: 'It is ten o’clock now.',
    },
    {
      hanzi: '时候', pinyin: 'shíhou', meaning: 'time; moment', category: 'noun',
      example: '你什么时候在家？', examplePinyin: 'nǐ shénme shíhou zài jiā?', exampleEnglish: 'When are you at home?',
    },
    {
      hanzi: '在', pinyin: 'zài', meaning: 'at; in; to be at', category: 'verb',
      example: '我在学校。', examplePinyin: 'wǒ zài xuéxiào.', exampleEnglish: 'I am at school.',
    },
    {
      hanzi: '家', pinyin: 'jiā', meaning: 'home; family', category: 'noun',
      example: '这是我的家。', examplePinyin: 'zhè shì wǒ de jiā.', exampleEnglish: 'This is my home.',
    },
    {
      hanzi: '学校', pinyin: 'xuéxiào', meaning: 'school', category: 'noun',
      example: '这是我的学校。', examplePinyin: 'zhè shì wǒ de xuéxiào.', exampleEnglish: 'This is my school.',
    },
    {
      hanzi: '去', pinyin: 'qù', meaning: 'to go', category: 'verb',
      example: '我去学校。', examplePinyin: 'wǒ qù xuéxiào.', exampleEnglish: 'I go to school.',
    },
  ],

  // =======================================================================
  // Stage 5 — Places & positions: position words, 哪儿, cities, things
  // =======================================================================
  [
    {
      hanzi: '上', pinyin: 'shàng', meaning: 'on; above; up', category: 'noun',
      example: '杯子在桌子上。', examplePinyin: 'bēizi zài zhuōzi shàng.', exampleEnglish: 'The cup is on the table.',
    },
    {
      hanzi: '下', pinyin: 'xià', meaning: 'under; below; down', category: 'noun',
      example: '椅子在桌子下面。', examplePinyin: 'yǐzi zài zhuōzi xiàmiàn.', exampleEnglish: 'The chair is under the table.',
    },
    {
      hanzi: '前面', pinyin: 'qiánmiàn', meaning: 'in front (of)', category: 'noun',
      example: '学校在商店前面。', examplePinyin: 'xuéxiào zài shāngdiàn qiánmiàn.', exampleEnglish: 'The school is in front of the shop.',
    },
    {
      hanzi: '后面', pinyin: 'hòumiàn', meaning: 'behind; at the back', category: 'noun',
      example: '饭店在后面。', examplePinyin: 'fàndiàn zài hòumiàn.', exampleEnglish: 'The restaurant is at the back.',
    },
    {
      hanzi: '里', pinyin: 'lǐ', meaning: 'in; inside', category: 'noun',
      example: '水在杯子里。', examplePinyin: 'shuǐ zài bēizi lǐ.', exampleEnglish: 'The water is in the cup.',
    },
    {
      hanzi: '哪', pinyin: 'nǎ', meaning: 'which', category: 'pronoun',
      example: '哪个是你的杯子？', examplePinyin: 'nǎ gè shì nǐ de bēizi?', exampleEnglish: 'Which cup is yours?',
    },
    {
      hanzi: '哪儿', pinyin: 'nǎr', meaning: 'where', category: 'pronoun',
      example: '你的学校在哪儿？', examplePinyin: 'nǐ de xuéxiào zài nǎr?', exampleEnglish: 'Where is your school?',
    },
    {
      hanzi: '中国', pinyin: 'Zhōngguó', meaning: 'China', category: 'noun',
      example: '我的家在中国。', examplePinyin: 'wǒ de jiā zài Zhōngguó.', exampleEnglish: 'My home is in China.',
    },
    {
      hanzi: '北京', pinyin: 'Běijīng', meaning: 'Beijing (capital of China)', category: 'noun',
      example: '北京在中国。', examplePinyin: 'Běijīng zài Zhōngguó.', exampleEnglish: 'Beijing is in China.',
    },
    {
      hanzi: '饭店', pinyin: 'fàndiàn', meaning: 'restaurant; hotel', category: 'noun',
      example: '饭店在哪儿？', examplePinyin: 'fàndiàn zài nǎr?', exampleEnglish: 'Where is the restaurant?',
    },
    {
      hanzi: '商店', pinyin: 'shāngdiàn', meaning: 'shop; store', category: 'noun',
      example: '商店在前面。', examplePinyin: 'shāngdiàn zài qiánmiàn.', exampleEnglish: 'The shop is in front.',
    },
    {
      hanzi: '医院', pinyin: 'yīyuàn', meaning: 'hospital', category: 'noun',
      example: '医院在学校后面。', examplePinyin: 'yīyuàn zài xuéxiào hòumiàn.', exampleEnglish: 'The hospital is behind the school.',
    },
    {
      hanzi: '杯子', pinyin: 'bēizi', meaning: 'cup; glass', category: 'noun',
      example: '杯子在桌子上。', examplePinyin: 'bēizi zài zhuōzi shàng.', exampleEnglish: 'The cup is on the table.',
    },
    {
      hanzi: '桌子', pinyin: 'zhuōzi', meaning: 'table; desk', category: 'noun',
      example: '这是我的桌子。', examplePinyin: 'zhè shì wǒ de zhuōzi.', exampleEnglish: 'This is my table.',
    },
    {
      hanzi: '水', pinyin: 'shuǐ', meaning: 'water', category: 'noun',
      example: '水在杯子里。', examplePinyin: 'shuǐ zài bēizi lǐ.', exampleEnglish: 'The water is in the cup.',
    },
  ],

  // =======================================================================
  // Stage 6 — Food & drink: eating, drinking, 有, 想, buying
  // =======================================================================
  [
    {
      hanzi: '吃', pinyin: 'chī', meaning: 'to eat', category: 'verb',
      example: '我吃苹果。', examplePinyin: 'wǒ chī píngguǒ.', exampleEnglish: 'I eat an apple.',
    },
    {
      hanzi: '喝', pinyin: 'hē', meaning: 'to drink', category: 'verb',
      example: '我喝茶。', examplePinyin: 'wǒ hē chá.', exampleEnglish: 'I drink tea.',
    },
    {
      hanzi: '茶', pinyin: 'chá', meaning: 'tea', category: 'noun',
      example: '你想喝茶吗？', examplePinyin: 'nǐ xiǎng hē chá ma?', exampleEnglish: 'Do you want to drink tea?',
    },
    {
      hanzi: '菜', pinyin: 'cài', meaning: 'dish; vegetables; food', category: 'noun',
      example: '这个菜很好吃。', examplePinyin: 'zhè gè cài hěn hǎochī.', exampleEnglish: 'This dish is very tasty.',
    },
    {
      hanzi: '米饭', pinyin: 'mǐfàn', meaning: 'cooked rice', category: 'noun',
      example: '我吃米饭。', examplePinyin: 'wǒ chī mǐfàn.', exampleEnglish: 'I eat rice.',
    },
    {
      hanzi: '水果', pinyin: 'shuǐguǒ', meaning: 'fruit', category: 'noun',
      example: '我买水果。', examplePinyin: 'wǒ mǎi shuǐguǒ.', exampleEnglish: 'I buy fruit.',
    },
    {
      hanzi: '苹果', pinyin: 'píngguǒ', meaning: 'apple', category: 'noun',
      example: '我想吃苹果。', examplePinyin: 'wǒ xiǎng chī píngguǒ.', exampleEnglish: 'I want to eat an apple.',
    },
    {
      hanzi: '椅子', pinyin: 'yǐzi', meaning: 'chair', category: 'noun',
      example: '椅子在桌子前面。', examplePinyin: 'yǐzi zài zhuōzi qiánmiàn.', exampleEnglish: 'The chair is in front of the table.',
    },
    {
      hanzi: '飞机', pinyin: 'fēijī', meaning: 'airplane', category: 'noun',
      example: '我坐飞机去北京。', examplePinyin: 'wǒ zuò fēijī qù Běijīng.', exampleEnglish: 'I go to Beijing by plane.',
    },
    {
      hanzi: '坐', pinyin: 'zuò', meaning: 'to sit; to travel by', category: 'verb',
      example: '我坐飞机去北京。', examplePinyin: 'wǒ zuò fēijī qù Běijīng.', exampleEnglish: 'I go to Beijing by plane.',
    },
    {
      hanzi: '有', pinyin: 'yǒu', meaning: 'to have; there is', category: 'verb',
      example: '我有一个儿子。', examplePinyin: 'wǒ yǒu yí gè érzi.', exampleEnglish: 'I have a son.',
    },
    {
      hanzi: '想', pinyin: 'xiǎng', meaning: 'to want to; to think', category: 'verb',
      example: '我想喝水。', examplePinyin: 'wǒ xiǎng hē shuǐ.', exampleEnglish: 'I want to drink water.',
    },
    {
      hanzi: '买', pinyin: 'mǎi', meaning: 'to buy', category: 'verb',
      example: '我买一点儿苹果。', examplePinyin: 'wǒ mǎi yìdiǎnr píngguǒ.', exampleEnglish: 'I buy some apples.',
    },
    {
      hanzi: '一点儿', pinyin: 'yìdiǎnr', meaning: 'a little; a bit', category: 'number',
      example: '我喝一点儿水。', examplePinyin: 'wǒ hē yìdiǎnr shuǐ.', exampleEnglish: 'I drink a little water.',
    },
    {
      hanzi: '来', pinyin: 'lái', meaning: 'to come', category: 'verb',
      example: '王老师来学校。', examplePinyin: 'Wáng lǎoshī lái xuéxiào.', exampleEnglish: 'Mr. Wang comes to school.',
    },
  ],

  // =======================================================================
  // Stage 7 — Study & work: learning verbs, 汉字, measure word 本
  // =======================================================================
  [
    {
      hanzi: '看', pinyin: 'kàn', meaning: 'to look at; to watch; to read', category: 'verb',
      example: '我看书。', examplePinyin: 'wǒ kàn shū.', exampleEnglish: 'I read a book.',
    },
    {
      hanzi: '听', pinyin: 'tīng', meaning: 'to listen', category: 'verb',
      example: '我听汉语。', examplePinyin: 'wǒ tīng hànyǔ.', exampleEnglish: 'I listen to Chinese.',
    },
    {
      hanzi: '说', pinyin: 'shuō', meaning: 'to speak; to say', category: 'verb',
      example: '我说汉语。', examplePinyin: 'wǒ shuō hànyǔ.', exampleEnglish: 'I speak Chinese.',
    },
    {
      hanzi: '读', pinyin: 'dú', meaning: 'to read aloud; to study', category: 'verb',
      example: '我读汉语书。', examplePinyin: 'wǒ dú hànyǔ shū.', exampleEnglish: 'I read a Chinese book.',
    },
    {
      hanzi: '写', pinyin: 'xiě', meaning: 'to write', category: 'verb',
      example: '我写我的名字。', examplePinyin: 'wǒ xiě wǒ de míngzi.', exampleEnglish: 'I write my name.',
    },
    {
      hanzi: '看见', pinyin: 'kànjiàn', meaning: 'to see; to catch sight of', category: 'verb',
      example: '我看见王老师。', examplePinyin: 'wǒ kànjiàn Wáng lǎoshī.', exampleEnglish: 'I see Mr. Wang.',
    },
    {
      hanzi: '打电话', pinyin: 'dǎ diànhuà', meaning: 'to make a phone call', category: 'verb',
      example: '我打电话。', examplePinyin: 'wǒ dǎ diànhuà.', exampleEnglish: 'I make a phone call.',
    },
    {
      hanzi: '做', pinyin: 'zuò', meaning: 'to do; to make', category: 'verb',
      example: '你做什么工作？', examplePinyin: 'nǐ zuò shénme gōngzuò?', exampleEnglish: 'What work do you do?',
    },
    {
      hanzi: '工作', pinyin: 'gōngzuò', meaning: 'job; to work', category: 'noun',
      example: '我在学校工作。', examplePinyin: 'wǒ zài xuéxiào gōngzuò.', exampleEnglish: 'I work at a school.',
    },
    {
      hanzi: '学习', pinyin: 'xuéxí', meaning: 'to study; to learn', category: 'verb',
      example: '我学习汉语。', examplePinyin: 'wǒ xuéxí hànyǔ.', exampleEnglish: 'I study Chinese.',
    },
    {
      hanzi: '汉语', pinyin: 'hànyǔ', meaning: 'Chinese (the language)', category: 'noun',
      example: '这是汉语书。', examplePinyin: 'zhè shì hànyǔ shū.', exampleEnglish: 'This is a Chinese book.',
    },
    {
      hanzi: '字', pinyin: 'zì', meaning: 'character; script', category: 'noun',
      example: '我写汉字。', examplePinyin: 'wǒ xiě hànzì.', exampleEnglish: 'I write Chinese characters.',
    },
    {
      hanzi: '书', pinyin: 'shū', meaning: 'book', category: 'noun',
      example: '这是我的书。', examplePinyin: 'zhè shì wǒ de shū.', exampleEnglish: 'This is my book.',
    },
    {
      hanzi: '电脑', pinyin: 'diànnǎo', meaning: 'computer', category: 'noun',
      example: '电脑在我的桌子上。', examplePinyin: 'diànnǎo zài wǒ de zhuōzi shàng.', exampleEnglish: 'The computer is on my table.',
    },
    {
      hanzi: '本', pinyin: 'běn', meaning: 'measure word for books', category: 'measure',
      example: '我买三本书。', examplePinyin: 'wǒ mǎi sān běn shū.', exampleEnglish: 'I buy three books.',
    },
  ],

  // =======================================================================
  // Stage 8 — Home & weather: living, going back, size and weather words
  // =======================================================================
  [
    {
      hanzi: '住', pinyin: 'zhù', meaning: 'to live; to stay', category: 'verb',
      example: '我住在北京。', examplePinyin: 'wǒ zhù zài Běijīng.', exampleEnglish: 'I live in Beijing.',
    },
    {
      hanzi: '出租车', pinyin: 'chūzūchē', meaning: 'taxi', category: 'noun',
      example: '出租车在饭店前面。', examplePinyin: 'chūzūchē zài fàndiàn qiánmiàn.', exampleEnglish: 'The taxi is in front of the restaurant.',
    },
    {
      hanzi: '开', pinyin: 'kāi', meaning: 'to open; to drive', category: 'verb',
      example: '我开出租车。', examplePinyin: 'wǒ kāi chūzūchē.', exampleEnglish: 'I drive a taxi.',
    },
    {
      hanzi: '回', pinyin: 'huí', meaning: 'to go back; to return', category: 'verb',
      example: '我回家。', examplePinyin: 'wǒ huí jiā.', exampleEnglish: 'I go home.',
    },
    {
      hanzi: '下雨', pinyin: 'xiàyǔ', meaning: 'to rain', category: 'verb',
      example: '今天下雨。', examplePinyin: 'jīntiān xiàyǔ.', exampleEnglish: 'It rains today.',
    },
    {
      hanzi: '天气', pinyin: 'tiānqì', meaning: 'weather', category: 'noun',
      example: '北京天气很好。', examplePinyin: 'Běijīng tiānqì hěn hǎo.', exampleEnglish: 'The weather in Beijing is very good.',
    },
    {
      hanzi: '冷', pinyin: 'lěng', meaning: 'cold', category: 'adjective',
      example: '今天很冷。', examplePinyin: 'jīntiān hěn lěng.', exampleEnglish: 'Today is very cold.',
    },
    {
      hanzi: '热', pinyin: 'rè', meaning: 'hot', category: 'adjective',
      example: '天气很热。', examplePinyin: 'tiānqì hěn rè.', exampleEnglish: 'The weather is very hot.',
    },
    {
      hanzi: '大', pinyin: 'dà', meaning: 'big; old (age)', category: 'adjective',
      example: '我的学校很大。', examplePinyin: 'wǒ de xuéxiào hěn dà.', exampleEnglish: 'My school is very big.',
    },
    {
      hanzi: '小', pinyin: 'xiǎo', meaning: 'small; young', category: 'adjective',
      example: '我的桌子很小。', examplePinyin: 'wǒ de zhuōzi hěn xiǎo.', exampleEnglish: 'My table is very small.',
    },
    {
      hanzi: '多', pinyin: 'duō', meaning: 'many; much', category: 'adjective',
      example: '我的书很多。', examplePinyin: 'wǒ de shū hěn duō.', exampleEnglish: 'I have many books.',
    },
    {
      hanzi: '少', pinyin: 'shǎo', meaning: 'few; little', category: 'adjective',
      example: '水很少。', examplePinyin: 'shuǐ hěn shǎo.', exampleEnglish: 'There is very little water.',
    },
    {
      hanzi: '猫', pinyin: 'māo', meaning: 'cat', category: 'noun',
      example: '我的猫很小。', examplePinyin: 'wǒ de māo hěn xiǎo.', exampleEnglish: 'My cat is very small.',
    },
    {
      hanzi: '狗', pinyin: 'gǒu', meaning: 'dog', category: 'noun',
      example: '我的狗很好。', examplePinyin: 'wǒ de gǒu hěn hǎo.', exampleEnglish: 'My dog is very good.',
    },
    {
      hanzi: '东西', pinyin: 'dōngxi', meaning: 'thing; stuff', category: 'noun',
      example: '我的东西在桌子上面。', examplePinyin: 'wǒ de dōngxi zài zhuōzi shàngmiàn.', exampleEnglish: 'My things are on the table.',
    },
  ],

  // =======================================================================
  // Stage 9 — Likes & abilities: 爱/喜欢, 会/能, people words
  // =======================================================================
  [
    {
      hanzi: '爱', pinyin: 'ài', meaning: 'to love', category: 'verb',
      example: '我爱汉语。', examplePinyin: 'wǒ ài hànyǔ.', exampleEnglish: 'I love Chinese.',
    },
    {
      hanzi: '喜欢', pinyin: 'xǐhuan', meaning: 'to like', category: 'verb',
      example: '我喜欢猫。', examplePinyin: 'wǒ xǐhuan māo.', exampleEnglish: 'I like cats.',
    },
    {
      hanzi: '高兴', pinyin: 'gāoxìng', meaning: 'happy; glad', category: 'adjective',
      example: '我很高兴。', examplePinyin: 'wǒ hěn gāoxìng.', exampleEnglish: 'I am very happy.',
    },
    {
      hanzi: '漂亮', pinyin: 'piàoliang', meaning: 'beautiful; pretty', category: 'adjective',
      example: '玛丽很漂亮。', examplePinyin: 'Mǎlì hěn piàoliang.', exampleEnglish: 'Mary is very pretty.',
    },
    {
      hanzi: '会', pinyin: 'huì', meaning: 'can (learned skill)', category: 'verb',
      example: '我会说汉语。', examplePinyin: 'wǒ huì shuō hànyǔ.', exampleEnglish: 'I can speak Chinese.',
    },
    {
      hanzi: '能', pinyin: 'néng', meaning: 'can; to be able to', category: 'verb',
      example: '我能吃这个苹果吗？', examplePinyin: 'wǒ néng chī zhè gè píngguǒ ma?', exampleEnglish: 'May I eat this apple?',
    },
    {
      hanzi: '和', pinyin: 'hé', meaning: 'and; with', category: 'other',
      example: '我和我的妈妈在家。', examplePinyin: 'wǒ hé wǒ de māma zài jiā.', exampleEnglish: 'My mum and I are at home.',
    },
    {
      hanzi: '同学', pinyin: 'tóngxué', meaning: 'classmate', category: 'noun',
      example: '他是我的同学。', examplePinyin: 'tā shì wǒ de tóngxué.', exampleEnglish: 'He is my classmate.',
    },
    {
      hanzi: '朋友', pinyin: 'péngyou', meaning: 'friend', category: 'noun',
      example: '我有很多朋友。', examplePinyin: 'wǒ yǒu hěn duō péngyou.', exampleEnglish: 'I have many friends.',
    },
    {
      hanzi: '医生', pinyin: 'yīshēng', meaning: 'doctor', category: 'noun',
      example: '王医生是好人。', examplePinyin: 'Wáng yīshēng shì hǎo rén.', exampleEnglish: 'Dr. Wang is a good person.',
    },
    {
      hanzi: '人', pinyin: 'rén', meaning: 'person; people', category: 'noun',
      example: '商店里有很多人。', examplePinyin: 'shāngdiàn lǐ yǒu hěn duō rén.', exampleEnglish: 'There are many people in the shop.',
    },
    {
      hanzi: '衣服', pinyin: 'yīfu', meaning: 'clothes', category: 'noun',
      example: '我的衣服很漂亮。', examplePinyin: 'wǒ de yīfu hěn piàoliang.', exampleEnglish: 'My clothes are very pretty.',
    },
    {
      hanzi: '睡觉', pinyin: 'shuìjiào', meaning: 'to sleep', category: 'verb',
      example: '我十点睡觉。', examplePinyin: 'wǒ shí diǎn shuìjiào.', exampleEnglish: 'I go to sleep at ten.',
    },
    {
      hanzi: '认识', pinyin: 'rènshi', meaning: 'to know (a person); to recognise', category: 'verb',
      example: '我很高兴认识你。', examplePinyin: 'wǒ hěn gāoxìng rènshi nǐ.', exampleEnglish: 'I am glad to meet you.',
    },
    {
      hanzi: '没有', pinyin: 'méiyǒu', meaning: 'to not have', category: 'verb',
      example: '我没有猫。', examplePinyin: 'wǒ méiyǒu māo.', exampleEnglish: 'I do not have a cat.',
    },
  ],

  // =======================================================================
  // Stage 10 — Real life: politeness, shopping, 了, question words
  // =======================================================================
  [
    {
      hanzi: '请', pinyin: 'qǐng', meaning: 'please (to invite)', category: 'verb',
      example: '请坐。', examplePinyin: 'qǐng zuò.', exampleEnglish: 'Please sit down.',
    },
    {
      hanzi: '对不起', pinyin: 'duìbuqǐ', meaning: 'sorry; excuse me', category: 'other',
      example: '对不起，我不是老师。', examplePinyin: 'duìbuqǐ, wǒ bú shì lǎoshī.', exampleEnglish: 'Sorry, I am not the teacher.',
    },
    {
      hanzi: '没关系', pinyin: 'méi guānxi', meaning: 'it does not matter; never mind', category: 'other',
      example: '——对不起。 ——没关系！', examplePinyin: '——duìbuqǐ. ——méi guānxi!', exampleEnglish: '—Sorry. —Never mind!',
    },
    {
      hanzi: '太', pinyin: 'tài', meaning: 'too; very', category: 'adverb',
      example: '太好了！', examplePinyin: 'tài hǎo le!', exampleEnglish: 'Wonderful! (too good!)',
    },
    {
      hanzi: '喂', pinyin: 'wèi', meaning: 'hello (on the phone)', category: 'other',
      example: '喂，你是谁？', examplePinyin: 'wèi, nǐ shì shéi?', exampleEnglish: 'Hello, who is this?',
    },
    {
      hanzi: '电视', pinyin: 'diànshì', meaning: 'TV', category: 'noun',
      example: '我看电视。', examplePinyin: 'wǒ kàn diànshì.', exampleEnglish: 'I watch TV.',
    },
    {
      hanzi: '电影', pinyin: 'diànyǐng', meaning: 'movie; film', category: 'noun',
      example: '我喜欢看电影。', examplePinyin: 'wǒ xǐhuan kàn diànyǐng.', exampleEnglish: 'I like watching movies.',
    },
    {
      hanzi: '钱', pinyin: 'qián', meaning: 'money', category: 'noun',
      example: '我没有钱。', examplePinyin: 'wǒ méiyǒu qián.', exampleEnglish: 'I have no money.',
    },
    {
      hanzi: '几', pinyin: 'jǐ', meaning: 'how many (small numbers)', category: 'number',
      example: '你几岁？', examplePinyin: 'nǐ jǐ suì?', exampleEnglish: 'How old are you?',
    },
    {
      hanzi: '多少', pinyin: 'duōshao', meaning: 'how many; how much', category: 'number',
      example: '这个多少钱？', examplePinyin: 'zhè gè duōshao qián?', exampleEnglish: 'How much is this?',
    },
    {
      hanzi: '怎么', pinyin: 'zěnme', meaning: 'how; in what way', category: 'pronoun',
      example: '这个字怎么读？', examplePinyin: 'zhè gè zì zěnme dú?', exampleEnglish: 'How do you read this character?',
    },
    {
      hanzi: '怎么样', pinyin: 'zěnmeyàng', meaning: 'how is it?; how about', category: 'pronoun',
      example: '今天天气怎么样？', examplePinyin: 'jīntiān tiānqì zěnmeyàng?', exampleEnglish: 'How is the weather today?',
    },
    {
      hanzi: '些', pinyin: 'xiē', meaning: 'some (with numbers/demonstratives)', category: 'measure',
      example: '我买一些苹果。', examplePinyin: 'wǒ mǎi yìxiē píngguǒ.', exampleEnglish: 'I buy some apples.',
    },
    {
      hanzi: '块', pinyin: 'kuài', meaning: 'yuan (unit of money); piece', category: 'measure',
      example: '一个苹果五块。', examplePinyin: 'yí gè píngguǒ wǔ kuài.', exampleEnglish: 'An apple is five yuan.',
    },
    {
      hanzi: '了', pinyin: 'le', meaning: 'particle: done / new situation', category: 'particle',
      example: '我买了一本书。', examplePinyin: 'wǒ mǎi le yì běn shū.', exampleEnglish: 'I bought a book.',
    },
  ],
]

/** Flat, ordered list of every taught word (stage order preserved) */
export const ALL_WORDS: Array<HskWord & { stage: number }> = STAGE_WORDS.flatMap((words, i) =>
  words.map((w) => ({ ...w, stage: i + 1 }))
)
