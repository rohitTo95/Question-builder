import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Trash2, Loader2 } from 'lucide-react';

interface ClozeAnswer {
  content: string;
  startIndex: number;
  endIndex: number;
}

interface ClozeData {
  'question-id': string;
  'question-type': 'Cloze';
  question: string;
  options: string[];
  answer: ClozeAnswer[];
  image?: string;
  points?: number;
}

interface ClozePreviewCardProps {
  data: ClozeData;
  questionNumber: number;
  onDelete?: () => void;
  isMinimized?: boolean;
  isInteractive?: boolean;
  onAnswerUpdate?: (questionIndex: number, questionId: string, response: any, answer: any) => void;
  imageLoading?: boolean;
  onImageLoadStart?: () => void;
  onImageLoad?: () => void;
}

interface TextSegment {
  type: 'text' | 'blank';
  content: string;
  id?: string;
}

// Draggable Option Component
const DraggableOption: React.FC<{ id: string; content: string; isUsed: boolean }> = ({ id, content, isUsed }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id,
    disabled: isUsed 
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  if (isUsed) {
    return (
      <div className="px-4 py-2 bg-gray-200 border-2 border-gray-300 rounded-lg opacity-50">
        <span className="text-gray-500 font-medium">{content}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`px-4 py-2 bg-white border-2 border-blue-300 rounded-lg shadow-sm cursor-grab hover:shadow-md transition-shadow duration-200 ${
        isDragging ? 'opacity-0' : ''
      }`}
    >
      <span className="text-gray-800 font-medium">{content}</span>
    </div>
  );
};

// Droppable Blank Component
const DroppableBlank: React.FC<{ 
  id: string; 
  originalContent: string; 
  droppedContent: string | null;
  onRemove: (blankId: string) => void;
}> = ({ id, originalContent, droppedContent, onRemove }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const minWidth = Math.max(originalContent.length, 5) * 0.6 + 1.5;

  const handleDoubleClick = () => {
    if (droppedContent) {
      onRemove(id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`inline-block min-w-[${minWidth}em] h-10 mx-1 px-2 rounded-md border-2 border-dashed transition-colors ${
        isOver 
          ? 'bg-blue-100 border-blue-400' 
          : droppedContent 
            ? 'bg-green-100 border-green-400 cursor-pointer' 
            : 'bg-gray-100 border-gray-300'
      }`}
      style={{ minWidth: `${minWidth}em` }}
      onDoubleClick={handleDoubleClick}
      title={droppedContent ? "Double-click to remove" : "Drop an option here"}
    >
      <div className="flex items-center justify-center h-full">
        {droppedContent ? (
          <span className="text-gray-800 font-medium text-sm">{droppedContent}</span>
        ) : (
          <span className="text-gray-400 text-xs">Drop here</span>
        )}
      </div>
    </div>
  );
};

const ClozePreviewCard: React.FC<ClozePreviewCardProps> = ({ 
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
  const [droppedItems, setDroppedItems] = useState<{[key: string]: string}>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update parent when answer changes (for interactive mode)
  const updateAnswer = (newDroppedItems: {[key: string]: string}) => {
    if (isInteractive && onAnswerUpdate) {
      onAnswerUpdate(questionNumber - 1, data['question-id'], newDroppedItems, newDroppedItems);
    }
  };

  // Parse HTML and create text segments with blanks
  const parseQuestionText = (): TextSegment[] => {
    let blankCounter = 0;
    const segments: TextSegment[] = [];
    
    // Clean HTML and process
    let processedText = data.question
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '')
      .replace(/<b>/g, '<strong>')
      .replace(/<\/b>/g, '</strong>')
      .replace(/<i>/g, '<em>')
      .replace(/<\/i>/g, '</em>');

    // Split by underlined content
    const parts = processedText.split(/<u>(.*?)<\/u>/);
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          segments.push({
            type: 'text',
            content: parts[i]
          });
        }
      } else {
        // Blank (previously underlined content)
        segments.push({
          type: 'blank',
          content: parts[i],
          id: `blank-${blankCounter++}`
        });
      }
    }
    
    return segments;
  };

  const segments = parseQuestionText();

  // Get used options
  const usedOptions = Object.values(droppedItems);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedOption = active.id as string;
    const targetBlank = over.id as string;

    if (targetBlank.startsWith('blank-')) {
      // Remove the option from any previous blank
      const newDroppedItems = { ...droppedItems };
      
      // Remove from previous location
      Object.keys(newDroppedItems).forEach(key => {
        if (newDroppedItems[key] === draggedOption) {
          delete newDroppedItems[key];
        }
      });

      // Add to new location
      newDroppedItems[targetBlank] = draggedOption;
      setDroppedItems(newDroppedItems);
      updateAnswer(newDroppedItems);
    }
  };

  const removeFromBlank = (blankId: string) => {
    const newDroppedItems = { ...droppedItems };
    delete newDroppedItems[blankId];
    setDroppedItems(newDroppedItems);
  };

  const renderTextSegment = (segment: TextSegment, index: number) => {
    if (segment.type === 'text') {
      return (
        <span 
          key={index} 
          dangerouslySetInnerHTML={{ __html: segment.content }}
        />
      );
    } else {
      return (
        <DroppableBlank
          key={segment.id!}
          id={segment.id!}
          originalContent={segment.content}
          droppedContent={droppedItems[segment.id!] || null}
          onRemove={removeFromBlank}
        />
      );
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Card className="w-full mb-6 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Question {questionNumber}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                Cloze
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
            {/* Question with blanks */}
            <div className="space-y-2">
              <h4 className="text-lg font-medium text-gray-700">Fill in the blanks</h4>
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="text-lg leading-relaxed text-gray-800">
                  {segments.map((segment, index) => renderTextSegment(segment, index))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Drag the options from below to fill in the blanks above.
              </p>
            </div>

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

            {/* Options Section */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-700">Options</h4>
              <div className="flex flex-wrap gap-3 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300 min-h-[80px]">
                {data.options.map((option, index) => (
                  <DraggableOption
                    key={`option-${index}`}
                    id={option}
                    content={option}
                    isUsed={usedOptions.includes(option)}
                  />
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Instructions:</strong> Drag the words from the options area and drop them into the blanks in the passage above. Double-click filled blanks to remove options.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <DragOverlay>
        {activeId ? (
          <div className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg shadow-lg">
            <span className="text-gray-800 font-medium">{activeId}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ClozePreviewCard;
