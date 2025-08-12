import React from 'react';
import CategorizePreviewCard from '@/components/sections/categorize-preview-card/Categorize-preview-card';
import ClozePreviewCard from '@/components/sections/cloze-preview-card/ClozePreviewCard';
import ComprehensionPreviewCard from '@/components/sections/comprehension-preview-card/ComprehensionPreviewCard';

interface Question {
  'question-id': string;
  'question-type': 'Categorize' | 'Cloze' | 'Comprehension';
  question: string;
  image?: string | null;
  options: any[];
  answer?: any;
  passage?: string;
}

interface PreviewQuestionCardProps {
  question: Question;
  questionIndex: number;
  onAnswerUpdate: (questionIndex: number, questionId: string, response: any, answer: any) => void;
  isInteractive?: boolean;
}

export const PreviewQuestionCard: React.FC<PreviewQuestionCardProps> = ({ 
  question, 
  questionIndex, 
  onAnswerUpdate, 
  isInteractive = false 
}) => {
  const questionNumber = questionIndex + 1;

  switch (question['question-type']) {
    case 'Categorize':
      return (
        <CategorizePreviewCard
          data={question as any}
          questionNumber={questionNumber}
          isInteractive={isInteractive}
          onAnswerUpdate={onAnswerUpdate}
          isMinimized={false}
        />
      );

    case 'Cloze':
      return (
        <ClozePreviewCard
          data={question as any}
          questionNumber={questionNumber}
          isInteractive={isInteractive}
          onAnswerUpdate={onAnswerUpdate}
          isMinimized={false}
        />
      );

    case 'Comprehension':
      return (
        <ComprehensionPreviewCard
          data={question as any}
          questionNumber={questionNumber}
          isInteractive={isInteractive}
          onAnswerUpdate={onAnswerUpdate}
          isMinimized={false}
        />
      );

    default:
      return <div>Unknown question type: {question['question-type']}</div>;
  }
};

export default PreviewQuestionCard;
