// Scoring utility functions for different question types

export interface Question {
  'question-id': string;
  'question-type': 'Categorize' | 'Cloze' | 'Comprehension';
  question: string;
  options: any[];
  answer?: any;
  passage?: string;
  points?: number;
}

export interface QuestionResponse {
  questionId: string;
  response: any;
  answer: any;
}

export interface ScoringResult {
  questionId: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

/**
 * Calculate score for a Categorize question
 * Question.options format: [{ id, text, category }]
 * Response format: { category: [{ id, text, category }] }
 */
export const scoreCategorizeQuestion = (question: Question, response: any): ScoringResult => {
  const maxPoints = question.points || 10;
  
  if (!response || !question.options) {
    return {
      questionId: question['question-id'],
      earnedPoints: 0,
      maxPoints,
      isCorrect: false
    };
  }

  // Calculate partial scoring based on correct placements
  const categories = [...new Set(question.options.map((option: any) => option.category))];
  let correctPlacements = 0;
  let totalPlacements = 0;

  categories.forEach(category => {
    const correctItems = question.options.filter((option: any) => option.category === category);
    const responseItems = response[category] || [];
    
    totalPlacements += correctItems.length;
    
    // Count correct placements in this category by comparing text and category
    correctItems.forEach(correctItem => {
      const isCorrectlyPlaced = responseItems.some((responseItem: any) => {
        return responseItem.text === correctItem.text && responseItem.category === category;
      });
      
      if (isCorrectlyPlaced) {
        correctPlacements++;
      }
    });
  });

  const earnedPoints = totalPlacements > 0 ? Math.round((correctPlacements / totalPlacements) * maxPoints) : 0;
  const isCorrect = correctPlacements === totalPlacements;

  return {
    questionId: question['question-id'],
    earnedPoints,
    maxPoints,
    isCorrect
  };
};

/**
 * Calculate score for a Cloze question
 * Answer format: [{ content: string, startIndex: number, endIndex: number }]
 * Response format: { blankId: selectedOption }
 */
export const scoreClozeQuestion = (question: Question, response: any): ScoringResult => {
  const maxPoints = question.points || 10;
  
  if (!response || !question.answer) {
    return {
      questionId: question['question-id'],
      earnedPoints: 0,
      maxPoints,
      isCorrect: false
    };
  }

  const correctAnswers = question.answer as Array<{ content: string; startIndex: number; endIndex: number }>;
  const blanks = Object.keys(response);
  
  let correctCount = 0;
  
  blanks.forEach((blankId, index) => {
    const userAnswer = response[blankId];
    const correctAnswer = correctAnswers[index]?.content;
    
    if (userAnswer && correctAnswer && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
      correctCount++;
    }
  });

  const earnedPoints = blanks.length > 0 ? Math.round((correctCount / blanks.length) * maxPoints) : 0;
  const isCorrect = correctCount === blanks.length && blanks.length > 0;

  return {
    questionId: question['question-id'],
    earnedPoints,
    maxPoints,
    isCorrect
  };
};

/**
 * Calculate score for a Comprehension question
 * Answer format: string (correct option)
 * Response format: string (selected option)
 */
export const scoreComprehensionQuestion = (question: Question, response: any): ScoringResult => {
  const maxPoints = question.points || 10;
  
  if (!response || !question.answer) {
    return {
      questionId: question['question-id'],
      earnedPoints: 0,
      maxPoints,
      isCorrect: false
    };
  }

  const isCorrect = response === question.answer;
  const earnedPoints = isCorrect ? maxPoints : 0;

  return {
    questionId: question['question-id'],
    earnedPoints,
    maxPoints,
    isCorrect
  };
};

/**
 * Calculate total score for all questions
 */
export const calculateTotalScore = (questions: Question[], responses: QuestionResponse[]): {
  totalEarned: number;
  totalMax: number;
  percentage: number;
  results: ScoringResult[];
} => {
  const results: ScoringResult[] = [];
  
  questions.forEach(question => {
    const response = responses.find(r => r.questionId === question['question-id']);
    
    if (!response) {
      results.push({
        questionId: question['question-id'],
        earnedPoints: 0,
        maxPoints: question.points || 10,
        isCorrect: false
      });
      return;
    }

    let result: ScoringResult;
    
    switch (question['question-type']) {
      case 'Categorize':
        result = scoreCategorizeQuestion(question, response.response);
        break;
      case 'Cloze':
        result = scoreClozeQuestion(question, response.response);
        break;
      case 'Comprehension':
        result = scoreComprehensionQuestion(question, response.response);
        break;
      default:
        result = {
          questionId: question['question-id'],
          earnedPoints: 0,
          maxPoints: question.points || 10,
          isCorrect: false
        };
    }
    
    results.push(result);
  });

  const totalEarned = results.reduce((sum, result) => sum + result.earnedPoints, 0);
  const totalMax = results.reduce((sum, result) => sum + result.maxPoints, 0);
  const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  return {
    totalEarned,
    totalMax,
    percentage,
    results
  };
};
