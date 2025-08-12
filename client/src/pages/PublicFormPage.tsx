import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formService } from '@/services/formService';
import { useToast } from '@/hooks/use-toast';
import { PreviewQuestionCard } from '@/components/PreviewQuestionCard';
import { calculateTotalScore } from '@/utils/scoring';

interface FormData {
  _id: string;
  header: {
    title: string;
    description: string;
    headerImg: string | null;
  };
  questions: any[];
  formUrl: string;
}

interface ParticipantData {
  name: string;
  email: string;
}

const PublicFormPage = () => {
  const { formUrl } = useParams<{ formUrl: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // States
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'register' | 'form' | 'success'>('register');
  const [participant, setParticipant] = useState<ParticipantData>({ name: '', email: '' });
  const [participantId, setParticipantId] = useState<string>('');
  const [responses, setResponses] = useState<{ [key: number]: { response: any, answer: any, questionId: string } }>({});
  const [submitting, setSubmitting] = useState(false);
  const [scoreData, setScoreData] = useState<{ 
    totalScore: number; 
    maxPossibleScore: number; 
    percentage: number;
    results?: any[];
  } | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [registering, setRegistering] = useState(false);

  // Calculate total points
  const calculateTotalPoints = () => {
    if (!formData) return 0;
    return formData.questions.reduce((total: number, question: any) => {
      return total + (question.points || 10);
    }, 0);
  };

  // Handle image loading
  const handleImageLoad = (imageKey: string) => {
    setImageLoading(prev => ({ ...prev, [imageKey]: false }));
  };

  const handleImageLoadStart = (imageKey: string) => {
    setImageLoading(prev => ({ ...prev, [imageKey]: true }));
  };

  // Load form data
  useEffect(() => {
    const loadForm = async () => {
      if (!formUrl) {
        setError('Invalid form URL');
        setLoading(false);
        return;
      }

      try {
        const response = await formService.getPublicForm(formUrl);
        if (response.success) {
          setFormData(response.data.form);
        } else {
          setError('Form not found or not accessible');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formUrl]);

  // Handle participant registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participant.name.trim() || !participant.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both name and email.",
        variant: "destructive",
      });
      return;
    }

    setRegistering(true);

    try {
      const response = await formService.registerParticipant(formUrl!, participant);
      if (response.success) {
        setParticipantId(response.data.participantId);
        setStep('form');
        toast({
          title: "Registration Successful",
          description: "You can now fill out the form.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  // Handle answer updates
  const handleAnswerUpdate = (questionIndex: number, questionId: string, response: any, answer: any) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: { response, answer, questionId }
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData || !participantId) return;

    // Validate all questions are answered
    const unansweredQuestions = formData.questions.filter((_, index) => !responses[index]);
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Form",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const formattedResponses = formData.questions.map((question, index) => ({
        questionIndex: index,
        questionId: responses[index]?.questionId || question['question-id'],
        questionType: question['question-type'] as 'Categorize' | 'Cloze' | 'Comprehension',
        response: responses[index]?.response || {},
        answer: responses[index]?.answer || {}
      }));

      // Calculate scores client-side before submission
      const scoreResult = calculateTotalScore(formData.questions, formattedResponses);
      console.log('Client-side score calculation:', scoreResult);

      const response = await formService.submitFormResponse(formUrl!, {
        participantId,
        responses: formattedResponses,
        // Include pre-calculated scores
        totalScore: scoreResult.totalEarned,
        maxPossibleScore: scoreResult.totalMax
      });

      if (response.success) {
        // Store score data from our calculation
        setScoreData({
          totalScore: scoreResult.totalEarned,
          maxPossibleScore: scoreResult.totalMax,
          percentage: scoreResult.percentage,
          results: scoreResult.results
        });
        setStep('success');
        toast({
          title: "Success!",
          description: "Your response has been submitted successfully.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Form Not Available</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Form Header */}
        <Card className="mb-6">
          <CardHeader>
            {formData.header.headerImg && (
              <div className="relative">
                {imageLoading['header'] && (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
                <img
                  src={formData.header.headerImg}
                  alt="Form header"
                  className={`w-full h-48 object-cover rounded-lg mb-4 transition-opacity duration-300 ${
                    imageLoading['header'] ? 'opacity-0 absolute top-0 left-0' : 'opacity-100'
                  }`}
                  onLoadStart={() => handleImageLoadStart('header')}
                  onLoad={() => handleImageLoad('header')}
                  onError={() => handleImageLoad('header')}
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{formData.header.title}</h1>
            {formData.header.description && (
              <p className="text-muted-foreground">{formData.header.description}</p>
            )}
          </CardHeader>
        </Card>

        {/* Registration Step */}
        {step === 'register' && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Participant Information</h2>
              <p className="text-muted-foreground">
                Please provide your details to access the form.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={participant.name}
                    onChange={(e) => setParticipant(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={participant.email}
                    onChange={(e) => setParticipant(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={registering}>
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Form...
                    </>
                  ) : (
                    'Start Form'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-6">
            {/* Form Points Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800">Form Overview:</span>
                    <span className="text-blue-700">{formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800">Total Points:</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {calculateTotalPoints()} points
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {formData.questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <PreviewQuestionCard
                    question={question}
                    questionIndex={index}
                    onAnswerUpdate={handleAnswerUpdate}
                    isInteractive={true}
                    imageLoading={imageLoading}
                    onImageLoadStart={handleImageLoadStart}
                    onImageLoad={handleImageLoad}
                  />
                </CardContent>
              </Card>
            ))}
            
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-6">
                  Your response has been successfully submitted. We appreciate your participation.
                </p>
                
                {/* Score Display */}
                {scoreData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Your Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{scoreData.totalScore}</div>
                        <div className="text-sm text-blue-700">Points Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{scoreData.maxPossibleScore}</div>
                        <div className="text-sm text-blue-700">Total Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{scoreData.percentage}%</div>
                        <div className="text-sm text-blue-700">Score</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${scoreData.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button onClick={() => navigate('/')}>
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicFormPage;
