import { Request, Response } from 'express';
import Form from '../models/form';
import FormResponse from '../models/formResponse';
import FormParticipant from '../models/formParticipant';
import { calculateTotalScore } from '../utils/scoring';
import { uploadToCloudinary, deleteFromCloudinary, upload, CloudinaryUploadOptions } from '../utils/cloudinary';

// Helper function to generate unique form URL
function generateUniqueFormUrl(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}`;
}

// Helper function to process image uploads
async function processImageUploads(
  userId: string,
  formId: string,
  headerImageFile?: Express.Multer.File,
  questionImages?: { [questionId: string]: Express.Multer.File }
): Promise<{
  headerImageUrl?: string;
  questionImageUrls: { [questionId: string]: string };
}> {
  const results: {
    headerImageUrl?: string;
    questionImageUrls: { [questionId: string]: string };
  } = {
    questionImageUrls: {}
  };

  try {
    // Upload header image if provided
    if (headerImageFile && headerImageFile.buffer) {
      const headerImageUrl = await uploadToCloudinary(headerImageFile.buffer, {
        userId,
        formId,
        imageType: 'header'
      });
      results.headerImageUrl = headerImageUrl;
    }

    // Upload question images if provided
    if (questionImages) {
      for (const [questionId, imageFile] of Object.entries(questionImages)) {
        if (imageFile && imageFile.buffer) {
          const imageUrl = await uploadToCloudinary(imageFile.buffer, {
            userId,
            formId,
            imageType: 'question',
            questionId
          });
          results.questionImageUrls[questionId] = imageUrl;
        }
      }
    }
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }

  return results;
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

// Create a new form with image uploads
export const createFormWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { header, questions } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Parse questions if it's a string (from FormData)
    let parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    let parsedHeader = typeof header === 'string' ? JSON.parse(header) : header;

    // Validation
    if (!parsedHeader || !parsedHeader.title || parsedHeader.title.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Form title is required'
      });
      return;
    }

    if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one question is required'
      });
      return;
    }

    // Create form first to get the form ID
    const newForm = new Form({
      userId: req.user!.userId,
      header: parsedHeader,
      questions: parsedQuestions,
      formUrl: generateUniqueFormUrl()
    });

    const savedForm = await newForm.save();

    // Process image uploads
    try {
      const headerImageFile = files?.['headerImage']?.[0];
      const questionImages: { [questionId: string]: Express.Multer.File } = {};

      // Extract question images from files
      Object.keys(files || {}).forEach(fieldName => {
        if (fieldName.startsWith('questionImage_')) {
          const questionId = fieldName.replace('questionImage_', '');
          questionImages[questionId] = files[fieldName][0];
        }
      });

      const uploadResults = await processImageUploads(
        req.user!.userId,
        (savedForm._id as any).toString(),
        headerImageFile,
        questionImages
      );

      // Update form with image URLs
      const updateData: any = {};
      
      if (uploadResults.headerImageUrl) {
        updateData['header.headerImg'] = uploadResults.headerImageUrl;
      }

      // Update question images
      if (Object.keys(uploadResults.questionImageUrls).length > 0) {
        parsedQuestions.forEach((question: any, index: number) => {
          const questionId = question['question-id'];
          if (uploadResults.questionImageUrls[questionId]) {
            updateData[`questions.${index}.image`] = uploadResults.questionImageUrls[questionId];
          }
        });
      }

      // Update form with image URLs if any were uploaded
      if (Object.keys(updateData).length > 0) {
        await Form.findByIdAndUpdate(savedForm._id, { $set: updateData });
      }

    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      // Don't fail the form creation if image upload fails
    }

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: {
        form: {
          id: savedForm._id,
          formUrl: savedForm.formUrl,
          title: savedForm.header.title,
          isPublished: savedForm.isPublished,
          questionCount: savedForm.questions.length,
          createdAt: savedForm.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create form with images error:', error);
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

// Update a form with image uploads
export const updateFormWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;
    const { header, questions } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Parse data if it's a string (from FormData)
    let parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    let parsedHeader = typeof header === 'string' ? JSON.parse(header) : header;

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

    // Process image uploads
    try {
      const headerImageFile = files?.['headerImage']?.[0];
      const questionImages: { [questionId: string]: Express.Multer.File } = {};

      // Extract question images from files
      Object.keys(files || {}).forEach(fieldName => {
        if (fieldName.startsWith('questionImage_')) {
          const questionId = fieldName.replace('questionImage_', '');
          questionImages[questionId] = files[fieldName][0];
        }
      });

      const uploadResults = await processImageUploads(
        req.user!.userId,
        formId,
        headerImageFile,
        questionImages
      );

      // Update header with new image URL if uploaded
      if (uploadResults.headerImageUrl && parsedHeader) {
        parsedHeader.headerImg = uploadResults.headerImageUrl;
      }

      // Update question images
      if (Object.keys(uploadResults.questionImageUrls).length > 0 && parsedQuestions) {
        parsedQuestions.forEach((question: any) => {
          const questionId = question['question-id'];
          if (uploadResults.questionImageUrls[questionId]) {
            question.image = uploadResults.questionImageUrls[questionId];
          }
        });
      }

    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      // Don't fail the form update if image upload fails
    }

    // Update form data
    if (parsedHeader) form.header = parsedHeader;
    if (parsedQuestions) form.questions = parsedQuestions;

    await form.save();

    res.status(200).json({
      success: true,
      message: 'Form updated successfully',
      data: { form }
    });
  } catch (error) {
    console.error('Update form with images error:', error);
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
    const { participantId, responses, totalScore, maxPossibleScore } = req.body;

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

    // Use pre-calculated scores from client, or calculate server-side as fallback
    let finalTotalScore = totalScore;
    let finalMaxPossibleScore = maxPossibleScore;
    
    if (typeof totalScore !== 'number' || typeof maxPossibleScore !== 'number') {
      console.log('No valid pre-calculated scores provided, calculating server-side as fallback');
      const scoreResult = calculateTotalScore(form.questions, responses);
      finalTotalScore = scoreResult.totalScore;
      finalMaxPossibleScore = scoreResult.maxPossibleScore;
    } else {
      console.log('Using pre-calculated scores:', { totalScore, maxPossibleScore });
    }

    // Create form response
    const formResponse = new FormResponse({
      formId: form._id,
      participantId: participantId,
      formUrl: formUrl,
      responses: responses,
      totalScore: finalTotalScore,
      maxPossibleScore: finalMaxPossibleScore,
      isCompleted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await formResponse.save();

    // Add the response ID to the form's responses array
    await Form.findByIdAndUpdate(
      form._id,
      { $push: { responses: formResponse._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Form response submitted successfully',
      data: {
        responseId: formResponse._id,
        submittedAt: formResponse.submittedAt,
        score: {
          totalScore: finalTotalScore,
          maxPossibleScore: finalMaxPossibleScore,
          percentage: finalMaxPossibleScore > 0 ? Math.round((finalTotalScore / finalMaxPossibleScore) * 100) : 0
        }
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

// Debug scoring endpoint
export const debugScoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formUrl } = req.params;
    const { responses } = req.body;

    const form = await Form.findOne({ formUrl });
    if (!form) {
      res.status(404).json({ success: false, message: 'Form not found' });
      return;
    }

    console.log('=== DEBUGGING SCORING ===');
    console.log('Form questions:', JSON.stringify(form.questions, null, 2));
    console.log('Received responses:', JSON.stringify(responses, null, 2));

    const scoreResult = calculateTotalScore(form.questions, responses);
    
    console.log('Score result:', JSON.stringify(scoreResult, null, 2));

    res.json({
      success: true,
      scoreResult,
      formQuestions: form.questions,
      receivedResponses: responses
    });
  } catch (error) {
    console.error('Error in debug scoring:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
