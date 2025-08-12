import mongoose, { Schema, Document } from "mongoose";

// Interface for form participant
export interface IFormParticipant extends Document {
  formId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Schema for form participant
const FormParticipantSchema: Schema<IFormParticipant> = new Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    submittedAt: {
      type: Date,
      default: Date.now
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
    collection: "formParticipants"
  }
);

// Create compound unique index to prevent duplicate submissions
FormParticipantSchema.index({ formId: 1, email: 1 }, { unique: true });

// Index for better query performance
FormParticipantSchema.index({ formId: 1, submittedAt: -1 });

export default mongoose.model<IFormParticipant>("FormParticipant", FormParticipantSchema);
