// AI companion API implementation with OpenAI integration
const express = require('express');
const { Configuration, OpenAIApi } = require('openai');

const router = express.Router();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/ai-companion', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 100,
    });
    res.json({ response: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error connecting to OpenAI:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;