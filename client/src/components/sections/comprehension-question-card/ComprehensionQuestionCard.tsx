import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Check, ImageIcon, X } from 'lucide-react';
import { apiPost } from "@/utils/api";
import {v4 as uuid} from 'uuid';
const ComprehensionQuestionCard = ({ questionStoreState }: { questionStoreState: any }) => {
  const [passage, setPassage] = useState<string>("");
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(1);
  const [points, setPoints] = useState<number>(10);
  const [question, setQuestion] = useState<any>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = () => {
    return passage.trim() && selectedQuestions.size > 0;
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!passage.trim()) {
      errors.push("Passage text is required");
    }
    
    if (selectedQuestions.size === 0) {
      errors.push("At least one question must be selected");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleQuestionSelect = (questionIndex: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionIndex)) {
      newSelected.delete(questionIndex);
    } else {
      newSelected.add(questionIndex);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === question.length) {
      // If all are selected, deselect all
      setSelectedQuestions(new Set());
    } else {
      // Select all questions
      setSelectedQuestions(new Set(question.map((_, index) => index)));
    }
  };

  const getFinalQuestions = () => {
    return question.filter((_, index) => selectedQuestions.has(index));
  };

  const handleAddQuestion = () => {
    if (!validateForm()) {
      return;
    }

    const finalQuestions = getFinalQuestions();

    // Create individual question objects instead of grouping them
    const individualQuestions = finalQuestions.map((q: any) => ({
      'question-id' :uuid(),
      'question-type': 'Comprehension',
      'passage': passage,
      'question': q.question,
      'options': q.options,
      'image': questionImage,
      'answer': q.answer || "",
      'points': points
    }));

    // Update the question store state with individual questions
    questionStoreState((prevQuestions: any) => {
      if (Array.isArray(prevQuestions)) {
        return [...prevQuestions, ...individualQuestions];
      } else {
        return individualQuestions;
      }
    });

    // Reset form after adding question
    setPassage("");
    setNumberOfQuestions(1);
    setPoints(10);
    setQuestion([]);
    setSelectedQuestions(new Set());
    setSelectedOption("");
    setQuestionImage(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const generateBtn = async () => {
    setIsLoading(true);
    try {
      const response = await apiPost('/api/ai/generate-questions', {
        passage: passage,
        numberOfQuestions: numberOfQuestions
      });

      const result = await response.json();
      
      if (result.success && result.data && result.data.questions) {
        setQuestion(result.data.questions);
        // Reset selected questions when new questions are generated
        setSelectedQuestions(new Set());
      } else {
        console.error("Failed to generate questions:", result.message);
        setQuestion([]);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      setQuestion([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear validation errors when form changes
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [passage, selectedQuestions]);

  return (
    <>
      <div className="flex flex-col w-full p-5 gap-5">
        <div className="flex flex-col justify-between align-start gap-y-4 w-full">
          <label htmlFor="question_input" className="text-xl">
            Enter Your Passage
          </label>
          <Textarea
            placeholder="Enter your comprehension passage"
            name="passage_input"
            id="passage_input"
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            className="resize-none h-1/3"
            required
          />
        </div>

        {/* Points Input */}
        <div className="flex flex-col w-full gap-2">
          <label htmlFor="points-input-field" className="text-xl">Points</label>
          <Input 
            name="points-input-field"
            id="points-input-field"
            type="number"
            min="1"
            max="100"
            value={points}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= 100) {
                setPoints(value);
              }
            }}
            placeholder="Enter points (1-100)"
            className="w-32"
          />
        </div>

        {/* Image Upload Section */}
        <div>
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

        <div className="flex flex-col justify-between align-start gap-y-4 w-full">
          <label htmlFor="question_input" className="text-xl">
            Number of questions you want
          </label>
            <Input
            type="number"
            value={numberOfQuestions}
            placeholder="1-10"
            min="1"
            max="10"
            onChange={(e) => {
              const value = parseInt(e.target.value)
              setNumberOfQuestions(value);
            }}
            />
        </div>
        <Button onClick={generateBtn} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Start AI Magic"
          )}
        </Button>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="text-red-800 font-medium mb-2">Please fix the following errors:</h5>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col w-full gap-3 mt-12">
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl">Questions</span>
              {question.length > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {selectedQuestions.size} of {question.length} selected
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedQuestions.size === question.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              )}
            </div>
            <div className="p-5 mt-8 flex flex-col gap-y-4">
              {question.length > 0 ? (
                question.map((q: any, index: number) => (
                  <div key={index} className="relative p-5 flex flex-col shadow-[2px_3px_14px_-7px_hsl(var(--accent))] rounded-lg">
                    <div 
                      className="absolute top-4 right-4 cursor-pointer"
                      onClick={() => handleQuestionSelect(index)}
                    >
                      <div className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300 ease-in-out
                        ${selectedQuestions.has(index) 
                          ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] scale-110' 
                          : 'border-gray-300 hover:border-blue-400 hover:scale-105'
                        }
                      `}>
                        <Check 
                          className={`
                            w-4 h-4 text-white transition-all duration-200 ease-in-out
                            ${selectedQuestions.has(index) 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 scale-50'
                            }
                          `} 
                        />
                      </div>
                    </div>
                    
                    <p className="mt-4 mb-6 text-lg font-medium pr-10">{q.question}</p>
                    <RadioGroup
                      value={selectedOption}
                      onValueChange={setSelectedOption}
                      className="flex flex-col p-5 gap-2 text-md"
                    >
                      {q.options?.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={`q${index}-option${optionIndex}`} id={`q${index}-r${optionIndex}`} />
                          <Label htmlFor={`q${index}-r${optionIndex}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))
              ) : (
                <div className="p-5 flex flex-col items-center justify-center text-gray-500">
                  <p>No questions generated yet. Enter a passage and click "Start AI Magic" to generate questions.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Status Helper */}
        <div className="mt-3 text-sm">
          {!passage.trim() && (
            <p className="text-amber-600">
              ⚠️ Enter a passage to generate questions
            </p>
          )}
          {passage.trim() && question.length === 0 && (
            <p className="text-blue-600">
              💡 Click "Start AI Magic" to generate questions
            </p>
          )}
          {passage.trim() && question.length > 0 && selectedQuestions.size === 0 && (
            <p className="text-amber-600">
              ⚠️ Select at least one question to add
            </p>
          )}
          {passage.trim() && selectedQuestions.size > 0 && (
            <p className="text-green-600">
              ✓ Ready to add {selectedQuestions.size} question{selectedQuestions.size > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Add Question Button - Show when questions exist */}
        {question.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button 
              className="w-[fit-content]" 
              onClick={handleAddQuestion}
              disabled={!isFormValid()}
              size="lg"
            >
              Add {selectedQuestions.size} Selected Question{selectedQuestions.size > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
export default ComprehensionQuestionCard;
