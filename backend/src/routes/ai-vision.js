const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// System prompt for receipt analysis
const RECEIPT_PROMPT = `Analyze this image of a receipt and extract the following information in JSON format:
{
  "amount": number (total amount paid),
  "date": string (ISO 8601 format YYYY-MM-DD, try to find the date on receipt, if not current date),
  "description": string (name of establishment or brief summary of items),
  "category": string (suggest a category like: Alimentação, Transporte, Mercado, Saúde, Lazer, Outros)
}
Only return the JSON. Do not include markdown formatting or extra text.`;

// @route   POST /api/ai/analyze-receipt
// @desc    Analyze a receipt image and return extracted data
// @access  Private
router.post('/analyze-receipt', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada',
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Chave da API Gemini não configurada',
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Convert buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Use a vision-capable model
      contents: [
        {
          role: 'user',
          parts: [
            { text: RECEIPT_PROMPT },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.text();
    
    // Extract JSON from response (remove markdown code blocks if any)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let extractedData = {};
    
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Falha ao processar resposta da IA');
    }

    res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('Receipt analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar recibo. Tente novamente com uma foto mais clara.',
    });
  }
});

module.exports = router;
