import { Request, Response } from 'express';
import Form from '../models/form';
import FormResponse from '../models/formResponse';
import FormParticipant from '../models/formParticipant';

// Helper function to generate unique form URL
function generateUniqueFormUrl(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}`;
}

// Create a new form
export const createForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { header, questions } = req.body;

    // Validation
    if (!header || !header.title || header.title.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Form title is required'
      });
      return;
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one question is required'
      });
      return;
    }

    // Validate each question has required fields
    for (const question of questions) {
      if (!question['question-id'] || !question['question-type'] || !question.question || question.question.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Each question must have question-id, question-type, and question text'
        });
        return;
      }
    }

    // Create new form
    const newForm = new Form({
      userId: req.user!.userId,
      header,
      questions,
      formUrl: generateUniqueFormUrl() // Generate URL explicitly
    });

    await newForm.save();

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: {
        form: {
          id: newForm._id,
          formUrl: newForm.formUrl,
          title: newForm.header.title,
          isPublished: newForm.isPublished,
          questionCount: newForm.questions.length,
          createdAt: newForm.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all forms for the authenticated user
export const getUserForms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, published } = req.query;
    
    const query: any = { userId: req.user!.userId };
    if (published !== undefined) {
      query.isPublished = published === 'true';
    }

    const forms = await Form.find(query)
      .select('header.title header.description isPublished formUrl createdAt updatedAt questions')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Form.countDocuments(query);

    // Add response count for each form
    const formsWithStats = await Promise.all(
      forms.map(async (form) => {
        const responseCount = await FormResponse.countDocuments({ formId: form._id });
        return {
          id: form._id,
          title: form.header.title,
          description: form.header.description,
          isPublished: form.isPublished,
          formUrl: form.formUrl,
          questionCount: form.questions.length,
          responseCount,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        forms: formsWithStats,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalForms: total,
          hasNext: Number(page) * Number(limit) < total,
          hasPrev: Number(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get a specific form by ID
export const getFormById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;

    const form = await Form.findOne({
      _id: formId,
      userId: req.user!.userId
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { form }
    });
  } catch (error) {
    console.error('Get form by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update a form
export const updateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;
    const { header, questions } = req.body;

    const form = await Form.findOne({
      _id: formId,
      userId: req.user!.userId
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found'
      });
      return;
    }

    // Update form
    if (header) form.header = header;
    if (questions) form.questions = questions;

    await form.save();

    res.status(200).json({
      success: true,
      message: 'Form updated successfully',
      data: { form }
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a form
export const deleteForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;

    const form = await Form.findOneAndDelete({
      _id: formId,
      userId: req.user!.userId
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found'
      });
      return;
    }

    // Also delete all responses to this form
    await FormResponse.deleteMany({ formId });

    res.status(200).json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Publish/unpublish a form
export const toggleFormPublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;
    const { isPublished } = req.body;

    const form = await Form.findOne({
      _id: formId,
      userId: req.user!.userId
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found'
      });
      return;
    }

    form.isPublished = isPublished;
    await form.save();

    res.status(200).json({
      success: true,
      message: `Form ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        form: {
          id: form._id,
          isPublished: form.isPublished,
          formUrl: form.formUrl
        }
      }
    });
  } catch (error) {
    console.error('Toggle form publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get public form by URL (for form filling)
export const getPublicForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formUrl } = req.params;

    const form = await Form.findOne({
      formUrl,
      isPublished: true
    }).select('-userId');

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found or not published'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { form }
    });
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Make form live (set public to true and ensure it's published)
export const makeFormLive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;

    const form = await Form.findOne({
      _id: formId,
      userId: req.user!.userId
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found'
      });
      return;
    }

    // Make form public and published
    form.public = true;
    form.isPublished = true;
    await form.save();

    // Generate public URL
    const publicUrl = `${process.env.CLIENT_URL || 'http://localhost:8080'}/public/form/${form.formUrl}`;

    res.status(200).json({
      success: true,
      message: 'Form is now live and accessible to the public',
      data: {
        form: {
          id: form._id,
          title: form.header.title,
          isPublished: form.isPublished,
          public: form.public,
          formUrl: form.formUrl,
          publicUrl
        }
      }
    });
  } catch (error) {
    console.error('Make form live error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register participant for public form
export const registerParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formUrl } = req.params;
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Find the form
    const form = await Form.findOne({
      formUrl,
      public: true,
      isPublished: true
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found or not accessible'
      });
      return;
    }

    // Check if participant already exists
    const existingParticipant = await FormParticipant.findOne({
      formId: form._id,
      email: email.toLowerCase()
    });

    if (existingParticipant) {
      res.status(409).json({
        success: false,
        message: 'You have already registered for this form'
      });
      return;
    }

    // Create participant
    const participant = new FormParticipant({
      formId: form._id,
      name: name.trim(),
      email: email.toLowerCase(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await participant.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        participantId: participant._id,
        name: participant.name,
        email: participant.email
      }
    });
  } catch (error) {
    console.error('Register participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit form response for public form
export const submitPublicFormResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formUrl } = req.params;
    const { participantId, responses } = req.body;

    // Validation
    if (!participantId || !responses || !Array.isArray(responses) || responses.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Participant ID and responses are required'
      });
      return;
    }

    // Find the form
    const form = await Form.findOne({
      formUrl,
      public: true,
      isPublished: true
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found or not accessible'
      });
      return;
    }

    // Verify participant exists
    const participant = await FormParticipant.findOne({
      _id: participantId,
      formId: form._id
    });

    if (!participant) {
      res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
      return;
    }

    // Check if participant has already submitted
    const existingResponse = await FormResponse.findOne({
      formId: form._id,
      participantId: participantId
    });

    if (existingResponse) {
      res.status(409).json({
        success: false,
        message: 'You have already submitted a response for this form'
      });
      return;
    }

    // Create form response
    const formResponse = new FormResponse({
      formId: form._id,
      participantId: participantId,
      formUrl: formUrl,
      responses: responses,
      isCompleted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await formResponse.save();

    res.status(201).json({
      success: true,
      message: 'Form response submitted successfully',
      data: {
        responseId: formResponse._id,
        submittedAt: formResponse.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit public form response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
