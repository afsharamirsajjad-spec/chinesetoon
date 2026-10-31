// ---------------------------------------------------------------------------
// 👂 HSK 1 pronunciation curriculum — one lesson per stage covering the full
// pinyin system (initials, finals, four tones + neutral tone, tone sandhi)
// in the order of the HSK 1 textbook, followed by ear-training drills.
//
// `toneDemos` and `minimalPairs` use standard sound-demo syllables (the same
// ones every textbook uses to teach tones/contrasts) — they are pronunciation
// targets, NOT vocabulary to learn, so they are intentionally exempt from the
// reading-passage vocabulary containment check.
// `listeningWords` are always real taught HSK 1 words.
//
// CLIENT-SAFE: no answer keys here.
// ---------------------------------------------------------------------------

import type { PronunciationLesson } from './types'

export const STAGE_PRONUNCIATION: PronunciationLesson[] = [
  // ===== Stage 1 =====
  {
    title: 'The Pinyin System & the Four Tones',
    intro:
      'Pinyin is the Roman alphabet spelling of Mandarin. Every syllable = an INITIAL (the starting sound) + a FINAL (the rest) + a TONE. Mastering pinyin and the four tones is the foundation of everything else.',
    sections: [
      {
        title: 'The four tones',
        body: 'Mandarin is a tonal language: the same syllable said with a different tone is a different word. 1st tone = high and flat (ˉ), 2nd = rising (ˊ), 3rd = falling-then-rising (ˇ), 4th = falling (ˋ). Listen to the classic demo syllable ma in all four tones.',
        items: [
          { label: 'mā 妈 (1st tone)', note: 'high and level — like singing one note' },
          { label: 'má 麻 (2nd tone)', note: 'rising — like a question “huh?”' },
          { label: 'mǎ 马 (3rd tone)', note: 'dips down, then comes back up' },
          { label: 'mà 骂 (4th tone)', note: 'falls sharply — like saying “No!”' },
        ],
      },
      {
        title: 'First initials: b p m f · d t n l',
        body: 'b p d t g k are UNASPIRATED vs ASPIRATED pairs: p/t/k come with a strong puff of air (hold a tissue in front of your mouth). m and n are nasal — m closes the lips, n touches the ridge behind your teeth.',
        items: [
          { label: 'b / p', note: 'bà (dad) vs pà (to fear) — the puff of air is the difference' },
          { label: 'd / t', note: 'dà (big) vs tà (to stamp)' },
          { label: 'n / l', note: 'n touches behind the top teeth; l lets the air pass the sides of the tongue' },
          { label: 'f / m', note: 'f bites the lower lip; m hums through the nose' },
        ],
      },
      {
        title: 'Simple finals: a o e i u ü',
        body: 'a = “ah”, o = “aw”, e = a lazy “uh” (never “ee”), i = “ee”, u = “oo”, ü = say “ee” with rounded lips. ü is the sound English does not have — practise it!',
        items: [
          { label: 'a · o · e', note: 'ā ā ē — open, round, mid' },
          { label: 'i · u', note: 'yī ū — tight “ee”, tight “oo”' },
          { label: 'ü', note: 'nǚ “daughter” — round your lips and say “ee”' },
        ],
      },
      {
        title: 'The neutral tone',
        body: 'Particles like 吗 (ma), 呢 (ne), 的 (de) are said light and short, with no tone mark — the neutral tone. It always attaches to the end of a word or sentence.',
        items: [
          { label: '你好吗？ nǐ hǎo ma?', note: 'ma is light and quick' },
          { label: '我的 wǒ de', note: 'de is said softly' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '妈', pinyin: 'mā', tone: 1, meaning: 'mother' },
      { hanzi: '麻', pinyin: 'má', tone: 2, meaning: 'numb' },
      { hanzi: '马', pinyin: 'mǎ', tone: 3, meaning: 'horse' },
      { hanzi: '骂', pinyin: 'mà', tone: 4, meaning: 'to scold' },
    ],
    listeningWords: [
      { hanzi: '你', pinyin: 'nǐ', meaning: 'you', toneOfFirstSyllable: 3 },
      { hanzi: '我', pinyin: 'wǒ', meaning: 'I; me', toneOfFirstSyllable: 3 },
      { hanzi: '好', pinyin: 'hǎo', meaning: 'good', toneOfFirstSyllable: 3 },
      { hanzi: '不', pinyin: 'bù', meaning: 'not; no', toneOfFirstSyllable: 4 },
      { hanzi: '是', pinyin: 'shì', meaning: 'to be', toneOfFirstSyllable: 4 },
    ],
    minimalPairs: [
      { a: { hanzi: '爸', pinyin: 'bà', meaning: 'dad' }, b: { hanzi: '怕', pinyin: 'pà', meaning: 'to fear' }, note: 'b = no puff of air, p = strong puff' },
      { a: { hanzi: '妈', pinyin: 'mā', meaning: 'mother' }, b: { hanzi: '那', pinyin: 'nà', meaning: 'that' }, note: 'm = lips closed, n = tongue up' },
      { a: { hanzi: '大', pinyin: 'dà', meaning: 'big' }, b: { hanzi: '踏', pinyin: 'tà', meaning: 'to stamp' }, note: 'd = no puff of air, t = strong puff' },
    ],
  },

  // ===== Stage 2 =====
  {
    title: 'Initials g k h and j q x',
    intro:
      'This stage adds two families of initials. g k h come from the back of the mouth; j q x come from the front with a smile-shaped tongue. Listening carefully is the only way to keep them apart.',
    sections: [
      {
        title: 'g · k · h',
        body: 'g/k are another aspirated pair (k = big puff of air). h is a soft, breathing sound — lighter than English “h”, made at the back of the mouth.',
        items: [
          { label: 'gē 哥 vs kě 渴', note: 'brother vs thirsty — same place, puff of air decides' },
          { label: 'hē 喝', note: 'to drink — like fogging a mirror, gently' },
        ],
      },
      {
        title: 'j · q · x — the smiling initials',
        body: 'j q x are made with the tongue flat and forward (like j in “jeep”, ch in “cheese”, sh in “sheep” — but lighter). q has the puff of air. They only combine with i and ü.',
        items: [
          { label: 'jī 鸡 vs qī 七', note: 'chicken vs seven — q has the puff' },
          { label: 'xǐ 喜欢 (xǐhuan)', note: 'x is a soft “sh” said with a smile' },
          { label: 'jǔ qù? qù 去', note: '去 qù — j/q/x + ü loses its two dots' },
        ],
      },
      {
        title: 'Finals ai ei ao ou · an en',
        body: 'These finals glide from one vowel to another: ai = “eye”, ei = “ay”, ao = “ow”, ou = “oh”. an/en end with the tongue touching behind the teeth (front nasal).',
        items: [
          { label: 'ài 爱', note: '“eye” with a falling tone' },
          { label: 'bēizi 杯子', note: 'ei inside 杯' },
          { label: 'hěn 很', note: 'the “en” of 很' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '衣', pinyin: 'yī', tone: 1, meaning: 'clothes' },
      { hanzi: '姨', pinyin: 'yí', tone: 2, meaning: 'aunt' },
      { hanzi: '椅', pinyin: 'yǐ', tone: 3, meaning: 'chair' },
      { hanzi: '意', pinyin: 'yì', tone: 4, meaning: 'meaning' },
    ],
    listeningWords: [
      { hanzi: '爸爸', pinyin: 'bàba', meaning: 'dad', toneOfFirstSyllable: 4 },
      { hanzi: '妈妈', pinyin: 'māma', meaning: 'mum', toneOfFirstSyllable: 1 },
      { hanzi: '老师', pinyin: 'lǎoshī', meaning: 'teacher', toneOfFirstSyllable: 3 },
      { hanzi: '都', pinyin: 'dōu', meaning: 'all', toneOfFirstSyllable: 1 },
      { hanzi: '谁', pinyin: 'shéi', meaning: 'who', toneOfFirstSyllable: 2 },
    ],
    minimalPairs: [
      { a: { hanzi: '哥', pinyin: 'gē', meaning: 'older brother' }, b: { hanzi: '渴', pinyin: 'kě', meaning: 'thirsty' }, note: 'g = no puff, k = strong puff' },
      { a: { hanzi: '鸡', pinyin: 'jī', meaning: 'chicken' }, b: { hanzi: '七', pinyin: 'qī', meaning: 'seven' }, note: 'j = no puff, q = strong puff' },
      { a: { hanzi: '喝', pinyin: 'hē', meaning: 'to drink' }, b: { hanzi: '渴', pinyin: 'kě', meaning: 'thirsty' }, note: 'h breathes out, k blocks then pops' },
    ],
  },

  // ===== Stage 3 =====
  {
    title: 'Zh ch sh r vs z c s',
    intro:
      'The hardest listening contrast for beginners: the “retroflex” initials zh ch sh r (tongue curled back) versus the “dental” initials z c s (tongue forward, teeth almost closed). Numbers 四/十 and 是/四 live exactly on this contrast.',
    sections: [
      {
        title: 'The retroflex family: zh · ch · sh · r',
        body: 'Curl the tip of the tongue up and back. zh/ch are an aspirated pair (ch = puff), sh is a heavy “sh”, r is like the “r” in “azure” — a buzzing sh.',
        items: [
          { label: 'shì 是', note: 'to be — heavy sh, falling tone' },
          { label: 'zhōng 中国', note: 'zh inside 中' },
          { label: 'rè 热', note: 'hot — buzz like a bee' },
        ],
      },
      {
        title: 'The dental family: z · c · s',
        body: 'Tongue forward, touching or near the back of the teeth. z = “ds” in “kids”, c = “ts” with a puff of air, s = plain “s”. Never let the tongue curl back.',
        items: [
          { label: 'sì 四', note: 'four — plain s, no curl' },
          { label: 'cài 菜', note: 'vegetables — ts with a puff' },
        ],
      },
      {
        title: 'Back-nasal finals: ang · eng · ong · er',
        body: 'ang/eng end at the BACK of the mouth (like “song”), ong is a deep “oong”, er curls the tongue (the famous 儿 sound).',
        items: [
          { label: 'shàng 上', note: 'the “ang” of 上' },
          { label: 'zhōng 中', note: 'the “ong” of 中' },
          { label: 'yìdiǎnr 一点儿', note: 'er attaches to the previous syllable' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '汤', pinyin: 'tāng', tone: 1, meaning: 'soup' },
      { hanzi: '糖', pinyin: 'táng', tone: 2, meaning: 'sugar' },
      { hanzi: '躺', pinyin: 'tǎng', tone: 3, meaning: 'to lie down' },
      { hanzi: '烫', pinyin: 'tàng', tone: 4, meaning: 'scalding hot' },
    ],
    listeningWords: [
      { hanzi: '十', pinyin: 'shí', meaning: 'ten', toneOfFirstSyllable: 2 },
      { hanzi: '四', pinyin: 'sì', meaning: 'four', toneOfFirstSyllable: 4 },
      { hanzi: '三', pinyin: 'sān', meaning: 'three', toneOfFirstSyllable: 1 },
      { hanzi: '九', pinyin: 'jiǔ', meaning: 'nine', toneOfFirstSyllable: 3 },
      { hanzi: '七', pinyin: 'qī', meaning: 'seven', toneOfFirstSyllable: 1 },
    ],
    minimalPairs: [
      { a: { hanzi: '知', pinyin: 'zhī', meaning: 'to know' }, b: { hanzi: '字', pinyin: 'zì', meaning: 'character' }, note: 'zh = tongue curled, z = tongue forward' },
      { a: { hanzi: '是', pinyin: 'shì', meaning: 'to be' }, b: { hanzi: '四', pinyin: 'sì', meaning: 'four' }, note: 'sh = curled, s = forward — the classic pair' },
      { a: { hanzi: '茶', pinyin: 'chá', meaning: 'tea' }, b: { hanzi: '擦', pinyin: 'cā', meaning: 'to wipe' }, note: 'ch = curled with puff, c = forward with puff' },
    ],
  },

  // ===== Stage 4 =====
  {
    title: 'Y, W, Compound Finals & the Third-Tone Dip',
    intro:
      'Now you meet the glides y and w, the big compound finals (ia ie iao iu · ua uo uai ui · üe), and the most famous tone rule in Mandarin: the third tone changes before another third tone.',
    sections: [
      {
        title: 'Glides y · w',
        body: 'When a syllable starts with i or u and nothing else, pinyin writes y or w: yi (= i), wu (= u), ya, wa… That is why 一 is yī and 五 is wǔ.',
        items: [
          { label: 'yī 一', note: '“ee” — written with y' },
          { label: 'wǔ 五', note: '“oo” — written with w' },
          { label: 'yīfu 衣服', note: 'clothes — y + i' },
        ],
      },
      {
        title: 'Compound finals',
        body: 'ia = “yah”, ie = “yeh”, iao = “yaow”, iu = “yo”, ua = “wa”, uo = “wo”, uai = “why”, ui = “way”, üe = “yweh”. Learn them as whole glides, not letter by letter.',
        items: [
          { label: 'xiàwǔ 下午', note: 'ia inside 下' },
          { label: 'shuǐ 水', note: 'ui = “way” — u + ei glided' },
          { label: 'xuéxiào 学校', note: 'üe inside 学, iao inside 校' },
        ],
      },
      {
        title: 'Third-tone sandhi (3 + 3 → 2 + 3)',
        body: 'When TWO third tones meet, the first one is pronounced as a second tone: 你好 is really “ní hǎo”, 很好 is “hén hǎo”. The pinyin spelling does not change — only the sound does.',
        items: [
          { label: '你好 nǐ hǎo → “ní hǎo”', note: 'say the first syllable rising' },
          { label: '很好 hěn hǎo → “hén hǎo”', note: 'same rule' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '方', pinyin: 'fāng', tone: 1, meaning: 'direction; square' },
      { hanzi: '房', pinyin: 'fáng', tone: 2, meaning: 'house' },
      { hanzi: '访', pinyin: 'fǎng', tone: 3, meaning: 'to visit' },
      { hanzi: '放', pinyin: 'fàng', tone: 4, meaning: 'to put' },
    ],
    listeningWords: [
      { hanzi: '今天', pinyin: 'jīntiān', meaning: 'today', toneOfFirstSyllable: 1 },
      { hanzi: '明天', pinyin: 'míngtiān', meaning: 'tomorrow', toneOfFirstSyllable: 2 },
      { hanzi: '学校', pinyin: 'xuéxiào', meaning: 'school', toneOfFirstSyllable: 2 },
      { hanzi: '上午', pinyin: 'shàngwǔ', meaning: 'morning', toneOfFirstSyllable: 4 },
      { hanzi: '下午', pinyin: 'xiàwǔ', meaning: 'afternoon', toneOfFirstSyllable: 4 },
    ],
    minimalPairs: [
      { a: { hanzi: '先', pinyin: 'xiān', meaning: 'first' }, b: { hanzi: '想', pinyin: 'xiǎng', meaning: 'to want' }, note: 'ian = front nasal, iang = back nasal' },
      { a: { hanzi: '对', pinyin: 'duì', meaning: 'correct' }, b: { hanzi: '丢', pinyin: 'diū', meaning: 'to lose' }, note: 'ui = “way”, iu = “yo”' },
      { a: { hanzi: '水', pinyin: 'shuǐ', meaning: 'water' }, b: { hanzi: '谁', pinyin: 'shéi', meaning: 'who' }, note: 'ui vs ei — almost the same glide' },
    ],
  },

  // ===== Stage 5 =====
  {
    title: 'Front vs Back Nasals & the 不 Tone Shift',
    intro:
      'Two skills this stage: telling -n finals (front) from -ng finals (back), and the tone shift of 不 — it is bù (4th) alone, but bú (2nd) before another 4th tone.',
    sections: [
      {
        title: 'Front nasals: an · en · in · ün',
        body: 'End with the tongue tip up, air through the NOSE, mouth almost closed. Think of the ending “n” in “sun”.',
        items: [
          { label: 'fàn 饭', note: 'the “an” of 饭店' },
          { label: 'diàn 电', note: 'the “ian” of 商店' },
        ],
      },
      {
        title: 'Back nasals: ang · eng · ing · ong',
        body: 'Same idea but the air leaves at the BACK of the mouth — like “song” and “long”. This is the contrast native speakers hear instantly.',
        items: [
          { label: 'fàng 放', note: 'ang = back nasal' },
          { label: 'yīyuàn 医院', note: 'front “an” in 院' },
          { label: 'Zhōngguó 中国', note: 'ong = deep back nasal' },
        ],
      },
      {
        title: '不 changes: bù → bú',
        body: '不 is 4th tone (bù). But before ANOTHER 4th tone it becomes 2nd tone (bú): 不是 is said “bú shì”. Spelling stays 不.',
        items: [
          { label: 'wǒ bú shì', note: '我不是 — bú rises' },
          { label: 'bú qù', note: '不去 — before 去 (qù, 4th tone)' },
        ],
      },
      {
        title: 'The 儿 ending (erhua)',
        body: '一点儿 (yìdiǎnr), 哪儿 (nǎr) — the “r” curls onto the previous syllable. Say “diǎnr” as one syllable with a curled ending, not two syllables.',
        items: [
          { label: 'nǎr 哪儿', note: 'one syllable + r' },
          { label: 'yìdiǎnr 一点儿', note: '“dyar” with an r at the end' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '包', pinyin: 'bāo', tone: 1, meaning: 'bag' },
      { hanzi: '薄', pinyin: 'báo', tone: 2, meaning: 'thin' },
      { hanzi: '饱', pinyin: 'bǎo', tone: 3, meaning: 'full (from eating)' },
      { hanzi: '抱', pinyin: 'bào', tone: 4, meaning: 'to hug' },
    ],
    listeningWords: [
      { hanzi: '饭店', pinyin: 'fàndiàn', meaning: 'restaurant', toneOfFirstSyllable: 4 },
      { hanzi: '商店', pinyin: 'shāngdiàn', meaning: 'shop', toneOfFirstSyllable: 1 },
      { hanzi: '中国', pinyin: 'Zhōngguó', meaning: 'China', toneOfFirstSyllable: 1 },
      { hanzi: '北京', pinyin: 'Běijīng', meaning: 'Beijing', toneOfFirstSyllable: 3 },
      { hanzi: '哪儿', pinyin: 'nǎr', meaning: 'where', toneOfFirstSyllable: 3 },
    ],
    minimalPairs: [
      { a: { hanzi: '饭', pinyin: 'fàn', meaning: 'meal' }, b: { hanzi: '放', pinyin: 'fàng', meaning: 'to put' }, note: 'an = front nasal, ang = back nasal' },
      { a: { hanzi: '分', pinyin: 'fēn', meaning: 'minute; to divide' }, b: { hanzi: '风', pinyin: 'fēng', meaning: 'wind' }, note: 'en vs eng — same contrast, different vowel' },
      { a: { hanzi: '买', pinyin: 'mǎi', meaning: 'to buy' }, b: { hanzi: '卖', pinyin: 'mài', meaning: 'to sell' }, note: '3rd tone vs 4th tone, same sounds' },
    ],
  },

  // ===== Stage 6 =====
  {
    title: 'Food Words & the ü Sound',
    intro:
      'Ear training with the words you actually eat and drink — plus the ü sound that j q x hide inside 去 (qù), and two-syllable tone pairs.',
    sections: [
      {
        title: 'The ü family with j q x',
        body: 'After j, q, x the ü loses its dots but keeps its sound: 去 qù, 学 xué. Round your lips and say “ee” — that is ü.',
        items: [
          { label: 'qù 去', note: 'written u, sounds ü' },
          { label: 'xuéxí 学习', note: 'xué = x + üe' },
        ],
      },
      {
        title: 'Tone pairs in two-syllable words',
        body: 'Real words are chains of tones. Practise the most common HSK 1 chains: 4+2 (苹果 píngguǒ), 3+4 (米饭 mǐfàn), 2+0 (喜欢 xǐhuan — second syllable neutral).',
        items: [
          { label: 'píngguǒ 苹果', note: '2 + 3' },
          { label: 'mǐfàn 米饭', note: '3 + 4' },
          { label: 'xǐhuan 喜欢', note: '3 + neutral' },
        ],
      },
      {
        title: 'Neutral tone inside words',
        body: 'The second syllable of 杯子, 椅子, 苹果(half), 喜欢 is light and short. Do not give it a full tone — it “falls off” the first syllable.',
        items: [
          { label: 'bēizi 杯子', note: 'zi is quick and soft' },
          { label: 'yǐzi 椅子', note: 'same pattern' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '猜', pinyin: 'cāi', tone: 1, meaning: 'to guess' },
      { hanzi: '才', pinyin: 'cái', tone: 2, meaning: 'only then; talent' },
      { hanzi: '采', pinyin: 'cǎi', tone: 3, meaning: 'to pick' },
      { hanzi: '菜', pinyin: 'cài', tone: 4, meaning: 'vegetables; dish' },
    ],
    listeningWords: [
      { hanzi: '苹果', pinyin: 'píngguǒ', meaning: 'apple', toneOfFirstSyllable: 2 },
      { hanzi: '米饭', pinyin: 'mǐfàn', meaning: 'cooked rice', toneOfFirstSyllable: 3 },
      { hanzi: '茶', pinyin: 'chá', meaning: 'tea', toneOfFirstSyllable: 2 },
      { hanzi: '水果', pinyin: 'shuǐguǒ', meaning: 'fruit', toneOfFirstSyllable: 3 },
      { hanzi: '椅子', pinyin: 'yǐzi', meaning: 'chair', toneOfFirstSyllable: 3 },
    ],
    minimalPairs: [
      { a: { hanzi: '七', pinyin: 'qī', meaning: 'seven' }, b: { hanzi: '吃', pinyin: 'chī', meaning: 'to eat' }, note: 'q = smiling front, ch = curled back' },
      { a: { hanzi: '西', pinyin: 'xī', meaning: 'west' }, b: { hanzi: '是', pinyin: 'shì', meaning: 'to be' }, note: 'x = soft front “sh”, sh = heavy retroflex' },
      { a: { hanzi: '鱼', pinyin: 'yú', meaning: 'fish' }, b: { hanzi: '一', pinyin: 'yī', meaning: 'one' }, note: 'ü vs i — round lips vs spread lips' },
    ],
  },

  // ===== Stage 7 =====
  {
    title: 'Study Words & Neutral-Tone Training',
    intro:
      'The study-and-work vocabulary is full of neutral tones (桌子, 电脑, 汉语…) and the zh/z contrast (汉字 hànzì). Train your ear on the words you now read and write every day.',
    sections: [
      {
        title: 'Neutral tone everywhere',
        body: 'Students of Chinese hear neutral tone constantly: 桌子 zhuōzi, 电脑 diànnǎo (light nǎo), 汉语 hànyǔ (light yǔ), 名字 míngzi. The SECOND syllable goes soft — the first keeps its tone.',
        items: [
          { label: 'zhuōzi 桌子', note: 'zi = neutral' },
          { label: 'míngzi 名字', note: 'zi = neutral' },
          { label: 'diànnǎo 电脑', note: 'nǎo half-light' },
        ],
      },
      {
        title: 'zh vs z in real words',
        body: '汉字 hànzì — the FIRST syllable is retroflex zh, the second is dental z. 汉语 hànyǔ — zh + ü. Say them slowly, then fast.',
        items: [
          { label: 'hànzì 汉字', note: 'zh…z contrast inside one word' },
          { label: 'hànyǔ 汉语', note: 'zh + ü' },
        ],
      },
      {
        title: 'Listen to whole sentences',
        body: 'At this stage start listening to full sentences: 现在十点。我学习汉语。Catch the tones one by one, then the meaning.',
        items: [
          { label: 'Wǒ xuéxí hànyǔ.', note: '我学习汉语。' },
          { label: 'Xiànzài shí diǎn.', note: '现在十点。' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '撕', pinyin: 'sī', tone: 1, meaning: 'to tear' },
      { hanzi: '时', pinyin: 'shí', tone: 2, meaning: 'time' },
      { hanzi: '死', pinyin: 'sǐ', tone: 3, meaning: 'to die' },
      { hanzi: '四', pinyin: 'sì', tone: 4, meaning: 'four' },
    ],
    listeningWords: [
      { hanzi: '汉语', pinyin: 'hànyǔ', meaning: 'Chinese language', toneOfFirstSyllable: 4 },
      { hanzi: '电脑', pinyin: 'diànnǎo', meaning: 'computer', toneOfFirstSyllable: 4 },
      { hanzi: '书', pinyin: 'shū', meaning: 'book', toneOfFirstSyllable: 1 },
      { hanzi: '学习', pinyin: 'xuéxí', meaning: 'to study', toneOfFirstSyllable: 2 },
      { hanzi: '打电话', pinyin: 'dǎ diànhuà', meaning: 'to make a phone call', toneOfFirstSyllable: 3 },
    ],
    minimalPairs: [
      { a: { hanzi: '四', pinyin: 'sì', meaning: 'four' }, b: { hanzi: '是', pinyin: 'shì', meaning: 'to be' }, note: 's forward vs sh curled — review' },
      { a: { hanzi: '字', pinyin: 'zì', meaning: 'character' }, b: { hanzi: '知', pinyin: 'zhī', meaning: 'to know' }, note: 'z forward vs zh curled' },
      { a: { hanzi: '菜', pinyin: 'cài', meaning: 'dish' }, b: { hanzi: '茶', pinyin: 'chá', meaning: 'tea' }, note: 'c forward puff vs ch curled puff' },
    ],
  },

  // ===== Stage 8 =====
  {
    title: 'Home & Weather: the n/l and uo/ou Contrasts',
    intro:
      'Weather words are perfect tone-pair training (很冷 hěn lěng, 很热 hěn rè), and this stage fixes two classic beginner confusions: n vs l, and uo vs ou.',
    sections: [
      {
        title: 'n vs l',
        body: 'n stops the air in the nose; l lets it escape over the sides of the tongue. If 冷 (lěng) and 能 (néng) sound the same to you, this drill is your medicine.',
        items: [
          { label: 'lěng 冷', note: 'air over the SIDES' },
          { label: 'néng 能', note: 'air through the NOSE' },
          { label: 'lái 来 vs nǎi 奶', note: 'come vs milk' },
        ],
      },
      {
        title: 'uo vs ou',
        body: '坐 zuò (uo = “waw”) vs 走 zǒu (ou = “oh”). Start 坐 with a “w” glide; 走 has no glide at all.',
        items: [
          { label: 'zuò 坐', note: '“zwaw”' },
          { label: 'zǒu 走', note: '“tzoh”' },
        ],
      },
      {
        title: 'Weather sentences with tone pairs',
        body: '今天很冷 jīntiān hěn lěng — 1-1, 3-3 (→2-3!), 1-2 chains. Read the pinyin colors, then listen and repeat.',
        items: [
          { label: 'Jīntiān hěn lěng.', note: '今天很冷。 — 3+3 sandhi inside!' },
          { label: 'Jīntiān xiàyǔ.', note: '今天下雨。' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '屋', pinyin: 'wū', tone: 1, meaning: 'room' },
      { hanzi: '无', pinyin: 'wú', tone: 2, meaning: 'without' },
      { hanzi: '五', pinyin: 'wǔ', tone: 3, meaning: 'five' },
      { hanzi: '物', pinyin: 'wù', tone: 4, meaning: 'thing' },
    ],
    listeningWords: [
      { hanzi: '天气', pinyin: 'tiānqì', meaning: 'weather', toneOfFirstSyllable: 1 },
      { hanzi: '下雨', pinyin: 'xiàyǔ', meaning: 'to rain', toneOfFirstSyllable: 4 },
      { hanzi: '冷', pinyin: 'lěng', meaning: 'cold', toneOfFirstSyllable: 3 },
      { hanzi: '热', pinyin: 'rè', meaning: 'hot', toneOfFirstSyllable: 4 },
      { hanzi: '出租车', pinyin: 'chūzūchē', meaning: 'taxi', toneOfFirstSyllable: 1 },
    ],
    minimalPairs: [
      { a: { hanzi: '冷', pinyin: 'lěng', meaning: 'cold' }, b: { hanzi: '能', pinyin: 'néng', meaning: 'can' }, note: 'l = side air, n = nose air' },
      { a: { hanzi: '坐', pinyin: 'zuò', meaning: 'to sit' }, b: { hanzi: '走', pinyin: 'zǒu', meaning: 'to walk' }, note: 'uo = “waw”, ou = “oh”' },
      { a: { hanzi: '奶', pinyin: 'nǎi', meaning: 'milk' }, b: { hanzi: '来', pinyin: 'lái', meaning: 'to come' }, note: 'n nose vs l side, same final' },
    ],
  },

  // ===== Stage 9 =====
  {
    title: 'Feelings, Abilities & Question Intonation',
    intro:
      'This stage trains the sounds of 会 (huì), 能 (néng), 喜欢 (xǐhuan) — and the melody of questions: statements fall, questions with 吗 rise at the end.',
    sections: [
      {
        title: 'huì vs néng',
        body: '会 huì — h + “way”, falling. 能 néng — the back nasal “ng” ending. Both are common; drill them back to back.',
        items: [
          { label: 'wǒ huì shuō', note: '我会说 — h + uei glide' },
          { label: 'wǒ néng lái', note: '我能来 — keep the “ng” humming' },
        ],
      },
      {
        title: 'Question intonation with 吗',
        body: 'A statement ends low: 我是学生。 A question with 吗 floats UP at the end: 我是学生吗？ Same words — the melody carries the meaning.',
        items: [
          { label: 'Wǒ shì xuésheng.', note: 'falls at the end' },
          { label: 'Nǐ shì lǎoshī ma?', note: 'rises on ma' },
        ],
      },
      {
        title: 'The 3+3 sandhi again — now in feelings',
        body: '很好 (hěn hǎo → hén hǎo) is everywhere in this stage: 很高兴 hěn gāoxìng, 很漂亮 hěn piàoliang. Say the FIRST third tone as a rising tone.',
        items: [
          { label: 'hěn gāoxìng → “hén gāoxìng”', note: '很高兴' },
          { label: 'hěn piàoliang → “hén piàoliang”', note: '很漂亮' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '星', pinyin: 'xīng', tone: 1, meaning: 'star' },
      { hanzi: '行', pinyin: 'xíng', tone: 2, meaning: 'OK; to walk' },
      { hanzi: '醒', pinyin: 'xǐng', tone: 3, meaning: 'to wake up' },
      { hanzi: '姓', pinyin: 'xìng', tone: 4, meaning: 'surname' },
    ],
    listeningWords: [
      { hanzi: '喜欢', pinyin: 'xǐhuan', meaning: 'to like', toneOfFirstSyllable: 3 },
      { hanzi: '高兴', pinyin: 'gāoxìng', meaning: 'happy', toneOfFirstSyllable: 1 },
      { hanzi: '漂亮', pinyin: 'piàoliang', meaning: 'pretty', toneOfFirstSyllable: 4 },
      { hanzi: '认识', pinyin: 'rènshi', meaning: 'to know someone', toneOfFirstSyllable: 4 },
      { hanzi: '医生', pinyin: 'yīshēng', meaning: 'doctor', toneOfFirstSyllable: 1 },
    ],
    minimalPairs: [
      { a: { hanzi: '先', pinyin: 'xiān', meaning: 'first' }, b: { hanzi: '山', pinyin: 'shān', meaning: 'mountain' }, note: 'x soft front vs sh heavy retroflex' },
      { a: { hanzi: '请', pinyin: 'qǐng', meaning: 'please' }, b: { hanzi: '成', pinyin: 'chéng', meaning: 'to become; OK' }, note: 'q = front puff, ch = retroflex puff' },
      { a: { hanzi: '四', pinyin: 'sì', meaning: 'four' }, b: { hanzi: '是', pinyin: 'shì', meaning: 'to be' }, note: 'final review of the classic pair' },
    ],
  },

  // ===== Stage 10 =====
  {
    title: 'Full Sentences & the 一 Tone Dance',
    intro:
      'The last pronunciation stage polishes everything: the tone shifts of 一 (yī → yí / yì), listening to complete HSK 1 sentences, and a final all-four-tones ear check.',
    sections: [
      {
        title: '一 changes tone',
        body: '一 is yī (1st tone) when counting or saying numbers. Before a 4th tone it becomes yí: 一个 yí gè. Before a 1st, 2nd or 3rd tone it becomes yì: 一本 yì běn, 一点儿 yìdiǎnr. The character never changes — only the sound does.',
        items: [
          { label: 'yí gè 一个', note: 'before 4th tone → yí' },
          { label: 'yì běn shū 一本书', note: 'before 3rd tone → yì' },
          { label: 'yìdiǎnr 一点儿', note: 'before 3rd tone → yì' },
        ],
      },
      {
        title: 'Listening to whole exchanges',
        body: 'Real conversations now: 喂？你好！这个多少钱？——五块。 Listen for the price words and the falling question melody of 多少钱.',
        items: [
          { label: 'Wèi?', note: '喂？ — answering the phone' },
          { label: 'Zhè gè duōshao qián?', note: '这个多少钱？' },
        ],
      },
      {
        title: 'All four tones — final check',
        body: 'One last pass over the four tone shapes with the demo syllable yi: 衣 yī, 姨 yí, 椅 yǐ, 意 yì. If you can hear these four apart, your tone ear is ready for HSK 2.',
        items: [
          { label: 'yī 衣 · yí 姨 · yǐ 椅 · yì 意', note: '1 · 2 · 3 · 4' },
        ],
      },
    ],
    toneDemos: [
      { hanzi: '衣', pinyin: 'yī', tone: 1, meaning: 'clothes' },
      { hanzi: '姨', pinyin: 'yí', tone: 2, meaning: 'aunt' },
      { hanzi: '椅', pinyin: 'yǐ', tone: 3, meaning: 'chair' },
      { hanzi: '意', pinyin: 'yì', tone: 4, meaning: 'meaning' },
    ],
    listeningWords: [
      { hanzi: '多少钱', pinyin: 'duōshao qián', meaning: 'how much money', toneOfFirstSyllable: 1 },
      { hanzi: '电视', pinyin: 'diànshì', meaning: 'TV', toneOfFirstSyllable: 4 },
      { hanzi: '对不起', pinyin: 'duìbuqǐ', meaning: 'sorry', toneOfFirstSyllable: 4 },
      { hanzi: '再见', pinyin: 'zàijiàn', meaning: 'goodbye', toneOfFirstSyllable: 4 },
      { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'thank you', toneOfFirstSyllable: 4 },
    ],
    minimalPairs: [
      { a: { hanzi: '一', pinyin: 'yī', meaning: 'one' }, b: { hanzi: '鱼', pinyin: 'yú', meaning: 'fish' }, note: 'i spread lips vs ü round lips' },
      { a: { hanzi: '点', pinyin: 'diǎn', meaning: "o'clock" }, b: { hanzi: '担', pinyin: 'dān', meaning: 'to carry' }, note: 'ian vs an — the medial i matters' },
      { a: { hanzi: '买', pinyin: 'mǎi', meaning: 'to buy' }, b: { hanzi: '卖', pinyin: 'mài', meaning: 'to sell' }, note: 'tone only: 3 vs 4' },
    ],
  },
]
