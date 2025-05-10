const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const analyzeIzinTalebi = async (requestDesc) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen bir izin talebi analiz uzmanısın. Verilen izin talebini analiz et ve aşağıdaki kriterlere göre değerlendir: 1) Talebin aciliyeti 2) Talebin uygunluğu 3) Öneriler"
        },
        {
          role: "user",
          content: requestDesc
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return {
      analysis: completion.choices[0].message.content,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return null;
  }
};

module.exports = { analyzeIzinTalebi }; 