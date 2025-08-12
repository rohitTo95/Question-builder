import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface Option {
  id: string;
  text: string;
  category: string;
}

interface CategorizeData {
  'question-id': string;
  'question-type': 'Categorize';
  question: string;
  options: Option[];
  image?: string;
}

interface CategorizePreviewCardProps {
  data: CategorizeData;
  questionNumber: number;
  onDelete?: () => void;
  isMinimized?: boolean;
  isInteractive?: boolean;
  onAnswerUpdate?: (questionIndex: number, questionId: string, response: any, answer: any) => void;
}

// Draggable Option Component
const DraggableOption: React.FC<{ option: Option; isPlaced: boolean }> = ({ option, isPlaced }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: option.id,
    data: { option }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (isPlaced) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm cursor-grab hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <span className="text-gray-800 font-medium">{option.text}</span>
    </div>
  );
};

// Droppable Category Component
const DroppableCategory: React.FC<{ 
  category: string; 
  placedOptions: Option[];
  onRemoveOption: (optionId: string) => void;
}> = ({ category, placedOptions, onRemoveOption }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: category,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-6 border-2 border-dashed rounded-lg min-h-[120px] transition-colors duration-200 ${
        isOver 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="text-center mb-4">
        <h5 className="text-lg font-semibold text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm border">
          {category}
        </h5>
      </div>
      
      <div className="space-y-2 min-h-[60px]">
        {placedOptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm text-gray-500 italic">
              Drop options here
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {placedOptions.map((option) => (
              <div
                key={option.id}
                className="px-3 py-2 bg-white border-2 border-blue-300 rounded-lg shadow-sm flex items-center gap-2 group"
              >
                <span className="text-gray-800 font-medium text-sm">{option.text}</span>
                <button
                  onClick={() => onRemoveOption(option.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CategorizePreviewCard: React.FC<CategorizePreviewCardProps> = ({ 
  data, 
  questionNumber, 
  onDelete, 
  isMinimized = false, 
  isInteractive = false,
  onAnswerUpdate 
}) => {
  // Extract unique categories from options
  const categories = [...new Set(data.options.map(option => option.category))];
  
  // State to track placed options in categories
  const [placedOptions, setPlacedOptions] = useState<{ [category: string]: Option[] }>({});
  const [draggedOption, setDraggedOption] = useState<Option | null>(null);

  // Update parent when answer changes (for interactive mode)
  const updateAnswer = (newPlacedOptions: { [category: string]: Option[] }) => {
    if (isInteractive && onAnswerUpdate) {
      // Create answer format: category -> array of option IDs
      const answer = Object.keys(newPlacedOptions).reduce((acc, category) => {
        acc[category] = newPlacedOptions[category].map(opt => opt.id);
        return acc;
      }, {} as { [key: string]: string[] });
      
      onAnswerUpdate(questionNumber - 1, data['question-id'], newPlacedOptions, answer);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const option = event.active.data.current?.option;
    setDraggedOption(option || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedOption(null);

    if (!over) return;

    const option = active.data.current?.option;
    const targetCategory = over.id as string;

    if (option && categories.includes(targetCategory)) {
      const newPlacedOptions = {
        ...placedOptions,
        [targetCategory]: [...(placedOptions[targetCategory] || []), option]
      };
      setPlacedOptions(newPlacedOptions);
      updateAnswer(newPlacedOptions);
    }
  };

  const handleRemoveOption = (optionId: string) => {
    const newPlacedOptions = { ...placedOptions };
    Object.keys(newPlacedOptions).forEach(category => {
      newPlacedOptions[category] = newPlacedOptions[category].filter(opt => opt.id !== optionId);
    });
    setPlacedOptions(newPlacedOptions);
    updateAnswer(newPlacedOptions);
  };

  // Get options that haven't been placed yet
  const getAvailableOptions = () => {
    const placedOptionIds = Object.values(placedOptions).flat().map(opt => opt.id);
    return data.options.filter(opt => !placedOptionIds.includes(opt.id));
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Card className="w-full mb-6 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Question {questionNumber}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                Categorize
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
              <div className="mb-4">
                <img
                  src={data.image}
                  alt="Question"
                  className="w-full max-w-2xl h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* Question */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {data.question}
              </h3>
              <p className="text-sm text-gray-600">
                Drag and drop the options into the correct categories below.
              </p>
            </div>

            {/* Options Section */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-700">Options</h4>
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[80px]">
                {getAvailableOptions().map((option) => (
                  <DraggableOption
                    key={option.id}
                    option={option}
                    isPlaced={false}
                  />
                ))}
                {getAvailableOptions().length === 0 && (
                  <div className="w-full flex items-center justify-center py-4">
                    <p className="text-gray-500 italic">All options have been placed in categories</p>
                  </div>
                )}
              </div>
            </div>

            {/* Categories Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-700">Categories</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <DroppableCategory
                    key={category}
                    category={category}
                    placedOptions={placedOptions[category] || []}
                    onRemoveOption={handleRemoveOption}
                  />
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Drag each option from the options area above and drop it into the correct category box below. You can remove placed options by clicking the × button.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedOption ? (
          <div className="px-4 py-2 bg-white border-2 border-blue-400 rounded-lg shadow-lg flex items-center gap-2 opacity-90">
            <span className="text-gray-800 font-medium">{draggedOption.text}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CategorizePreviewCard;