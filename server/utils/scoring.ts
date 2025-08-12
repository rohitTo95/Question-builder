// Server-side scoring utility functions

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
 */
export const scoreCategorizeQuestion = (question: Question, response: any): ScoringResult => {
  const maxPoints = question.points || 10;
  
  console.log('=== CATEGORIZE SCORING DEBUG ===');
  console.log('Question:', question['question-id']);
  console.log('Max points:', maxPoints);
  console.log('Response:', response);
  console.log('Question options:', question.options);
  
  if (!response || !question.options) {
    console.log('Missing response or options data');
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
    
    console.log(`Category "${category}": correct items=${correctItems.length}, response items=${responseItems.length}`);
    
    // Count correct placements in this category by comparing text and category
    correctItems.forEach(correctItem => {
      const isCorrectlyPlaced = responseItems.some((responseItem: any) => {
        const match = responseItem.text === correctItem.text && responseItem.category === category;
        console.log(`  Comparing: response="${responseItem.text}" (cat:${responseItem.category}) vs correct="${correctItem.text}" (cat:${correctItem.category}) = ${match}`);
        return match;
      });
      
      if (isCorrectlyPlaced) {
        correctPlacements++;
        console.log(`✓ Correct placement: "${correctItem.text}" in category "${category}"`);
      } else {
        console.log(`✗ Missing: "${correctItem.text}" should be in category "${category}"`);
      }
    });
  });

  const earnedPoints = totalPlacements > 0 ? Math.round((correctPlacements / totalPlacements) * maxPoints) : 0;
  const isCorrect = correctPlacements === totalPlacements;

  console.log(`Final score: ${correctPlacements}/${totalPlacements} = ${earnedPoints}/${maxPoints} points`);
  console.log('=== END CATEGORIZE SCORING DEBUG ===');

  return {
    questionId: question['question-id'],
    earnedPoints,
    maxPoints,
    isCorrect
  };
};

/**
 * Calculate score for a Cloze question
 */
export const scoreClozeQuestion = (question: Question, response: any): ScoringResult => {
  const maxPoints = question.points || 10;
  
  console.log('=== CLOZE SCORING DEBUG ===');
  console.log('Question:', question['question-id']);
  console.log('Max points:', maxPoints);
  console.log('Response:', response);
  console.log('Correct answers:', question.answer);
  
  if (!response || !question.answer) {
    console.log('Missing response or answer data');
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
  
  // Sort correct answers by their start index to match with blank order
  const sortedCorrectAnswers = [...correctAnswers].sort((a, b) => a.startIndex - b.startIndex);
  console.log('Sorted correct answers:', sortedCorrectAnswers);
  
  blanks.forEach((blankId) => {
    const userAnswer = response[blankId];
    
    // Extract blank index from blankId (e.g., "blank-0" -> 0)
    const blankIndexMatch = blankId.match(/blank-(\d+)/);
    if (blankIndexMatch) {
      const blankIndex = parseInt(blankIndexMatch[1]);
      const correctAnswer = sortedCorrectAnswers[blankIndex]?.content;
      
      console.log(`Blank ${blankId} (index ${blankIndex}): user="${userAnswer}" vs correct="${correctAnswer}"`);
      
      if (userAnswer && correctAnswer && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
        correctCount++;
        console.log(`✓ Correct match for ${blankId}`);
      } else {
        console.log(`✗ Incorrect for ${blankId}`);
      }
    }
  });

  const totalBlanks = correctAnswers.length;
  const earnedPoints = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * maxPoints) : 0;
  const isCorrect = correctCount === totalBlanks && totalBlanks > 0;

  console.log(`Final score: ${correctCount}/${totalBlanks} = ${earnedPoints}/${maxPoints} points`);
  console.log('=== END CLOZE SCORING DEBUG ===');

  return {
    questionId: question['question-id'],
    earnedPoints,
    maxPoints,
    isCorrect
  };
};

/**
 * Calculate score for a Comprehension question
 */
export const scoreComprehensionQuestion = (question: Question, response: any): ScoringResult => {
  const maxPoints = question.points || 10;
  
  console.log('=== COMPREHENSION SCORING DEBUG ===');
  console.log('Question:', question['question-id']);
  console.log('Max points:', maxPoints);
  console.log('Response:', response);
  console.log('Correct answer:', question.answer);
  
  if (!response || !question.answer) {
    console.log('Missing response or answer data');
    return {
      questionId: question['question-id'],
      earnedPoints: 0,
      maxPoints,
      isCorrect: false
    };
  }

  const isCorrect = response === question.answer;
  const earnedPoints = isCorrect ? maxPoints : 0;

  console.log(`Answer comparison: "${response}" === "${question.answer}" = ${isCorrect}`);
  console.log(`Final score: ${earnedPoints}/${maxPoints} points`);
  console.log('=== END COMPREHENSION SCORING DEBUG ===');

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
  totalScore: number;
  maxPossibleScore: number;
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

  const totalScore = results.reduce((sum, result) => sum + result.earnedPoints, 0);
  const maxPossibleScore = results.reduce((sum, result) => sum + result.maxPoints, 0);
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    results
  };
};
