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

      const response = await formService.submitFormResponse(formUrl!, {
        participantId,
        responses: formattedResponses
      });

      if (response.success) {
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
              <img
                src={formData.header.headerImg}
                alt="Form header"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
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
                <Button type="submit" className="w-full">
                  Start Form
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-6">
            {formData.questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <PreviewQuestionCard
                    question={question}
                    questionIndex={index}
                    onAnswerUpdate={handleAnswerUpdate}
                    isInteractive={true}
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
