import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AiChatError, answerHospitalQuestion } from '../ai/aiService.js';

const chatSchema = z.object({
  message: z.string().trim().min(3).max(2000),
});

export const aiChatController: RequestHandler = async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_MESSAGE', message: 'Message must contain between 3 and 2000 characters.' },
    });
  }

  try {
    const result = await answerHospitalQuestion(parsed.data.message);
    return res.json({ success: true, reply: result.reply });
  } catch (error) {
    if (error instanceof AiChatError) {
      return res.status(error.status).json({
        success: false,
        error: { code: error.code, message: error.message },
        ...(error.details ? { details: error.details } : {}),
      });
    }

    console.error('AI chat request failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'AI_REQUEST_FAILED', message: 'The assistant could not complete that request. Please try again.' },
    });
  }
};