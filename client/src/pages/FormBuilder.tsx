import React, { useState, useEffect,useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, X, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formService, type FormData } from '@/services/formService';

import ComprehensionQuestionCard  from '@/components/sections/comprehension-question-card/ComprehensionQuestionCard'
import {CategorizeQuestionCard} from "@/components/sections/categorize-question-card/CategorizeQuestionCard"
import ClozeQuestionCard from "@/components/sections/cloze-question-card/ClozeQuestionCard"
import QuestionPreview from "@/components/sections/question-preview/QuestionPreview"
const FormBuilder = () => {
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [activeQuestionType, setActiveQuestionType] = useState<string>("Categorize");
  const [isHovering, setIsHovering] = useState(false);
  const [isFormLive, setIsFormLive] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formId, setFormId] = useState<string>('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [questionSet, setQuestionset] = useState<any>([]);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  
  // Form Header with proper structure
  const [formHeader, setFormHeader] = useState({
    type: "formHeader",
    title: "Untitled Form",
    headerImg: null as string | null,
    description: ""
  });
  
 
  const [form, setForm] = useState<any>([]);


  useEffect(() => {
    const updatedForm = [
      { header: formHeader },
      { questions: questionSet }
    ];
    setForm(updatedForm);
    console.log("Complete Form Updated:", updatedForm);
  }, [formHeader, questionSet]);
  
  const handleDeleteQuestion = (index: number) => {
    setQuestionset((prev: any[]) => prev.filter((_, i) => i !== index));
    setQuestionOrder((prev: number[]) => prev.filter(orderIndex => orderIndex !== index).map(orderIndex => orderIndex > index ? orderIndex - 1 : orderIndex));
  };

  const handleReorderQuestions = (newOrder: number[]) => {
    setQuestionOrder(newOrder);
  };

  // Calculate total points
  const calculateTotalPoints = () => {
    return questionSet.reduce((total: number, question: any) => {
      return total + (question.points || 10);
    }, 0);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setHeaderImage(imageUrl);
        setFormHeader(prev => ({
          ...prev,
          headerImg: imageUrl
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(()=>{
    console.log("=== FORM STATE DEBUG ===");
    console.log("Question Set:", questionSet);
    console.log("Question Order:", questionOrder);
    console.log("Form Header:", formHeader);
    console.log("Complete Form Array:", form);
    console.log("Form Length:", form.length);
    console.log("========================");
  }, [questionSet, formHeader, form, questionOrder])

  // Load saved form data on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('formBuilderData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        if (parsedData.formStructure && parsedData.formStructure.length > 0) {
          const [header, ...questions] = parsedData.formStructure;
          if (header.type === 'formHeader') {
            setFormHeader(header);
            setHeaderImage(header.headerImg);
            setQuestionset(questions);
          }
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Update questionOrder when questionSet changes
    setQuestionOrder(questionSet.map((_, index) => index));
  }, [questionSet.length]);


  const handleImageRemove = () => {
    setHeaderImage(null);
    setFormHeader(prev => ({
      ...prev,
      headerImg: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleMakeItLive = async () => {
    if (!formHeader.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a form title before making it live.",
        variant: "destructive",
      });
      return;
    }

    if (questionSet.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one question before making the form live.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First create the form
      const formData: FormData = {
        header: formHeader,
        questions: questionSet
      };

      const createResponse = await formService.createForm(formData);
      
      if (createResponse.success) {
        const newFormId = createResponse.data.form.id;
        setFormId(newFormId);

        // Then make it live
        const liveResponse = await formService.makeFormLive(newFormId);
        
        if (liveResponse.success) {
          setIsFormLive(true);
          setPublicUrl(liveResponse.data.form.publicUrl);
          
          toast({
            title: "Success!",
            description: "Your form is now live and can be accessed by participants.",
          });
        }
      }
    } catch (error: any) {
      console.error('Error making form live:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to make form live. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Copied!",
        description: "Public form URL copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
      setFormHeader({
        type: "formHeader",
        title: "Untitled Form",
        headerImg: null,
        description: ""
      });
      setHeaderImage(null);
      setQuestionset([]);
      setQuestionOrder([]);
      localStorage.removeItem('formBuilderData');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const questionTypes = ["Categorize", "Cloze", "Comprehension"];

  return (
    <div className="min-h-screen bg-transparent">
      {/* <Header showProfile={true} /> */}
      
      <div className="bg-transparent p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-primary mb-2">
              Form Builder
            </h1>
          </div>

        {/* Form Header Card */}
        <Card className="shadow-feature-card">
          <CardHeader className="pb-4">
            {/* Header Image Section */}
            <div className="flex justify-start mb-6">
              <div
                className="relative"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {headerImage ? (
                  <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border-2 border-dashed border-primary/20">
                    <img
                      src={headerImage}
                      alt="Header"
                      className="w-full h-full object-cover"
                    />
                    {isHovering && (
                      <button
                        onClick={handleImageRemove}
                        className="absolute top-2 left-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
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
                    Add Header Image
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
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Title Field */}
            <div>
              <Input
                value={formHeader.title}
                onChange={(e) => setFormHeader(prev => ({ ...prev, title: e.target.value }))}
                className="!text-2xl font-semibold border-none p-0 focus-visible:ring-0 bg-transparent"
                placeholder="Form Title"
              />
            </div>

            {/* Description Field */}
            <div>
              <Textarea
                value={formHeader.description}
                onChange={(e) => setFormHeader(prev => ({ ...prev, description: e.target.value }))}
                className="border-none p-0 focus-visible:ring-0 bg-transparent resize-none text-xl text-muted-foreground"
                placeholder="Form description..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Container */}
        <Card className="shadow-feature-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                Question
              </h2>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2">
                {questionTypes.map((type) => (
                  <Button
                    key={type}
                    variant={activeQuestionType === type ? "default" : "outline"}
                    onClick={() => setActiveQuestionType(type)}
                    className={cn(
                      "transition-all duration-200",
                      activeQuestionType === type && "shadow-button"
                    )}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg bg-muted/20">
              {activeQuestionType === "Categorize" && (
                <CategorizeQuestionCard questionStoreState={setQuestionset}/>
              )}
              {activeQuestionType === "Cloze" && (
                <ClozeQuestionCard questionStoreState={setQuestionset}/>
              )}
              {activeQuestionType === "Comprehension" && (
               <ComprehensionQuestionCard questionStoreState={setQuestionset}/>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-feature-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                Preview
              </h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleClearForm}
                  variant="outline"
                  disabled={isFormLive}
                  className="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Clear Form
                </Button>
                <Button 
                  onClick={handleMakeItLive}
                  disabled={isSubmitting || isFormLive}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Making Live..." : isFormLive ? "Form is Live" : "Make it Live"}
                  {isFormLive && <CheckCircle className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Points Summary */}
            {questionSet.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800">Form Summary:</span>
                    <span className="text-blue-700">{questionSet.length} question{questionSet.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800">Total Points:</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {calculateTotalPoints()} points
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Form Success Alert */}
            {isFormLive && publicUrl && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="space-y-2">
                  <div className="font-medium text-green-800">
                    🎉 Your form is now live!
                  </div>
                  <div className="text-sm text-green-700">
                    Share this link with participants to collect responses:
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <code className="flex-1 text-xs text-gray-600 break-all">
                      {publicUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(publicUrl, '_blank')}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <QuestionPreview 
              questions={questionSet} 
              questionOrder={questionOrder}
              onDeleteQuestion={handleDeleteQuestion}
              onReorderQuestions={handleReorderQuestions}
            />
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;