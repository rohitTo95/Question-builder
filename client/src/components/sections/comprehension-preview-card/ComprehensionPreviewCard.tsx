import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from 'lucide-react';

interface ComprehensionData {
  'question-id': string;
  'question-type': 'Comprehension';
  passage: string;
  question: string;
  options: string[];
  image?: string;
  points?: number;
}

interface ComprehensionPreviewCardProps {
  data: ComprehensionData;
  questionNumber: number;
  onDelete?: () => void;
  isMinimized?: boolean;
  isInteractive?: boolean;
  onAnswerUpdate?: (questionIndex: number, questionId: string, response: any, answer: any) => void;
  imageLoading?: boolean;
  onImageLoadStart?: () => void;
  onImageLoad?: () => void;
}

const ComprehensionPreviewCard: React.FC<ComprehensionPreviewCardProps> = ({ 
  data, 
  questionNumber, 
  onDelete, 
  isMinimized = false,
  isInteractive = false,
  onAnswerUpdate,
  imageLoading = false,
  onImageLoadStart,
  onImageLoad
}) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState<string>('');

  // Update parent when answer changes (for interactive mode)
  const updateAnswer = (answer: string) => {
    if (isInteractive && onAnswerUpdate) {
      onAnswerUpdate(questionNumber - 1, data['question-id'], answer, answer);
    }
  };

  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
    updateAnswer(value);
  };

  return (
    <Card className="w-full mb-6 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              Question {questionNumber}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              Comprehension
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {data.points || 10} points
            </span>
          </div>
          {!isInteractive && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="space-y-6">
          {/* Question Image */}
          {data.image && (
            <div className="mb-4 relative">
              {imageLoading && (
                <div className="w-full max-w-2xl h-64 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
              <img
                src={data.image}
                alt="Question"
                className={`w-full max-w-2xl h-64 object-cover rounded-lg border border-gray-200 transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0 absolute top-0 left-0' : 'opacity-100'
                }`}
                onLoadStart={onImageLoadStart}
                onLoad={onImageLoad}
                onError={onImageLoad}
              />
            </div>
          )}

          {/* Question Section */}
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-base font-medium text-gray-800 mb-4">
                {data.question}
              </p>
              
              <RadioGroup 
                className="space-y-3"
                value={selectedAnswer}
                onValueChange={handleAnswerChange}
              >
                {data.options.map((option: string, optionIndex: number) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`question-${questionNumber}-option-${optionIndex}`}
                      disabled={!isInteractive}
                    />
                    <Label 
                      htmlFor={`question-${questionNumber}-option-${optionIndex}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Instructions:</strong> Read the passage carefully and select the correct answer for the question.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ComprehensionPreviewCard;
