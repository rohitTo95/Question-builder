import mongoose, { Schema, Document } from "mongoose";

// Interface for individual question responses
interface IQuestionResponse {
  questionIndex: number;
  questionId: string; // Add question ID to track which question was answered
  questionType: 'Categorize' | 'Cloze' | 'Comprehension';
  response: any; // Can be different types based on question type
  answer: any; // User's selected answer/responses
}

// Interface for categorize response
interface ICategorizeResponse {
  [category: string]: string[]; // Category name -> array of option IDs
}

// Interface for cloze response
interface IClozeResponse {
  [blankId: string]: string; // Blank ID -> selected option
}

// Interface for comprehension response
interface IComprehensionResponse {
  selectedOption: string; // Selected option ID
}

// Main form response interface
export interface IFormResponse extends Document {
  formId: mongoose.Types.ObjectId;
  participantId: mongoose.Types.ObjectId;
  formUrl: string;
  respondentInfo?: {
    email?: string;
    name?: string;
  };
  responses: IQuestionResponse[];
  totalScore: number;
  maxPossibleScore: number;
  isCompleted: boolean;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Schema for question responses
const QuestionResponseSchema = new Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  questionId: {
    type: String,
    required: true,
    index: true
  },
  questionType: {
    type: String,
    enum: ['Categorize', 'Cloze', 'Comprehension'],
    required: true
  },
  response: {
    type: Schema.Types.Mixed,
    required: true
  },
  answer: {
    type: Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

// Schema for respondent info
const RespondentInfoSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, { _id: false });

// Main form response schema
const FormResponseSchema: Schema<IFormResponse> = new Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormParticipant',
      required: true,
      index: true
    },
    formUrl: {
      type: String,
      required: true,
      index: true
    },
    respondentInfo: {
      type: RespondentInfoSchema
    },
    responses: [{
      type: QuestionResponseSchema
    }],
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    maxPossibleScore: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: "form_responses"
  }
);

// Indexes for better query performance
FormResponseSchema.index({ formId: 1, submittedAt: -1 });
FormResponseSchema.index({ formUrl: 1, submittedAt: -1 });
FormResponseSchema.index({ isCompleted: 1, submittedAt: -1 });

export default mongoose.model<IFormResponse>("FormResponse", FormResponseSchema);
