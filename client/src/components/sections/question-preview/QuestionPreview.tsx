import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import CategorizePreviewCard from '../categorize-preview-card/Categorize-preview-card';
import ClozePreviewCard from '../cloze-preview-card/ClozePreviewCard';
import ComprehensionPreviewCard from '../comprehension-preview-card/ComprehensionPreviewCard';

interface QuestionPreviewProps {
  questions: any[];
  questionOrder: number[];
  onDeleteQuestion: (index: number) => void;
  onReorderQuestions: (newOrder: number[]) => void;
}

// Sortable wrapper component for each question
const SortableQuestionItem: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-[-40px] top-[5%] transform -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-gray-100 rounded-md hover:bg-gray-200"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-gray-500" />
      </div>
      {children}
    </div>
  );
};

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ 
  questions, 
  questionOrder, 
  onDeleteQuestion, 
  onReorderQuestions 
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-500 text-lg">
          Please use the builder and add questions to see the preview
        </p>
      </div>
    );
  }

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questionOrder.findIndex(id => id.toString() === active.id);
      const newIndex = questionOrder.findIndex(id => id.toString() === over.id);
      
      const newOrder = [...questionOrder];
      const [reorderedItem] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, reorderedItem);
      
      onReorderQuestions(newOrder);
    }
  };

  const renderQuestionCard = (questionIndex: number, displayNumber: number) => {
    const question = questions[questionIndex];

    switch (question['question-type']) {
      case 'Categorize':
        return (
          <CategorizePreviewCard
            data={question}
            questionNumber={displayNumber}
            onDelete={() => onDeleteQuestion(questionIndex)}
            isMinimized={isDragging}
          />
        );
      
      case 'Cloze':
        return (
          <ClozePreviewCard
            data={question}
            questionNumber={displayNumber}
            onDelete={() => onDeleteQuestion(questionIndex)}
            isMinimized={isDragging}
          />
        );
      
      case 'Comprehension':
        return (
          <ComprehensionPreviewCard
            data={question}
            questionNumber={displayNumber}
            onDelete={() => onDeleteQuestion(questionIndex)}
            isMinimized={isDragging}
          />
        );
      
      default:
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-lg">Unknown question type</p>
          </div>
        );
    }
  };

  // Create the items array for SortableContext (only main questions, not sub-questions)
  const sortableItems = questionOrder.map(index => index.toString());

  return (
    <DndContext 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-6 ml-12 relative">
          {questionOrder.map((questionIndex, displayIndex) => {
            const question = questions[questionIndex];
            if (!question) return null;
            
            const questionId = questionIndex.toString();
            const currentQuestionNumber = displayIndex + 1;
            
            return (
              <SortableQuestionItem key={questionId} id={questionId}>
                {renderQuestionCard(questionIndex, currentQuestionNumber)}
              </SortableQuestionItem>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default QuestionPreview;
