import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from 'react';
import  TextFormatingTools  from "@/components/subcomponents/text-format-toolbar/TextFormatToolbar";
import { Option } from "@/components/subcomponents/optionsList/Option";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { handleDragEnd, sensorHook } from "@/utils/dragAndDropt";
import { closestCorners, DndContext} from "@dnd-kit/core";
import { v4 as uuid } from 'uuid';
import { ImageIcon, X } from "lucide-react";

const ClozeQuestionCard = ({ questionStoreState }: { questionStoreState: any }) => {
    const [textInput, setTextInput] = useState<string>("");
    const [points, setPoints] = useState<number>(10);
    const [previewText, setPreviewText] = useState<string>("");
    const [options, setOptions] = useState<Array<{id: string, content: string}>>([]);
    const [answers, setAnswers] = useState<Array<{content: string, startIndex: number, endIndex: number}>>([]);
    const [optionInput, setOptionInput] = useState<string>("");
    const [questionImage, setQuestionImage] = useState<string | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isFormValid = () => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = textInput;
      const plainText = tempDiv.textContent || '';
      
      return plainText.trim() && options.length >= 2;
    };

    const validateForm = () => {
      const errors: string[] = [];
      
      // Check if question text exists and contains content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = textInput;
      const plainText = tempDiv.textContent || '';
      
      if (!plainText.trim()) {
        errors.push("Question text is required");
      }
      
      // Check if there are at least 2 options
      if (options.length < 2) {
        errors.push("At least 2 options are required");
      }
      
      setValidationErrors(errors);
      return errors.length === 0;
    };

    const handleAddQuestion = () => {
      if (!validateForm()) {
        return;
      }

      const questionData = {
        'question-id' :uuid(), 
        'question-type': 'Cloze',
        'question': textInput,
        'options': options.map(option => option.content),
        'answer': answers,
        'image': questionImage,
        'points': points
      };

      // Update the question store state
      questionStoreState((prevQuestions: any) => {
        if (Array.isArray(prevQuestions)) {
          return [...prevQuestions, questionData];
        } else {
          return [questionData];
        }
      });

      // Reset form after adding question
      setTextInput("");
      setPoints(10);
      setPreviewText("");
      setOptions([]);
      setAnswers([]);
      setOptionInput("");
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

    const previewFormatter = () => {
      const formatted = textInput
      .replace(/&nbsp;/g, " ")
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "")
      .replace(/<b>/g, "")
      .replace(/<\/b>/g, "")
      .replace(/<i>/g, "")
      .replace(/<\/i>/g, "")
      .replace(/<u>(.*?)<\/u>/g, (content) => "_".repeat(content.length))
      .replace(/<\/u>/g, "");
      
      setPreviewText(formatted);
    };
    
    useEffect(() => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = textInput;
        const plainText = tempDiv.textContent || '';
        
        const underlineRegex = /<u>(.*?)<\/u>/g;
        const extractedAnswers: Array<{content: string, startIndex: number, endIndex: number}> = [];
        let match;
        let searchStartIndex = 0;

        while ((match = underlineRegex.exec(textInput)) !== null) {
          const underlinedContent = match[1];
          const startIndex = plainText.indexOf(underlinedContent, searchStartIndex);
          const endIndex = startIndex + underlinedContent.length - 1;
          
          extractedAnswers.push({
            content: underlinedContent,
            startIndex: startIndex,
            endIndex: endIndex
          });
          
          searchStartIndex = endIndex + 1;
        }

      setAnswers(extractedAnswers);
      setOptions(extractedAnswers.map(answer => ({ id: uuid(), content: answer.content })));
      
      previewFormatter();
    }, [textInput]);

    // Clear validation errors when form changes
    useEffect(() => {
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    }, [textInput, options]);

  return (
    <>
    <div className="p-5 w-full flex flex-col gap-6">
    <div className="flex flex-col w-full gap-2">
      <label htmlFor="preview-input-field" className="text-xl">Preview</label>
      <Input 
        name="preview-input-field"
        id="preview-input-field"
        value={previewText}
        readOnly
        placeholder="Preview with blanks will appear here..."
        className="bg-gray-50"
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

     <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <label htmlFor="cloze-input-field" className="text-xl">Question</label>
            <Button
            onClick={()=>{
              setTextInput("");
            }}
            variant="outline"
            size="sm"
            >
            Clear
            </Button>
        </div>
        <div className="relative">
          <TextFormatingTools
          value={textInput}
          onChange={setTextInput}
        />
        </div>
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
     <div className="flex flex-col w-full">
        <h4 className="text-lg mb-3">Options</h4>
        <span>All the options are ordered one by one, but you can customize them by drag and drop</span>
        <div className="flex gap-2 my-8">
          <Input
         value={optionInput} onChange={(e)=>setOptionInput(e.target.value)}
         required
        />
        <Button className="w-[fit-content]" onClick={() => {
          if (optionInput.trim()) {
            setOptions([...options, { id: uuid(), content: optionInput.trim() }]);
            setOptionInput("");
          }
        }}>Add Option</Button></div>
         <DndContext sensors={sensorHook()} collisionDetection={closestCorners} onDragEnd={(e)=>handleDragEnd(e, options, setOptions)}>
        <div className="flex flex-col gap-4 p-5 h-[fit-content] border-2 border-dashed border-gray-400 rounded-lg">
          <SortableContext
                     items={options.map(option => option.id)}
                     strategy={verticalListSortingStrategy}
                     >
          {options.length > 0 ? 
          options.map((option)=>(
              <Option 
                key={option.id}
                id={option.id} 
                style={`flex gap-3 align-center w-full py-4 px-6 border-solid border-2 rounded-md cursor-grab ${answers.some(answer => answer.content === option.content) ? 'border-[#0f9b8d] text-[#0f9b8d]' : "border-gray-700"}`} 
                content={option.content}
              />
          )) :
         <p className="text-gray-500 text-sm">No options added yet</p>
          }
          </SortableContext>
        </div>
        </DndContext>
        
        {/* Validation Status Helper */}
        <div className="mt-3 text-sm">
          {options.length < 2 && (
            <p className="text-amber-600">
              ⚠️ Add at least {2 - options.length} more option{2 - options.length > 1 ? 's' : ''} to enable question creation
            </p>
          )}
          {options.length >= 2 && (
            <p className="text-green-600">
              ✓ {options.length} options added
            </p>
          )}
        </div>
     </div>
     
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

export default ClozeQuestionCard;
