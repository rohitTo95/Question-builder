import { useState, useRef, useEffect } from "react";
import { closestCorners, DndContext} from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import {v4 as uuid} from 'uuid';
import { Option } from "@/components/subcomponents/optionsList/Option";
import { toast } from "sonner";

import { handleDragEnd, sensorHook } from "@/utils/dragAndDropt";
export const CategorizeQuestionCard = ({ questionStoreState }: { questionStoreState: any }) => {
  const [question, setQuestion] = useState<string>("");
  const [optionInput, setOptionInput] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [options, setOptions] = useState<{ id: string; text: string; category: string }[]>(
    []
  );
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = () => {
    return question.trim() && categories.length >= 2 && options.length >= 2;
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!question.trim()) {
      errors.push("Question text is required");
    }
    
    if (categories.length < 2) {
      errors.push("At least 2 categories are required");
    }
    
    if (options.length < 2) {
      errors.push("At least 2 options are required");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddOption = () => {
    if (optionInput.trim() && selectedCategory) {
      setOptions([
        ...options,
        { 
          id: uuid(), 
          text: optionInput, 
          category: selectedCategory 
        },
      ]);
      setOptionInput("");
    }
  };

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput)) {
      setCategories([...categories, categoryInput]);
      setCategoryInput("");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setQuestionImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setQuestionImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddQuestion = () => {
    if (!validateForm()) {
      return;
    }

    const questionData = {
      'question-id' :uuid(),
      'question-type': 'Categorize',
      'question': question,
      'options': options,
      'image': questionImage
    };

    // Update the question store state
    questionStoreState((prevQuestions: any) => {
      if (Array.isArray(prevQuestions)) {
        return [...prevQuestions, questionData];
      } else {
        return [questionData];
      }
    });

    // Show success message
    toast.success("Question added successfully!");

    // Reset form after adding question
    setQuestion("");
    setOptionInput("");
    setSelectedCategory("");
    setCategoryInput("");
    setCategories([]);
    setOptions([]);
    setQuestionImage(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clear validation errors when form changes
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [question, categories, options]);

  return (
    <>
      <div className="flex flex-col w-full p-5">
        <div className="flex flex-col justify-between align-start gap-y-4 w-full">
          <label htmlFor="question_input" className="text-2xl">
            Question
          </label>
          <Input
            placeholder="Enter Your Question"
            name="question_input"
            id="question_input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        {/* Image Upload Section */}
        <div className="mt-4">
          <label className="text-lg font-medium mb-2 block">Question Image (Optional)</label>
          <div
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {questionImage ? (
              <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border-2 border-dashed border-primary/20">
                <img
                  src={questionImage}
                  alt="Question"
                  className="w-full h-full object-cover"
                />
                {isHovering && (
                  <button
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleImageClick}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ImageIcon size={20} />
                Add Question Image
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-between align-center w-full gap-8">
          <div className="w-3/6 options_field flex flex-col">
            <div className="w-full flex justify-between mb-4">
              <span>Options</span>
            </div>
            <div className="flex justify-between w-full gap-2">
              <Input
                placeholder="Enter option text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
              />
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories
                      .filter((category) => category.trim() !== "")
                      .map((category, index) => (
                        <SelectItem key={index} value={category}>
                          {category}
                        </SelectItem>
                      ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No categories available. Add a category first.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddOption}>Add</Button>
            </div>
            <div className="field_section border-2 border-dashed border-gray-300 rounded-lg p-4 mt-4 min-h-[100px]">
              <h3 className="text-sm font-medium mb-2">Options:</h3>
              <DndContext sensors={sensorHook()} collisionDetection={closestCorners} onDragEnd={(e)=>handleDragEnd(e, options, setOptions)}>
                {options.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <SortableContext
                      items={options}
                      strategy={verticalListSortingStrategy}
                    >
                      {options.map((option) => (
                        <Option 
                          key={option.id}
                          id={option.id} 
                          content={`${option.text} (${option.category})`} 
                          style="touch-action-none flex align-center gap-2 px-3 py-1 bg-green-100 text-green-800 w-full text-md cursor-grab" 
                        />
                      ))}
                    </SortableContext>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No options added yet</p>
                )}
              </DndContext>
            </div>
          </div>
          <div className="category_field w-3/6">
            <div className="w-full flex justify-between mb-4">
              <span>Category</span>
            </div>
            <div className="flex justify-between w-full gap-2">
              <Input
                placeholder="Enter category name"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
              />
              <Button onClick={handleAddCategory}>Add</Button>
            </div>
            <div className="field_section border-2 border-dashed border-gray-300 rounded-lg p-4 mt-4 min-h-[100px]">
              <h3 className="text-sm font-medium mb-2">Categories:</h3>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No categories added yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <h5 className="text-red-800 font-medium mb-2">Please fix the following errors:</h5>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Status Helper */}
        <div className="mt-3 text-sm">
          {!question.trim() && (
            <p className="text-amber-600">
              ⚠️ Enter a question to continue
            </p>
          )}
          {question.trim() && categories.length < 2 && (
            <p className="text-amber-600">
              ⚠️ Add at least {2 - categories.length} more categor{2 - categories.length > 1 ? 'ies' : 'y'} to continue
            </p>
          )}
          {question.trim() && categories.length >= 2 && options.length < 2 && (
            <p className="text-amber-600">
              ⚠️ Add at least {2 - options.length} more option{2 - options.length > 1 ? 's' : ''} to enable question creation
            </p>
          )}
          {question.trim() && categories.length >= 2 && options.length >= 2 && (
            <p className="text-green-600">
              ✓ Question ready: {categories.length} categories, {options.length} options
            </p>
          )}
        </div>

        <Button 
          className="w-[fit-content] mt-6" 
          onClick={handleAddQuestion}
          disabled={!isFormValid()}
        >
          Add Question
        </Button>
      </div>
    </>
  );
};
