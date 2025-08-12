import { apiPost, apiPatch, apiGet } from '../utils/api';

// Always use /api as base URL - Vercel rewrites will handle routing in production
const API_BASE_URL = '/api';

export interface FormData {
  header: {
    type: string;
    title: string;
    headerImg: string | null;
    description: string;
  };
  questions: any[];
}

export interface MakeLiveResponse {
  success: boolean;
  message: string;
  data: {
    form: {
      id: string;
      title: string;
      isPublished: boolean;
      public: boolean;
      formUrl: string;
      publicUrl: string;
    };
  };
}

export interface ParticipantRegistration {
  name: string;
  email: string;
}

export interface FormResponse {
  participantId: string;
  responses: Array<{
    questionIndex: number;
    questionId: string;
    questionType: 'Categorize' | 'Cloze' | 'Comprehension';
    response: any; // Raw response data
    answer: any; // User's selected answer
  }>;
  totalScore?: number; // Pre-calculated total score
  maxPossibleScore?: number; // Pre-calculated max possible score
}

export const formService = {
  // Create a new form
  async createForm(formData: FormData) {
    const response = await apiPost(`${API_BASE_URL}/forms`, formData);
    if (!response.ok) {
      throw new Error('Failed to create form');
    }
    return response.json();
  },

  // Make form live (public)
  async makeFormLive(formId: string): Promise<MakeLiveResponse> {
    const response = await apiPatch(`${API_BASE_URL}/forms/${formId}/make-live`);
    if (!response.ok) {
      throw new Error('Failed to make form live');
    }
    return response.json();
  },

  // Get public form data
  async getPublicForm(formUrl: string) {
    const response = await apiGet(`${API_BASE_URL}/public/forms/${formUrl}`);
    if (!response.ok) {
      throw new Error('Failed to fetch public form');
    }
    return response.json();
  },

  // Register participant for public form
  async registerParticipant(formUrl: string, participant: ParticipantRegistration) {
    const response = await apiPost(`${API_BASE_URL}/public/forms/${formUrl}/participants`, participant);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register participant');
    }
    return response.json();
  },

  // Submit form response
  async submitFormResponse(formUrl: string, formResponse: FormResponse) {
    const response = await apiPost(`${API_BASE_URL}/public/forms/${formUrl}/responses`, formResponse);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit form response');
    }
    return response.json();
  }
};
