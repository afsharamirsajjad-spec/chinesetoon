// ---------------------------------------------------------------------------
// 📖 HSK 1 reading curriculum — two passages per stage (a dialogue + a short
// text). Every line carries hanzi, tone-marked pinyin and English. Passages
// use ONLY characters from words taught in the same or earlier stages (plus
// the textbook-standard names 玛丽/大卫/小明/王/李) — enforced by a unit test.
//
// Comprehension questions live in the SERVER-ONLY exercises.ts (the correct
// option is always authored first and the exercise builder shuffles options
// deterministically). This file is CLIENT-SAFE: passage text and notes only.
// ---------------------------------------------------------------------------

import type { ReadingPassage } from './types'

export const STAGE_READINGS: ReadingPassage[][] = [
  // ===== Stage 1 =====
  [
    {
      id: 'r1-1',
      title: '你好！',
      form: 'dialogue',
      lines: [
        { hanzi: '你好！', pinyin: 'Nǐ hǎo!', english: 'Hello!' },
        { hanzi: '你好！我叫玛丽。你叫什么名字？', pinyin: 'Nǐ hǎo! Wǒ jiào Mǎlì. Nǐ jiào shénme míngzi?', english: 'Hello! My name is Mary. What is your name?' },
        { hanzi: '我叫小明。', pinyin: 'Wǒ jiào Xiǎomíng.', english: 'My name is Xiaoming.' },
        { hanzi: '你好吗？', pinyin: 'Nǐ hǎo ma?', english: 'How are you?' },
        { hanzi: '我很好，谢谢。你呢？', pinyin: 'Wǒ hěn hǎo, xièxie. Nǐ ne?', english: 'I am fine, thanks. And you?' },
        { hanzi: '我很好。', pinyin: 'Wǒ hěn hǎo.', english: 'I am fine too.' },
        { hanzi: '再见，小明！', pinyin: 'Zàijiàn, Xiǎomíng!', english: 'Goodbye, Xiaoming!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '你好', meaning: 'hello — the most common greeting' },
        { word: '你叫什么名字？', meaning: 'What is your name?' },
        { word: '你呢？', meaning: 'And you? (asks the same question back)' },
      ]
    },
    {
      id: 'r1-2',
      title: '我的名字',
      form: 'text',
      lines: [
        { hanzi: '你好！我叫大卫。', pinyin: 'Nǐ hǎo! Wǒ jiào Dàwèi.', english: 'Hello! My name is David.' },
        { hanzi: '我的名字是大卫。', pinyin: 'Wǒ de míngzi shì Dàwèi.', english: 'My name is David.' },
        { hanzi: '我的名字很好。', pinyin: 'Wǒ de míngzi hěn hǎo.', english: 'My name is very nice.' },
        { hanzi: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', english: 'What is your name?' },
        { hanzi: '你的名字很好吗？', pinyin: 'Nǐ de míngzi hěn hǎo ma?', english: 'Is your name nice too?' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '我的名字', meaning: 'my name (的 = possessive)' },
        { word: '很好', meaning: 'very good' },
      ]
    },
  ],

  // ===== Stage 2 =====
  [
    {
      id: 'r2-1',
      title: '王老师和学生',
      form: 'dialogue',
      lines: [
        { hanzi: '王老师，你好！', pinyin: 'Wáng lǎoshī, nǐ hǎo!', english: 'Hello, Mr. Wang!' },
        { hanzi: '玛丽，你好！', pinyin: 'Mǎlì, nǐ hǎo!', english: 'Hello, Mary!' },
        { hanzi: '她是谁？', pinyin: 'Tā shì shéi?', english: 'Who is she?' },
        { hanzi: '她是我的女儿。', pinyin: 'Tā shì wǒ de nǚ’ér.', english: 'She is my daughter.' },
        { hanzi: '她是学生吗？', pinyin: 'Tā shì xuésheng ma?', english: 'Is she a student?' },
        { hanzi: '是，她是学生。', pinyin: 'Shì, tā shì xuésheng.', english: 'Yes, she is a student.' },
        { hanzi: '你好吗，王老师？', pinyin: 'Nǐ hǎo ma, Wáng lǎoshī?', english: 'How are you, Mr. Wang?' },
        { hanzi: '我很好，谢谢。', pinyin: 'Wǒ hěn hǎo, xièxie.', english: 'I am fine, thanks.' },
        { hanzi: '再见，王老师！', pinyin: 'Zàijiàn, Wáng lǎoshī!', english: 'Goodbye, Mr. Wang!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '她是谁？', meaning: 'Who is she?' },
        { word: '我的女儿', meaning: 'my daughter' },
        { word: '学生', meaning: 'student' },
      ]
    },
    {
      id: 'r2-2',
      title: '这是我的爸爸',
      form: 'text',
      lines: [
        { hanzi: '你好！我叫大卫。', pinyin: 'Nǐ hǎo! Wǒ jiào Dàwèi.', english: 'Hello! My name is David.' },
        { hanzi: '这是我的爸爸，他是老师。', pinyin: 'Zhè shì wǒ de bàba, tā shì lǎoshī.', english: 'This is my dad; he is a teacher.' },
        { hanzi: '这是我的妈妈，她不是老师，她是学生。', pinyin: 'Zhè shì wǒ de māma, tā bú shì lǎoshī, tā shì xuésheng.', english: 'This is my mum; she is not a teacher, she is a student.' },
        { hanzi: '我的爸爸很好，我的妈妈很好，我都很好！', pinyin: 'Wǒ de bàba hěn hǎo, wǒ de māma hěn hǎo, wǒ dōu hěn hǎo!', english: 'My dad is fine, my mum is fine, we are all fine!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '这是……', meaning: 'This is …' },
        { word: '不是', meaning: 'is not' },
        { word: '都', meaning: 'all / both' },
      ]
    },
  ],

  // ===== Stage 3 =====
  [
    {
      id: 'r3-1',
      title: '你几岁？',
      form: 'dialogue',
      lines: [
        { hanzi: '你好，小明！', pinyin: 'Nǐ hǎo, Xiǎomíng!', english: 'Hello, Xiaoming!' },
        { hanzi: '你好，玛丽！', pinyin: 'Nǐ hǎo, Mǎlì!', english: 'Hello, Mary!' },
        { hanzi: '你二十岁吗？', pinyin: 'Nǐ èrshí suì ma?', english: 'Are you twenty years old?' },
        { hanzi: '不，我十九岁。你呢？', pinyin: 'Bù, wǒ shíjiǔ suì. Nǐ ne?', english: 'No, I am nineteen. And you?' },
        { hanzi: '我二十岁。我的儿子五岁，我的女儿三岁。', pinyin: 'Wǒ èrshí suì. Wǒ de érzi wǔ suì, wǒ de nǚ’ér sān suì.', english: 'I am twenty. My son is five, my daughter is three.' },
        { hanzi: '你的儿子是学生吗？', pinyin: 'Nǐ de érzi shì xuésheng ma?', english: 'Is your son a student?' },
        { hanzi: '我的儿子不是学生。我的女儿是学生。', pinyin: 'Wǒ de érzi bú shì xuésheng. Wǒ de nǚ’ér shì xuésheng.', english: 'My son is not a student. My daughter is a student.' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '岁', meaning: 'years old — 我二十岁 = I am 20' },
        { word: '十九岁', meaning: 'nineteen years old (10 + 9)' },
      ]
    },
    {
      id: 'r3-2',
      title: '我的家人',
      form: 'text',
      lines: [
        { hanzi: '你好！我是小明。我二十岁。', pinyin: 'Nǐ hǎo! Wǒ shì Xiǎomíng. Wǒ èrshí suì.', english: 'Hello! I am Xiaoming. I am twenty years old.' },
        { hanzi: '我的爸爸五十岁，我的妈妈四十八岁。', pinyin: 'Wǒ de bàba wǔshí suì, wǒ de māma sìshíbā suì.', english: 'My dad is fifty, my mum is forty-eight.' },
        { hanzi: '我的女儿五岁，我的儿子三岁。', pinyin: 'Wǒ de nǚ’ér wǔ suì, wǒ de érzi sān suì.', english: 'My daughter is five, my son is three.' },
        { hanzi: '我的号是八月八号。', pinyin: 'Wǒ de hào shì bā yuè bā hào.', english: 'My date (of birth) is August 8th.' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '五十岁', meaning: 'fifty years old (5 + 10)' },
        { word: '八月八号', meaning: 'August 8th' },
      ]
    },
  ],

  // ===== Stage 4 =====
  [
    {
      id: 'r4-1',
      title: '现在十点',
      form: 'dialogue',
      lines: [
        { hanzi: '你好！现在十点。你去学校吗？', pinyin: 'Nǐ hǎo! Xiànzài shí diǎn. Nǐ qù xuéxiào ma?', english: 'Hello! It is ten o’clock now. Are you going to school?' },
        { hanzi: '是，我去学校。', pinyin: 'Shì, wǒ qù xuéxiào.', english: 'Yes, I am going to school.' },
        { hanzi: '你的儿子呢？他什么时候去学校？', pinyin: 'Nǐ de érzi ne? Tā shénme shíhou qù xuéxiào?', english: 'And your son? When does he go to school?' },
        { hanzi: '他上午在家，下午去学校。', pinyin: 'Tā shàngwǔ zài jiā, xiàwǔ qù xuéxiào.', english: 'He is at home in the morning; he goes to school in the afternoon.' },
        { hanzi: '你的女儿呢？', pinyin: 'Nǐ de nǚ’ér ne?', english: 'And your daughter?' },
        { hanzi: '她下午去学校。我们下午都去学校。', pinyin: 'Tā xiàwǔ qù xuéxiào. Wǒmen xiàwǔ dōu qù xuéxiào.', english: 'She goes to school in the afternoon. We all go to school in the afternoon.' },
        { hanzi: '好，再见！', pinyin: 'Hǎo, zàijiàn!', english: 'OK, goodbye!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '什么时候', meaning: 'when (what time)' },
        { word: '在家', meaning: 'to be at home' },
      ]
    },
    {
      id: 'r4-2',
      title: '玛丽的一周',
      form: 'text',
      lines: [
        { hanzi: '我是玛丽。今天星期一，现在八点。', pinyin: 'Wǒ shì Mǎlì. Jīntiān xīngqīyī, xiànzài bā diǎn.', english: 'I am Mary. Today is Monday; it is eight o’clock now.' },
        { hanzi: '上午我在家，下午我去学校。', pinyin: 'Shàngwǔ wǒ zài jiā, xiàwǔ wǒ qù xuéxiào.', english: 'In the morning I am at home; in the afternoon I go to school.' },
        { hanzi: '星期一、星期二、星期三、星期四、星期五我都去学校。', pinyin: 'Xīngqīyī, xīngqī’èr, xīngqīsān, xīngqīsì, xīngqīwǔ wǒ dōu qù xuéxiào.', english: 'From Monday to Friday I go to school every day.' },
        { hanzi: '星期六我不去学校，我在家。', pinyin: 'Xīngqīliù wǒ bú qù xuéxiào, wǒ zài jiā.', english: 'On Saturday I do not go to school; I am at home.' },
        { hanzi: '明天我十点去学校。再见！', pinyin: 'Míngtiān wǒ shí diǎn qù xuéxiào. Zàijiàn!', english: 'Tomorrow I go to school at ten. Goodbye!' },
      ],
      notes: [
        { word: '星期一……星期五', meaning: 'Monday … Friday' },
        { word: '我在家', meaning: 'I am at home' },
      ]
    },
  ],

  // ===== Stage 5 =====
  [
    {
      id: 'r5-1',
      title: '学校在哪儿？',
      form: 'dialogue',
      lines: [
        { hanzi: '你的学校在哪儿？', pinyin: 'Nǐ de xuéxiào zài nǎr?', english: 'Where is your school?' },
        { hanzi: '我的学校在北京。', pinyin: 'Wǒ de xuéxiào zài Běijīng.', english: 'My school is in Beijing.' },
        { hanzi: '饭店在哪儿？', pinyin: 'Fàndiàn zài nǎr?', english: 'Where is the restaurant?' },
        { hanzi: '饭店在学校前面。', pinyin: 'Fàndiàn zài xuéxiào qiánmiàn.', english: 'The restaurant is in front of the school.' },
        { hanzi: '商店呢？', pinyin: 'Shāngdiàn ne?', english: 'And the shop?' },
        { hanzi: '商店在学校后面。医院在饭店后面。', pinyin: 'Shāngdiàn zài xuéxiào hòumiàn. Yīyuàn zài fàndiàn hòumiàn.', english: 'The shop is behind the school. The hospital is behind the restaurant.' },
        { hanzi: '我的杯子在哪儿？', pinyin: 'Wǒ de bēizi zài nǎr?', english: 'Where is my cup?' },
        { hanzi: '你的杯子在桌子上！', pinyin: 'Nǐ de bēizi zài zhuōzi shàng!', english: 'Your cup is on the table!' },
        { hanzi: '谢谢！', pinyin: 'Xièxie!', english: 'Thanks!' },
      ],
      notes: [
        { word: '在哪儿', meaning: 'where is…?' },
        { word: '前面 / 后面', meaning: 'in front of / behind' },
        { word: '桌子上', meaning: 'on the table' },
      ]
    },
    {
      id: 'r5-2',
      title: '我的家',
      form: 'text',
      lines: [
        { hanzi: '我的家在中国，在北京。', pinyin: 'Wǒ de jiā zài Zhōngguó, zài Běijīng.', english: 'My home is in China, in Beijing.' },
        { hanzi: '我的学校在商店前面，饭店在学校后面，医院在学校前面。', pinyin: 'Wǒ de xuéxiào zài shāngdiàn qiánmiàn, fàndiàn zài xuéxiào hòumiàn, yīyuàn zài xuéxiào qiánmiàn.', english: 'My school is in front of the shop, the restaurant is behind the school, the hospital is in front of the school.' },
        { hanzi: '我的杯子在桌子上，水在杯子里。', pinyin: 'Wǒ de bēizi zài zhuōzi shàng, shuǐ zài bēizi lǐ.', english: 'My cup is on the table; the water is in the cup.' },
        { hanzi: '我的学校很好。再见！', pinyin: 'Wǒ de xuéxiào hěn hǎo. Zàijiàn!', english: 'My school is very good. Goodbye!' },
      ],
      notes: [
        { word: '在中国', meaning: 'in China' },
        { word: '杯子里', meaning: 'in the cup' },
      ]
    },
  ],

  // ===== Stage 6 =====
  [
    {
      id: 'r6-1',
      title: '你想吃什么？',
      form: 'dialogue',
      lines: [
        { hanzi: '你好！你想吃什么？', pinyin: 'Nǐ hǎo! Nǐ xiǎng chī shénme?', english: 'Hello! What would you like to eat?' },
        { hanzi: '我想吃米饭。', pinyin: 'Wǒ xiǎng chī mǐfàn.', english: 'I would like to eat rice.' },
        { hanzi: '你想喝什么？', pinyin: 'Nǐ xiǎng hē shénme?', english: 'What would you like to drink?' },
        { hanzi: '我喝一杯茶。', pinyin: 'Wǒ hē yì bēi chá.', english: 'I will have a cup of tea.' },
        { hanzi: '好。你想吃苹果吗？', pinyin: 'Hǎo. Nǐ xiǎng chī píngguǒ ma?', english: 'OK. Would you like an apple?' },
        { hanzi: '想！苹果很好吃。', pinyin: 'Xiǎng! Píngguǒ hěn hǎochī.', english: 'Yes! Apples are very tasty.' },
        { hanzi: '这是你的米饭。这是你的茶。', pinyin: 'Zhè shì nǐ de mǐfàn. Zhè shì nǐ de chá.', english: 'Here is your rice. Here is your tea.' },
        { hanzi: '谢谢！', pinyin: 'Xièxie!', english: 'Thank you!' },
      ],
      notes: [
        { word: '你想吃什么？', meaning: 'What do you want to eat?' },
        { word: '一杯茶', meaning: 'a cup of tea (一杯 = one cup of)' },
      ]
    },
    {
      id: 'r6-2',
      title: '我去北京',
      form: 'text',
      lines: [
        { hanzi: '我是玛丽。我坐飞机去北京。', pinyin: 'Wǒ shì Mǎlì. Wǒ zuò fēijī qù Běijīng.', english: 'I am Mary. I go to Beijing by plane.' },
        { hanzi: '在北京我想吃米饭，喝一点儿茶。', pinyin: 'Zài Běijīng wǒ xiǎng chī mǐfàn, hē yìdiǎnr chá.', english: 'In Beijing I want to eat rice and drink a little tea.' },
        { hanzi: '苹果很好吃，我买一点儿水果。', pinyin: 'Píngguǒ hěn hǎochī, wǒ mǎi yìdiǎnr shuǐguǒ.', english: 'Apples are very tasty; I buy a little fruit.' },
        { hanzi: '现在我在饭店。我很好！', pinyin: 'Xiànzài wǒ zài fàndiàn. Wǒ hěn hǎo!', english: 'Now I am at the restaurant. I am very well!' },
      ],
      notes: [
        { word: '坐飞机', meaning: 'to go by plane (坐 = to travel by)' },
        { word: '一点儿', meaning: 'a little bit' },
      ]
    },
  ],

  // ===== Stage 7 =====
  [
    {
      id: 'r7-1',
      title: '你做什么工作？',
      form: 'dialogue',
      lines: [
        { hanzi: '你好！你做什么工作？', pinyin: 'Nǐ hǎo! Nǐ zuò shénme gōngzuò?', english: 'Hello! What work do you do?' },
        { hanzi: '我是老师。我在学校工作。', pinyin: 'Wǒ shì lǎoshī. Wǒ zài xuéxiào gōngzuò.', english: 'I am a teacher. I work at a school.' },
        { hanzi: '你学习什么？', pinyin: 'Nǐ xuéxí shénme?', english: 'What do you study?' },
        { hanzi: '我学习汉语。', pinyin: 'Wǒ xuéxí hànyǔ.', english: 'I study Chinese.' },
        { hanzi: '你读什么书？', pinyin: 'Nǐ dú shénme shū?', english: 'What books do you read?' },
        { hanzi: '我读汉语书。', pinyin: 'Wǒ dú hànyǔ shū.', english: 'I read Chinese books.' },
        { hanzi: '我看见你的汉语书。很好！', pinyin: 'Wǒ kànjiàn nǐ de hànyǔ shū. Hěn hǎo!', english: 'I can see your Chinese book. Very nice!' },
        { hanzi: '谢谢！', pinyin: 'Xièxie!', english: 'Thank you!' },
      ],
      notes: [
        { word: '做什么工作', meaning: 'do what job' },
        { word: '看见', meaning: 'to see (successfully)' },
      ]
    },
    {
      id: 'r7-2',
      title: '我的一天',
      form: 'text',
      lines: [
        { hanzi: '我叫小明，我二十岁。我是学生，我学习汉语。', pinyin: 'Wǒ jiào Xiǎomíng, wǒ èrshí suì. Wǒ shì xuésheng, wǒ xuéxí hànyǔ.', english: 'My name is Xiaoming, I am twenty. I am a student and I study Chinese.' },
        { hanzi: '上午我读汉语书，写汉字。', pinyin: 'Shàngwǔ wǒ dú hànyǔ shū, xiě hànzì.', english: 'In the morning I read Chinese books and write characters.' },
        { hanzi: '下午我看书，听汉语。', pinyin: 'Xiàwǔ wǒ kàn shū, tīng hànyǔ.', english: 'In the afternoon I read and listen to Chinese.' },
        { hanzi: '下午四点我打电话。', pinyin: 'Xiàwǔ sì diǎn wǒ dǎ diànhuà.', english: 'At four in the afternoon I make a phone call.' },
        { hanzi: '我的电脑在桌子上，我的汉语书很好。再见！', pinyin: 'Wǒ de diànnǎo zài zhuōzi shàng, wǒ de hànyǔ shū hěn hǎo. Zàijiàn!', english: 'My computer is on the table, and my Chinese book is very good. Goodbye!' },
      ],
      notes: [
        { word: '写汉字', meaning: 'to write Chinese characters' },
        { word: '打电话', meaning: 'to make a phone call' },
      ]
    },
  ],

  // ===== Stage 8 =====
  [
    {
      id: 'r8-1',
      title: '北京天气好吗？',
      form: 'dialogue',
      lines: [
        { hanzi: '北京天气好吗？', pinyin: 'Běijīng tiānqì hǎo ma?', english: 'Is the weather in Beijing good?' },
        { hanzi: '北京天气很好。今天很热。', pinyin: 'Běijīng tiānqì hěn hǎo. Jīntiān hěn rè.', english: 'The weather in Beijing is very good. Today it is hot.' },
        { hanzi: '明天下雨吗？', pinyin: 'Míngtiān xiàyǔ ma?', english: 'Will it rain tomorrow?' },
        { hanzi: '是，明天下雨。', pinyin: 'Shì, míngtiān xiàyǔ.', english: 'Yes, it will rain tomorrow.' },
        { hanzi: '你坐出租车回家吗？', pinyin: 'Nǐ zuò chūzūchē huí jiā ma?', english: 'Are you going home by taxi?' },
        { hanzi: '好，我坐出租车回家。再见！', pinyin: 'Hǎo, wǒ zuò chūzūchē huí jiā. Zàijiàn!', english: 'OK, I will go home by taxi. Goodbye!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '天气', meaning: 'weather' },
        { word: '回家', meaning: 'to go home' },
      ]
    },
    {
      id: 'r8-2',
      title: '我的猫',
      form: 'text',
      lines: [
        { hanzi: '我住在北京。我的学校很大，我的家很小。', pinyin: 'Wǒ zhù zài Běijīng. Wǒ de xuéxiào hěn dà, wǒ de jiā hěn xiǎo.', english: 'I live in Beijing. My school is very big and my home is very small.' },
        { hanzi: '我的家里有一个猫，我的猫很小。', pinyin: 'Wǒ de jiā lǐ yǒu yí gè māo, wǒ de māo hěn xiǎo.', english: 'There is a cat in my home; my cat is very small.' },
        { hanzi: '今天天气很冷，下大雨。', pinyin: 'Jīntiān tiānqì hěn lěng, xià dàyǔ.', english: 'Today the weather is very cold and it is raining hard.' },
        { hanzi: '我的猫在桌子下面。桌子上有很多东西。', pinyin: 'Wǒ de māo zài zhuōzi xiàmiàn. Zhuōzi shàng yǒu hěn duō dōngxi.', english: 'My cat is under the table. There are many things on the table.' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '住在', meaning: 'to live at/in' },
        { word: '桌子下面', meaning: 'under the table' },
      ]
    },
  ],

  // ===== Stage 9 =====
  [
    {
      id: 'r9-1',
      title: '很高兴认识你！',
      form: 'dialogue',
      lines: [
        { hanzi: '你好！我们认识吗？', pinyin: 'Nǐ hǎo! Wǒmen rènshi ma?', english: 'Hello! Do we know each other?' },
        { hanzi: '不认识。你是谁？', pinyin: 'Bú rènshi. Nǐ shì shéi?', english: 'No, we don’t. Who are you?' },
        { hanzi: '我是玛丽，王老师的同学。', pinyin: 'Wǒ shì Mǎlì, Wáng lǎoshī de tóngxué.', english: 'I am Mary, Mr. Wang’s classmate.' },
        { hanzi: '你好，玛丽！很高兴认识你！', pinyin: 'Nǐ hǎo, Mǎlì! Hěn gāoxìng rènshi nǐ!', english: 'Hello, Mary! Very glad to meet you!' },
        { hanzi: '你会说汉语吗？', pinyin: 'Nǐ huì shuō hànyǔ ma?', english: 'Can you speak Chinese?' },
        { hanzi: '会，我会说一点儿汉语。我能坐这儿吗？', pinyin: 'Huì, wǒ huì shuō yìdiǎnr hànyǔ. Wǒ néng zuò zhèr ma?', english: 'Yes, I can speak a little Chinese. May I sit here?' },
        { hanzi: '能！', pinyin: 'Néng!', english: 'Yes, you may!' },
      ],
      notes: [
        { word: '认识', meaning: 'to know (a person)' },
        { word: '很高兴认识你', meaning: 'Nice to meet you' },
        { word: '会 / 能', meaning: 'can (learned skill) / may (permission)' },
      ]
    },
    {
      id: 'r9-2',
      title: '我喜欢汉语',
      form: 'text',
      lines: [
        { hanzi: '我是小明的朋友。我很喜欢汉语。', pinyin: 'Wǒ shì Xiǎomíng de péngyou. Wǒ hěn xǐhuan hànyǔ.', english: 'I am Xiaoming’s friend. I really like Chinese.' },
        { hanzi: '我会说一点儿汉语，我会写一点儿汉字。', pinyin: 'Wǒ huì shuō yìdiǎnr hànyǔ, wǒ huì xiě yìdiǎnr hànzì.', english: 'I can speak a little Chinese and write a little.' },
        { hanzi: '我没有电脑，我的同学有电脑。', pinyin: 'Wǒ méiyǒu diànnǎo, wǒ de tóngxué yǒu diànnǎo.', english: 'I do not have a computer; my classmate has one.' },
        { hanzi: '我喜欢看汉语书。', pinyin: 'Wǒ xǐhuan kàn hànyǔ shū.', english: 'I like reading Chinese books.' },
        { hanzi: '汉语很好，我很高兴。再见！', pinyin: 'Hànyǔ hěn hǎo, wǒ hěn gāoxìng. Zàijiàn!', english: 'Chinese is great and I am happy. Goodbye!' },
      ],
      notes: [
        { word: '喜欢', meaning: 'to like' },
        { word: '没有', meaning: 'to not have' },
      ]
    },
  ],

  // ===== Stage 10 =====
  [
    {
      id: 'r10-1',
      title: '苹果多少钱？',
      form: 'dialogue',
      lines: [
        { hanzi: '你好！', pinyin: 'Nǐ hǎo!', english: 'Hello!' },
        { hanzi: '你好！苹果多少钱？', pinyin: 'Nǐ hǎo! Píngguǒ duōshao qián?', english: 'Hello! How much are the apples?' },
        { hanzi: '一个苹果五块。', pinyin: 'Yí gè píngguǒ wǔ kuài.', english: 'Five yuan for one apple.' },
        { hanzi: '太好了！我买一些苹果。', pinyin: 'Tài hǎo le! Wǒ mǎi yìxiē píngguǒ.', english: 'Great! I’ll buy some apples.' },
        { hanzi: '好，这是你的苹果。', pinyin: 'Hǎo, zhè shì nǐ de píngguǒ.', english: 'OK, here are your apples.' },
        { hanzi: '谢谢！', pinyin: 'Xièxie!', english: 'Thank you!' },
        { hanzi: '不客气！再见！', pinyin: 'Bú kèqi! Zàijiàn!', english: 'You’re welcome! Goodbye!' },
      ],
      notes: [
        { word: '多少钱', meaning: 'how much (money)' },
        { word: '五块', meaning: 'five yuan' },
      ]
    },
    {
      id: 'r10-2',
      title: '喂？',
      form: 'dialogue',
      lines: [
        { hanzi: '喂？', pinyin: 'Wèi?', english: 'Hello? (on the phone)' },
        { hanzi: '喂，你好！我是玛丽。', pinyin: 'Wèi, nǐ hǎo! Wǒ shì Mǎlì.', english: 'Hello! This is Mary.' },
        { hanzi: '你好，玛丽！你现在做什么？', pinyin: 'Nǐ hǎo, Mǎlì! Nǐ xiànzài zuò shénme?', english: 'Hello, Mary! What are you doing now?' },
        { hanzi: '我看电视。你呢？', pinyin: 'Wǒ kàn diànshì. Nǐ ne?', english: 'I am watching TV. And you?' },
        { hanzi: '我在家看电视。', pinyin: 'Wǒ zài jiā kàn diànshì.', english: 'I am watching TV at home.' },
        { hanzi: '我们去看电影，好吗？', pinyin: 'Wǒmen qù kàn diànyǐng, hǎo ma?', english: 'Shall we go and see a movie?' },
        { hanzi: '太好了！什么时候？', pinyin: 'Tài hǎo le! Shénme shíhou?', english: 'Great! When?' },
        { hanzi: '明天下午。', pinyin: 'Míngtiān xiàwǔ.', english: 'Tomorrow afternoon.' },
        { hanzi: '好，再见！', pinyin: 'Hǎo, zàijiàn!', english: 'OK, goodbye!' },
        { hanzi: '再见！', pinyin: 'Zàijiàn!', english: 'Goodbye!' },
      ],
      notes: [
        { word: '喂', meaning: 'hello (answering the phone)' },
        { word: '看电影', meaning: 'to watch a movie' },
        { word: '好吗？', meaning: 'OK? / shall we?' },
      ]
    },
  ],
]
