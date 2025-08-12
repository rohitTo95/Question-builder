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
  points?: number;
}

interface PreviewQuestionCardProps {
  question: Question;
  questionIndex: number;
  onAnswerUpdate: (questionIndex: number, questionId: string, response: any, answer: any) => void;
  isInteractive?: boolean;
  imageLoading?: { [key: string]: boolean };
  onImageLoadStart?: (imageKey: string) => void;
  onImageLoad?: (imageKey: string) => void;
}

export const PreviewQuestionCard: React.FC<PreviewQuestionCardProps> = ({ 
  question, 
  questionIndex, 
  onAnswerUpdate, 
  isInteractive = false,
  imageLoading = {},
  onImageLoadStart,
  onImageLoad
}) => {
  const questionNumber = questionIndex + 1;
  const imageKey = `question-${question['question-id']}`;

  switch (question['question-type']) {
    case 'Categorize':
      return (
        <CategorizePreviewCard
          data={question as any}
          questionNumber={questionNumber}
          isInteractive={isInteractive}
          onAnswerUpdate={onAnswerUpdate}
          isMinimized={false}
          imageLoading={imageLoading[imageKey]}
          onImageLoadStart={() => onImageLoadStart?.(imageKey)}
          onImageLoad={() => onImageLoad?.(imageKey)}
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
          imageLoading={imageLoading[imageKey]}
          onImageLoadStart={() => onImageLoadStart?.(imageKey)}
          onImageLoad={() => onImageLoad?.(imageKey)}
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
          imageLoading={imageLoading[imageKey]}
          onImageLoadStart={() => onImageLoadStart?.(imageKey)}
          onImageLoad={() => onImageLoad?.(imageKey)}
        />
      );

    default:
      return <div>Unknown question type: {question['question-type']}</div>;
  }
};

export default PreviewQuestionCard;
