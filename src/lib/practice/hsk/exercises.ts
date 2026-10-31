// ---------------------------------------------------------------------------
// 🔒 HSK 1 authored exercises — SERVER-ONLY
//
// This file holds every hand-authored question (grammar + reading). It is
// imported ONLY by server code (the exercise builder and the API route).
// It must NEVER be imported by a client component, or the answer keys would
// ship in the JS bundle — the same trust model as /api/exams.
//
// Authoring convention (the answer key is DERIVED from it by the builder):
//   • mcq / fill / truefalse — the CORRECT option is always options[0]; the
//     builder shuffles options deterministically (seeded by question id) and
//     remembers the shuffled index of the correct one.
//   • match — matchOptions[i] is the correct pairing for matchLeft[i]; the
//     builder shuffles the option pool deterministically and derives the key.
// ---------------------------------------------------------------------------

import type { AuthoredQuestion } from './types'

/** 6 authored grammar exercises per stage (2 per grammar point) */
export const STAGE_GRAMMAR_EXERCISES: AuthoredQuestion[][] = [
  // ===== Stage 1 =====
  [
    { id: 'gx1-1', kind: 'mcq', prompt: 'Which sentence is correct?', options: ['我是学生。', '学生我是。', '我是学生吗没有。'] },
    { id: 'gx1-2', kind: 'fill', prompt: 'Complete the sentence: “Mary is a student.”', hanzi: '玛丽___学生。', pinyin: 'Mǎlì ___ xuésheng.', options: ['是', '不', '吗'] },
    { id: 'gx1-3', kind: 'mcq', prompt: 'How do you ask “Are you a teacher?”', options: ['你是老师吗？', '你老师是？', '是你老师吗？'] },
    { id: 'gx1-4', kind: 'fill', prompt: 'Add the question particle.', hanzi: '你好___？', pinyin: 'Nǐ hǎo ___?', options: ['吗', '呢', '的'] },
    { id: 'gx1-5', kind: 'mcq', prompt: 'Which one means “I am very well”?', options: ['我很好。', '我是很好吗。', '我很是的。'] },
    { id: 'gx1-6', kind: 'fill', prompt: 'Fill in the adverb.', hanzi: '我___好。', pinyin: 'Wǒ ___ hǎo.', options: ['很', '不', '吗'] },
  ],

  // ===== Stage 2 =====
  [
    { id: 'gx2-1', kind: 'mcq', prompt: 'How do you say “my dad”?', options: ['我的爸爸', '我爸爸的', '的我爸爸'] },
    { id: 'gx2-2', kind: 'fill', prompt: 'Complete: “This is my teacher.”', hanzi: '这___我的老师。', pinyin: 'Zhè ___ wǒ de lǎoshī.', options: ['是', '都', '很'] },
    { id: 'gx2-3', kind: 'mcq', prompt: 'Which means “We are all students”?', options: ['我们都是学生。', '我们都学生是。', '我们是都学生。'] },
    { id: 'gx2-4', kind: 'fill', prompt: 'Complete: “This is his son.”', hanzi: '这___他的儿子。', pinyin: 'Zhè ___ tā de érzi.', options: ['是', '在', '吗'] },
    { id: 'gx2-5', kind: 'mcq', prompt: 'Which question asks “Who is he?”', options: ['他是谁？', '谁是他吗？', '他谁？'] },
    { id: 'gx2-6', kind: 'fill', prompt: 'Add the word “all”.', hanzi: '我们___是学生。', pinyin: 'Wǒmen ___ shì xuésheng.', options: ['都', '很', '不'] },
  ],

  // ===== Stage 3 =====
  [
    { id: 'gx3-1', kind: 'mcq', prompt: 'How do you say “three students”?', options: ['三个学生', '三学生个', '学生三个'] },
    { id: 'gx3-2', kind: 'fill', prompt: 'Complete: “I am twenty years old.”', hanzi: '我二十___。', pinyin: 'Wǒ èrshí ___.', options: ['岁', '个', '号'] },
    { id: 'gx3-3', kind: 'mcq', prompt: 'Which one is “January 1st”?', options: ['一月一号', '一号一月', '一月一岁'] },
    { id: 'gx3-4', kind: 'fill', prompt: 'Fill in the date word.', hanzi: '四月四___。', pinyin: 'Sì yuè sì ___.', options: ['号', '个', '点'] },
    { id: 'gx3-5', kind: 'mcq', prompt: 'Which one means “I am twenty years old”?', options: ['我二十岁。', '我岁二十。', '我是二十岁。'] },
    { id: 'gx3-6', kind: 'fill', prompt: 'Complete: “We are five people.”', hanzi: '我们___个人。', pinyin: 'Wǒmen ___ gè rén.', options: ['五', '的', '很'] },
  ],

  // ===== Stage 4 =====
  [
    { id: 'gx4-1', kind: 'mcq', prompt: 'Which sentence means “It is ten o’clock now”?', options: ['现在十点。', '现在点十。', '十现在点。'] },
    { id: 'gx4-2', kind: 'fill', prompt: 'Complete: “I am at school.”', hanzi: '我___学校。', pinyin: 'Wǒ ___ xuéxiào.', options: ['在', '去', '很'] },
    { id: 'gx4-3', kind: 'mcq', prompt: 'Which one says “I go to school on Monday”?', options: ['星期一我去学校。', '星期一学校我去。', '我学校星期一去。'] },
    { id: 'gx4-4', kind: 'fill', prompt: 'Fill in the verb: “When do you ___ school?”', hanzi: '你什么时候___学校？', pinyin: 'Nǐ shénme shíhou ___ xuéxiào?', options: ['去', '在', '是'] },
    { id: 'gx4-5', kind: 'mcq', prompt: 'Which one means “Mum is at home”?', options: ['妈妈在家。', '妈妈去家。', '妈妈很家。'] },
    { id: 'gx4-6', kind: 'fill', prompt: 'Complete the time: “It is ten o’clock now.”', hanzi: '现在___点。', pinyin: 'Xiànzài ___ diǎn.', options: ['十', '是', '吗'] },
  ],

  // ===== Stage 5 =====
  [
    { id: 'gx5-1', kind: 'mcq', prompt: 'Which sentence means “The cup is on the table”?', options: ['杯子在桌子上。', '杯子在上桌子。', '杯子桌子在上。'] },
    { id: 'gx5-2', kind: 'fill', prompt: 'Complete the question: “Where is the school?”', hanzi: '学校在___？', pinyin: 'Xuéxiào zài ___?', options: ['哪儿', '什么', '谁'] },
    { id: 'gx5-3', kind: 'mcq', prompt: 'Which one means “The water is in the cup”?', options: ['水在杯子里。', '水在杯子。', '水杯子在里。'] },
    { id: 'gx5-4', kind: 'fill', prompt: 'Fill in the position word: “The chair is UNDER the table.”', hanzi: '椅子在桌子___。', pinyin: 'Yǐzi zài zhuōzi ___.', options: ['下面', '上面', '前面'] },
    { id: 'gx5-5', kind: 'mcq', prompt: 'How do you ask “Where is your school?”', options: ['你的学校在哪儿？', '你的学校哪儿？', '哪儿你的学校？'] },
    { id: 'gx5-6', kind: 'fill', prompt: 'Complete: “The hospital is BEHIND the school.”', hanzi: '医院___学校后面。', pinyin: 'Yīyuàn ___ xuéxiào hòumiàn.', options: ['在', '是', '很'] },
  ],

  // ===== Stage 6 =====
  [
    { id: 'gx6-1', kind: 'mcq', prompt: 'Which sentence means “I have a son”?', options: ['我有一个儿子。', '我儿子有一个。', '我是有一个儿子。'] },
    { id: 'gx6-2', kind: 'fill', prompt: 'Fill in the verb: “I want to drink water.”', hanzi: '我___喝水。', pinyin: 'Wǒ ___ hē shuǐ.', options: ['想', '很', '有'] },
    { id: 'gx6-3', kind: 'mcq', prompt: 'Which one says “I want to eat an apple”?', options: ['我想吃苹果。', '我想苹果吃。', '我想吃苹果吗。'] },
    { id: 'gx6-4', kind: 'fill', prompt: 'Complete: “I drink a little water.”', hanzi: '我喝___水。', pinyin: 'Wǒ hē ___ shuǐ.', options: ['一点儿', '一本', '一个'] },
    { id: 'gx6-5', kind: 'mcq', prompt: 'Which sentence means “There is water in the cup”?', options: ['杯子里有水。', '杯子里是水。', '杯子有水里。'] },
    { id: 'gx6-6', kind: 'fill', prompt: 'Fill in the verb: “I want to eat rice.”', hanzi: '我想___米饭。', pinyin: 'Wǒ xiǎng ___ mǐfàn.', options: ['吃', '喝', '看'] },
  ],

  // ===== Stage 7 =====
  [
    { id: 'gx7-1', kind: 'mcq', prompt: 'How do you say “three books”?', options: ['三本书', '三个书', '三书个'] },
    { id: 'gx7-2', kind: 'fill', prompt: 'Fill in the verb: “I speak Chinese.”', hanzi: '我___汉语。', pinyin: 'Wǒ ___ hànyǔ.', options: ['说', '看', '写'] },
    { id: 'gx7-3', kind: 'mcq', prompt: 'Which question means “What work do you do?”', options: ['你做什么工作？', '你工作做什么？', '你什么工作？'] },
    { id: 'gx7-4', kind: 'fill', prompt: 'Complete the result: “I see Mary.”', hanzi: '我看___玛丽。', pinyin: 'Wǒ kàn___ Mǎlì.', options: ['见', '书', '字'] },
    { id: 'gx7-5', kind: 'mcq', prompt: 'Which sentence means “I write Chinese characters”?', options: ['我写汉字。', '我汉字写。', '我写说汉字。'] },
    { id: 'gx7-6', kind: 'fill', prompt: 'Fill in the verb: “I buy three books.”', hanzi: '我___三本书。', pinyin: 'Wǒ ___ sān běn shū.', options: ['买', '喝', '读'] },
  ],

  // ===== Stage 8 =====
  [
    { id: 'gx8-1', kind: 'mcq', prompt: 'Which sentence means “My school is very big”?', options: ['我的学校很大。', '我的学校是很大吗。', '我的大学校很。'] },
    { id: 'gx8-2', kind: 'fill', prompt: 'Complete: “Today is very cold.”', hanzi: '今天很___。', pinyin: 'Jīntiān hěn ___.', options: ['冷', '热', '多'] },
    { id: 'gx8-3', kind: 'mcq', prompt: 'Which one means “I go home”?', options: ['我回家。', '我去回家。', '我回家去很。'] },
    { id: 'gx8-4', kind: 'fill', prompt: 'Fill in the noun: “Beijing’s ___ is very good.”', hanzi: '北京___很好。', pinyin: 'Běijīng ___ hěn hǎo.', options: ['天气', '水', '东西'] },
    { id: 'gx8-5', kind: 'mcq', prompt: 'Which sentence means “It is raining today”?', options: ['今天下雨。', '下雨今天。', '今天雨了。'] },
    { id: 'gx8-6', kind: 'fill', prompt: 'Complete: “My cat is very small.”', hanzi: '我的猫很___。', pinyin: 'Wǒ de māo hěn ___.', options: ['小', '大', '少'] },
  ],

  // ===== Stage 9 =====
  [
    { id: 'gx9-1', kind: 'mcq', prompt: 'Which sentence says “I can speak Chinese” (a learned skill)?', options: ['我会说汉语。', '我汉语会说很。', '我很说汉语。'] },
    { id: 'gx9-2', kind: 'fill', prompt: 'Fill in the verb: “I like cats.”', hanzi: '我___猫。', pinyin: 'Wǒ ___ māo.', options: ['喜欢', '是', '很'] },
    { id: 'gx9-3', kind: 'mcq', prompt: 'How do you ask permission: “May I sit here?”', options: ['我能坐这儿吗？', '我坐这儿能很。', '我坐这儿是。'] },
    { id: 'gx9-4', kind: 'fill', prompt: 'Complete: “He can write Chinese characters.”', hanzi: '他___写汉字。', pinyin: 'Tā ___ xiě hànzì.', options: ['会', '是', '在'] },
    { id: 'gx9-5', kind: 'mcq', prompt: 'Which sentence means “I like cats”?', options: ['我喜欢猫。', '我猫喜欢。', '我喜欢是猫。'] },
    { id: 'gx9-6', kind: 'fill', prompt: 'Fill in the adjective: “I am very glad to meet you.”', hanzi: '我很___认识你。', pinyin: 'Wǒ hěn ___ rènshi nǐ.', options: ['高兴', '漂亮', '冷'] },
  ],

  // ===== Stage 10 =====
  [
    { id: 'gx10-1', kind: 'mcq', prompt: 'Which sentence means “I bought a book”?', options: ['我买了一本书。', '我一本买书了。', '买了一本书我。'] },
    { id: 'gx10-2', kind: 'fill', prompt: 'Complete the pattern 太……了: “Wonderful!”', hanzi: '太___了！', pinyin: 'Tài ___ le!', options: ['好', '在', '吗'] },
    { id: 'gx10-3', kind: 'mcq', prompt: 'How do you ask “How much is this?”', options: ['这个多少钱？', '这个几钱多？', '这个钱多少很。'] },
    { id: 'gx10-4', kind: 'fill', prompt: 'Fill in the money word: “An apple is five yuan.”', hanzi: '一个苹果五___。', pinyin: 'Yí gè píngguǒ wǔ ___.', options: ['块', '点', '个'] },
    { id: 'gx10-5', kind: 'mcq', prompt: 'Which one means “Please sit down”?', options: ['请坐。', '坐请。', '请是坐。'] },
    { id: 'gx10-6', kind: 'fill', prompt: 'Complete the phrase: “Sorry!”', hanzi: '对不___！', pinyin: 'Duìbu___!', options: ['起', '去', '坐'] },
  ],
]

/** 5 comprehension questions per passage (2 passages per stage) */
export const STAGE_READING_QUESTIONS: AuthoredQuestion[][][] = [
  // ===== Stage 1 =====
  [
    [
      { id: 'r1-1-q1', kind: 'truefalse', prompt: 'In the dialogue, 小明 says thank you.', options: ['True', 'False'] },
      { id: 'r1-1-q2', kind: 'mcq', prompt: 'What does 玛丽 ask first?', options: ['What is your name?', 'How old are you?', 'Where is your school?'] },
      { id: 'r1-1-q3', kind: 'mcq', prompt: 'How is 小明?', options: ['He is fine.', 'He is not well.', 'He is very cold.'] },
      {
        id: 'r1-1-q4', kind: 'match', prompt: 'Match the Chinese expressions with their meanings.',
        matchLeft: ['你好！', '谢谢！', '我很好。', '再见！'],
        matchOptions: ['Hello!', 'Thank you!', 'I am fine.', 'Goodbye!'],
      },
      { id: 'r1-1-q5', kind: 'truefalse', prompt: 'The two people say goodbye at the end.', options: ['True', 'False'] },
    ],
    [
      { id: 'r1-2-q1', kind: 'truefalse', prompt: 'The writer’s name is David.', options: ['True', 'False'] },
      { id: 'r1-2-q2', kind: 'mcq', prompt: 'What does David ask the reader?', options: ['What is your name?', 'How are you?', 'Where are you?'] },
      { id: 'r1-2-q3', kind: 'mcq', prompt: 'What does David say about his name?', options: ['It is very good.', 'It is not good.', 'It is very small.'] },
      {
        id: 'r1-2-q4', kind: 'match', prompt: 'Match the sentences with their meanings.',
        matchLeft: ['你好！', '我叫大卫。', '你叫什么名字？', '再见！'],
        matchOptions: ['Hello!', 'My name is David.', 'What is your name?', 'Goodbye!'],
      },
      { id: 'r1-2-q5', kind: 'truefalse', prompt: 'David does not like his name.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 2 =====
  [
    [
      { id: 'r2-1-q1', kind: 'truefalse', prompt: 'The girl is Mr. Wang’s daughter.', options: ['True', 'False'] },
      { id: 'r2-1-q2', kind: 'mcq', prompt: 'What is the daughter?', options: ['She is a student.', 'She is a teacher.', 'She is a doctor.'] },
      { id: 'r2-1-q3', kind: 'mcq', prompt: 'How is Mr. Wang?', options: ['He is fine.', 'He is not well.', 'He is cold.'] },
      {
        id: 'r2-1-q4', kind: 'match', prompt: 'Match the Chinese with their meanings.',
        matchLeft: ['我的女儿', '老师', '学生', '再见'],
        matchOptions: ['my daughter', 'teacher', 'student', 'goodbye'],
      },
      { id: 'r2-1-q5', kind: 'truefalse', prompt: '玛丽 is Mr. Wang’s daughter.', options: ['True', 'False'] },
    ],
    [
      { id: 'r2-2-q1', kind: 'truefalse', prompt: 'David’s dad is a teacher.', options: ['True', 'False'] },
      { id: 'r2-2-q2', kind: 'mcq', prompt: 'David’s mum is…', options: ['a student', 'a teacher', 'not a student'] },
      { id: 'r2-2-q3', kind: 'mcq', prompt: 'How are David’s parents?', options: ['They are both fine.', 'They are cold.', 'They are not well.'] },
      {
        id: 'r2-2-q4', kind: 'match', prompt: 'Match the sentences with their meanings.',
        matchLeft: ['这是我的爸爸', '她是学生', '我的妈妈很好', '再见'],
        matchOptions: ['This is my dad', 'She is a student', 'My mum is fine', 'Goodbye'],
      },
      { id: 'r2-2-q5', kind: 'truefalse', prompt: 'David’s mum is a teacher.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 3 =====
  [
    [
      { id: 'r3-1-q1', kind: 'truefalse', prompt: '小明 is twenty years old.', options: ['True', 'False'] },
      { id: 'r3-1-q2', kind: 'mcq', prompt: 'How old is 玛丽’s daughter?', options: ['Three', 'Five', 'Twenty'] },
      { id: 'r3-1-q3', kind: 'mcq', prompt: 'Who is a student?', options: ['The daughter', 'The son', '小明'] },
      {
        id: 'r3-1-q4', kind: 'match', prompt: 'Match the Chinese with their meanings.',
        matchLeft: ['二十岁', '儿子', '女儿', '五岁'],
        matchOptions: ['twenty years old', 'son', 'daughter', 'five years old'],
      },
      { id: 'r3-1-q5', kind: 'truefalse', prompt: '玛丽’s son is a student.', options: ['True', 'False'] },
    ],
    [
      { id: 'r3-2-q1', kind: 'truefalse', prompt: '小明’s dad is fifty years old.', options: ['True', 'False'] },
      { id: 'r3-2-q2', kind: 'mcq', prompt: 'How old is 小明’s mum?', options: ['48', '50', '20'] },
      { id: 'r3-2-q3', kind: 'mcq', prompt: 'Who is five years old?', options: ['The daughter', 'The son', '小明'] },
      {
        id: 'r3-2-q4', kind: 'match', prompt: 'Match the ages with their meanings.',
        matchLeft: ['五十岁', '二十岁', '三岁', '四十八岁'],
        matchOptions: ['fifty', 'twenty', 'three', 'forty-eight'],
      },
      { id: 'r3-2-q5', kind: 'truefalse', prompt: '小明 is fifty years old.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 4 =====
  [
    [
      { id: 'r4-1-q1', kind: 'truefalse', prompt: 'It is ten o’clock now.', options: ['True', 'False'] },
      { id: 'r4-1-q2', kind: 'mcq', prompt: 'When does the son go to school?', options: ['In the afternoon', 'In the morning', 'At noon'] },
      { id: 'r4-1-q3', kind: 'mcq', prompt: 'Where is the son in the morning?', options: ['At home', 'At school', 'In the shop'] },
      {
        id: 'r4-1-q4', kind: 'match', prompt: 'Match the Chinese with their meanings.',
        matchLeft: ['现在十点', '上午', '下午', '我去学校'],
        matchOptions: ['It is ten o’clock now', 'morning', 'afternoon', 'I go to school'],
      },
      { id: 'r4-1-q5', kind: 'truefalse', prompt: 'The daughter stays at home all day.', options: ['True', 'False'] },
    ],
    [
      { id: 'r4-2-q1', kind: 'truefalse', prompt: 'Mary goes to school five days a week.', options: ['True', 'False'] },
      { id: 'r4-2-q2', kind: 'mcq', prompt: 'When is Mary at school?', options: ['In the afternoon', 'In the morning', 'On Saturday'] },
      { id: 'r4-2-q3', kind: 'mcq', prompt: 'What does Mary do on Saturday?', options: ['She stays at home.', 'She goes to school.', 'She goes to Beijing.'] },
      {
        id: 'r4-2-q4', kind: 'match', prompt: 'Match the Chinese with their meanings.',
        matchLeft: ['星期一', '星期六', '现在八点', '明天'],
        matchOptions: ['Monday', 'Saturday', 'It is eight o’clock now', 'tomorrow'],
      },
      { id: 'r4-2-q5', kind: 'truefalse', prompt: 'On Saturday Mary goes to school.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 5 =====
  [
    [
      { id: 'r5-1-q1', kind: 'truefalse', prompt: 'The school is in Beijing.', options: ['True', 'False'] },
      { id: 'r5-1-q2', kind: 'mcq', prompt: 'Where is the restaurant?', options: ['In front of the school', 'Behind the school', 'In the shop'] },
      { id: 'r5-1-q3', kind: 'mcq', prompt: 'Where is the cup?', options: ['On the table', 'In the hospital', 'Behind the school'] },
      {
        id: 'r5-1-q4', kind: 'match', prompt: 'Match the position words with their meanings.',
        matchLeft: ['前面', '后面', '里', '哪儿'],
        matchOptions: ['in front', 'behind', 'inside', 'where'],
      },
      { id: 'r5-1-q5', kind: 'truefalse', prompt: 'The shop is behind the school.', options: ['True', 'False'] },
    ],
    [
      { id: 'r5-2-q1', kind: 'truefalse', prompt: 'The writer’s home is in Beijing, China.', options: ['True', 'False'] },
      { id: 'r5-2-q2', kind: 'mcq', prompt: 'What is behind the school?', options: ['The restaurant', 'The shop', 'The hospital'] },
      { id: 'r5-2-q3', kind: 'mcq', prompt: 'Where is the water?', options: ['In the cup', 'On the table', 'In the shop'] },
      {
        id: 'r5-2-q4', kind: 'match', prompt: 'Match the places with their meanings.',
        matchLeft: ['中国', '北京', '商店', '医院'],
        matchOptions: ['China', 'Beijing', 'shop', 'hospital'],
      },
      { id: 'r5-2-q5', kind: 'truefalse', prompt: 'The shop is in front of the school.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 6 =====
  [
    [
      { id: 'r6-1-q1', kind: 'truefalse', prompt: 'The customer wants to eat rice.', options: ['True', 'False'] },
      { id: 'r6-1-q2', kind: 'mcq', prompt: 'What does the customer drink?', options: ['Tea', 'Water', 'Apple juice'] },
      { id: 'r6-1-q3', kind: 'mcq', prompt: 'According to B, apples are…', options: ['very tasty', 'very small', 'not good'] },
      {
        id: 'r6-1-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['吃', '喝', '米饭', '苹果'],
        matchOptions: ['to eat', 'to drink', 'cooked rice', 'apple'],
      },
      { id: 'r6-1-q5', kind: 'truefalse', prompt: 'B wants to drink water.', options: ['True', 'False'] },
    ],
    [
      { id: 'r6-2-q1', kind: 'truefalse', prompt: 'Mary goes to Beijing by plane.', options: ['True', 'False'] },
      { id: 'r6-2-q2', kind: 'mcq', prompt: 'What does Mary want to eat?', options: ['Rice', 'Apples', 'Tea'] },
      { id: 'r6-2-q3', kind: 'mcq', prompt: 'Where is Mary now?', options: ['At a restaurant', 'At school', 'At home'] },
      {
        id: 'r6-2-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['坐飞机', '买', '一点儿', '水果'],
        matchOptions: ['by plane', 'to buy', 'a little', 'fruit'],
      },
      { id: 'r6-2-q5', kind: 'truefalse', prompt: 'Mary buys a lot of fruit.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 7 =====
  [
    [
      { id: 'r7-1-q1', kind: 'truefalse', prompt: 'B is a teacher.', options: ['True', 'False'] },
      { id: 'r7-1-q2', kind: 'mcq', prompt: 'What does B study?', options: ['Chinese', 'English', 'Computers'] },
      { id: 'r7-1-q3', kind: 'mcq', prompt: 'What does B read?', options: ['Chinese books', 'English books', 'Nothing'] },
      {
        id: 'r7-1-q4', kind: 'match', prompt: 'Match the verbs with their meanings.',
        matchLeft: ['学习', '读', '写', '说'],
        matchOptions: ['to study', 'to read', 'to write', 'to speak'],
      },
      { id: 'r7-1-q5', kind: 'truefalse', prompt: 'A sees B’s Chinese book.', options: ['True', 'False'] },
    ],
    [
      { id: 'r7-2-q1', kind: 'truefalse', prompt: '小明 is a student.', options: ['True', 'False'] },
      { id: 'r7-2-q2', kind: 'mcq', prompt: 'What does 小明 do in the morning?', options: ['Reads Chinese books and writes characters', 'Watches TV', 'Makes phone calls'] },
      { id: 'r7-2-q3', kind: 'mcq', prompt: 'When does 小明 make a phone call?', options: ['At four in the afternoon', 'At ten in the morning', 'At noon'] },
      {
        id: 'r7-2-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['汉语', '汉字', '电脑', '打电话'],
        matchOptions: ['Chinese language', 'Chinese characters', 'computer', 'to make a phone call'],
      },
      { id: 'r7-2-q5', kind: 'truefalse', prompt: '小明’s computer is under the table.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 8 =====
  [
    [
      { id: 'r8-1-q1', kind: 'truefalse', prompt: 'The weather in Beijing is hot today.', options: ['True', 'False'] },
      { id: 'r8-1-q2', kind: 'mcq', prompt: 'What will the weather be like tomorrow?', options: ['Rainy', 'Cold', 'Very good'] },
      { id: 'r8-1-q3', kind: 'mcq', prompt: 'How does B go home?', options: ['By taxi', 'By plane', 'By bike'] },
      {
        id: 'r8-1-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['天气', '下雨', '冷', '热'],
        matchOptions: ['weather', 'to rain', 'cold', 'hot'],
      },
      { id: 'r8-1-q5', kind: 'truefalse', prompt: 'B goes home by plane.', options: ['True', 'False'] },
    ],
    [
      { id: 'r8-2-q1', kind: 'truefalse', prompt: 'The writer lives in Beijing.', options: ['True', 'False'] },
      { id: 'r8-2-q2', kind: 'mcq', prompt: 'How is the weather today?', options: ['Very cold and raining', 'Very hot', 'Very good'] },
      { id: 'r8-2-q3', kind: 'mcq', prompt: 'Where is the cat?', options: ['Under the table', 'On the table', 'In the school'] },
      {
        id: 'r8-2-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['住', '大', '小', '东西'],
        matchOptions: ['to live', 'big', 'small', 'things'],
      },
      { id: 'r8-2-q5', kind: 'truefalse', prompt: 'The writer’s home is very big.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 9 =====
  [
    [
      { id: 'r9-1-q1', kind: 'truefalse', prompt: '玛丽 and the other person know each other already.', options: ['True', 'False'] },
      { id: 'r9-1-q2', kind: 'mcq', prompt: 'Who is 玛丽?', options: ['Mr. Wang’s classmate', 'Mr. Wang’s daughter', 'A doctor'] },
      { id: 'r9-1-q3', kind: 'mcq', prompt: 'What can the other person do?', options: ['Speak a little Chinese', 'Write Chinese very well', 'Drive a taxi'] },
      {
        id: 'r9-1-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['认识', '同学', '会', '能'],
        matchOptions: ['to know a person', 'classmate', 'can (learned skill)', 'can / may'],
      },
      { id: 'r9-1-q5', kind: 'truefalse', prompt: 'The other person can speak a lot of Chinese.', options: ['True', 'False'] },
    ],
    [
      { id: 'r9-2-q1', kind: 'truefalse', prompt: 'The writer likes Chinese.', options: ['True', 'False'] },
      { id: 'r9-2-q2', kind: 'mcq', prompt: 'What can the writer do?', options: ['Speak and write a little Chinese', 'Speak Chinese very well', 'Drive a taxi'] },
      { id: 'r9-2-q3', kind: 'mcq', prompt: 'Who has a computer?', options: ['The classmate', 'The writer', '小明’s mum'] },
      {
        id: 'r9-2-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['喜欢', '朋友', '没有', '高兴'],
        matchOptions: ['to like', 'friend', 'to not have', 'happy'],
      },
      { id: 'r9-2-q5', kind: 'truefalse', prompt: 'The writer has a computer.', options: ['True', 'False'] },
    ],
  ],

  // ===== Stage 10 =====
  [
    [
      { id: 'r10-1-q1', kind: 'truefalse', prompt: 'One apple costs five yuan.', options: ['True', 'False'] },
      { id: 'r10-1-q2', kind: 'mcq', prompt: 'How much do the apples cost?', options: ['Five yuan each', 'Ten yuan each', 'Fifty yuan each'] },
      { id: 'r10-1-q3', kind: 'mcq', prompt: 'What does B buy?', options: ['Some apples', 'Some books', 'Some water'] },
      {
        id: 'r10-1-q4', kind: 'match', prompt: 'Match the expressions with their meanings.',
        matchLeft: ['多少钱', '块', '太好了', '不客气'],
        matchOptions: ['how much money', 'yuan (money unit)', 'wonderful!', 'you’re welcome'],
      },
      { id: 'r10-1-q5', kind: 'truefalse', prompt: 'B does not buy anything.', options: ['True', 'False'] },
    ],
    [
      { id: 'r10-2-q1', kind: 'truefalse', prompt: '玛丽 makes the phone call.', options: ['True', 'False'] },
      { id: 'r10-2-q2', kind: 'mcq', prompt: 'What is 玛丽 doing now?', options: ['Watching TV', 'Reading a book', 'Sleeping'] },
      { id: 'r10-2-q3', kind: 'mcq', prompt: 'What do they plan to do?', options: ['Watch a movie', 'Go to the shop', 'Eat rice'] },
      {
        id: 'r10-2-q4', kind: 'match', prompt: 'Match the words with their meanings.',
        matchLeft: ['喂', '电视', '电影', '再见'],
        matchOptions: ['hello (on the phone)', 'TV', 'movie', 'goodbye'],
      },
      { id: 'r10-2-q5', kind: 'truefalse', prompt: 'They will go to the movies tomorrow afternoon.', options: ['True', 'False'] },
    ],
  ],
]
