import mongoose, { Schema, Document } from "mongoose";

// Interface for form header
interface IFormHeader {
  type: string;
  title: string;
  headerImg: string | null;
  description: string;
}

// Interface for categorize question options
interface ICategorizeOption {
  id: string;
  text: string;
  category: string;
}

// Interface for cloze answers
interface IClozeAnswer {
  content: string;
  startIndex: number;
  endIndex: number;
}

// Interface for categorize questions
interface ICategorizeQuestion {
  'question-id': string;
  'question-type': 'Categorize';
  question: string;
  image: string | null;
  options: ICategorizeOption[];
}

// Interface for cloze questions
interface IClozeQuestion {
  'question-id': string;
  'question-type': 'Cloze';
  question: string;
  image: string | null;
  options: string[];
  answer: IClozeAnswer[];
}

// Interface for comprehension questions
interface IComprehensionQuestion {
  'question-id': string;
  'question-type': 'Comprehension';
  question: string;
  image: string | null;
  options: string[];
  passage: string;
  answer: string;
}

// Union type for all question types
type IQuestion = ICategorizeQuestion | IClozeQuestion | IComprehensionQuestion;

// Main form interface
export interface IForm extends Document {
  userId: mongoose.Types.ObjectId;
  header: IFormHeader;
  questions: IQuestion[];
  isPublished: boolean;
  public: boolean;
  formUrl: string;
  createdAt: Date;
  updatedAt: Date;
  responses?: mongoose.Types.ObjectId[]; // References to form responses
}

// Schema for form header
const FormHeaderSchema = new Schema({
  type: {
    type: String,
    default: 'formHeader',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  headerImg: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: 1000
  }
}, { _id: false });

// Schema for categorize question options
const CategorizeOptionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
}, { _id: false });

// Schema for cloze answers
const ClozeAnswerSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  startIndex: {
    type: Number,
    required: true
  },
  endIndex: {
    type: Number,
    required: true
  }
}, { _id: false });

// Schema for categorize questions
const CategorizeQuestionSchema = new Schema({
  'question-id': {
    type: String,
    required: true
  },
  'question-type': {
    type: String,
    enum: ['Categorize'],
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 2000
  },
  image: {
    type: String,
    default: null
  },
  options: [{
    type: CategorizeOptionSchema,
    required: true
  }]
}, { _id: false });

// Schema for cloze questions
const ClozeQuestionSchema = new Schema({
  'question-id': {
    type: String,
    required: true
  },
  'question-type': {
    type: String,
    enum: ['Cloze'],
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 2000
  },
  image: {
    type: String,
    default: null
  },
  options: [{
    type: String,
    required: true
  }],
  answer: [{
    type: ClozeAnswerSchema,
    required: true
  }]
}, { _id: false });

// Schema for comprehension questions
const ComprehensionQuestionSchema = new Schema({
  'question-id': {
    type: String,
    required: true
  },
  'question-type': {
    type: String,
    enum: ['Comprehension'],
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 2000
  },
  image: {
    type: String,
    default: null
  },
  options: [{
    type: String,
    required: true
  }],
  passage: {
    type: String,
    required: true,
    maxlength: 5000
  },
  answer: {
    type: String,
    required: true
  }
}, { _id: false });

// Schema for questions (discriminated union)
const QuestionSchema = new Schema({
  'question-id': {
    type: String,
    required: true
  },
  'question-type': {
    type: String,
    enum: ['Categorize', 'Cloze', 'Comprehension'],
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 2000
  },
  image: {
    type: String,
    default: null
  },
  options: {
    type: Schema.Types.Mixed,
    required: true
  },
  // Optional fields based on question type
  answer: {
    type: Schema.Types.Mixed
  },
  passage: {
    type: String,
    maxlength: 5000
  }
}, { _id: false });

// Main form schema
const FormSchema: Schema<IForm> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    header: {
      type: FormHeaderSchema,
      required: true
    },
    questions: [{
      type: QuestionSchema
    }],
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    public: {
      type: Boolean,
      default: false,
      index: true
    },
    formUrl: {
      type: String,
      unique: true,
      index: true
    },
    responses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormResponse'
    }]
  },
  {
    timestamps: true,
    collection: "forms"
  }
);

// Generate unique form URL before saving
FormSchema.pre<IForm>('save', async function (next) {
  if (!this.formUrl || this.formUrl === '') {
    this.formUrl = generateFormUrl();
  }
  next();
});

// Helper function to generate unique form URL
function generateFormUrl(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}`;
}

// Index for better query performance
FormSchema.index({ userId: 1, createdAt: -1 });
FormSchema.index({ formUrl: 1 });
FormSchema.index({ isPublished: 1, createdAt: -1 });

export default mongoose.model<IForm>("Form", FormSchema);
