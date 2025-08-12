import { Request, Response } from 'express';
import { geminiAPIConnect } from '../utils/gemini_api_call';

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passage, numberOfQuestions } = req.body;

    // Validation
    if (!passage) {
      res.status(400).json({
        success: false,
        message: 'Passage is required'
      });
      return;
    }

    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 10) {
      res.status(400).json({
        success: false,
        message: 'Number of questions must be between 1 and 10'
      });
      return;
    }

    // Validate passage length
    if (passage.length < 50) {
      res.status(400).json({
        success: false,
        message: 'Passage must be at least 50 characters long'
      });
      return;
    }

    if (passage.length > 5000) {
      res.status(400).json({
        success: false,
        message: 'Passage must be less than 5000 characters'
      });
      return;
    }

    // Call Gemini API
    const result = await geminiAPIConnect(passage, numberOfQuestions);

    if (result.message === "Success" && result.data) {
      // Parse the response to validate JSON format
      try {
        const cleanedData = result.data.replace(/```json\n?|\n?```/g, '').trim();
        const questionsData = JSON.parse(cleanedData);
        
        // Validate that it's an array
        if (!Array.isArray(questionsData)) {
          res.status(500).json({
            success: false,
            message: 'Invalid response format from AI service'
          });
          return;
        }

        // Validate each question structure
        const validQuestions = questionsData.filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length >= 2 &&
          q.answer
        );

        if (validQuestions.length === 0) {
          res.status(500).json({
            success: false,
            message: 'No valid questions generated'
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Questions generated successfully',
          data: {
            questions: validQuestions,
            totalGenerated: validQuestions.length,
            originalPassage: passage
          }
        });

      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse AI response',
          error: 'Invalid JSON format from AI service'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to generate questions',
        error: result.error || 'Unknown error occurred'
      });
    }

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating questions'
    });
  }
};
