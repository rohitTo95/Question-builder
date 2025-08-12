import { Request, Response } from 'express';
import Form from '../models/form';
import FormResponse from '../models/formResponse';

// Submit a form response
export const submitFormResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formUrl } = req.params;
    const { responses, respondentInfo } = req.body;

    // Find the form
    const form = await Form.findOne({
      formUrl,
      isPublished: true
    });

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found or not published'
      });
      return;
    }

    // Validation
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Responses are required'
      });
      return;
    }

    // Create form response
    const formResponse = new FormResponse({
      formId: form._id,
      formUrl,
      responses,
      respondentInfo: respondentInfo || {},
      submittedAt: new Date()
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
        submittedAt: formResponse.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit form response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get form responses (for form owner only)
export const getFormResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { formId } = req.params;

    // Find the form and verify ownership
    const form = await Form.findById(formId);

    if (!form) {
      res.status(404).json({
        success: false,
        message: 'Form not found'
      });
      return;
    }

    if (form.userId.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Get responses
    const responses = await FormResponse.find({ formId })
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        responses
      }
    });
  } catch (error) {
    console.error('Get form responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get responses for a form (form owner only)
// export const getFormResponses = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { formId } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     // Verify form ownership
//     const form = await Form.findOne({
//       _id: formId,
//       userId: req.user!.userId
//     });

//     if (!form) {
//       res.status(404).json({
//         success: false,
//         message: 'Form not found'
//       });
//       return;
//     }

//     const responses = await FormResponse.find({ formId })
//       .sort({ submittedAt: -1 })
//       .limit(Number(limit) * 1)
//       .skip((Number(page) - 1) * Number(limit));

//     const total = await FormResponse.countDocuments({ formId });

//     res.status(200).json({
//       success: true,
//       data: {
//         responses,
//         formTitle: form.formHeader.title,
//         pagination: {
//           currentPage: Number(page),
//           totalPages: Math.ceil(total / Number(limit)),
//           totalResponses: total,
//           hasNext: Number(page) * Number(limit) < total,
//           hasPrev: Number(page) > 1
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get form responses error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get a specific response by ID
// export const getResponseById = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { responseId } = req.params;

//     const response = await FormResponse.findById(responseId)
//       .populate('formId', 'userId formHeader.title');

//     if (!response) {
//       res.status(404).json({
//         success: false,
//         message: 'Response not found'
//       });
//       return;
//     }

//     // Check if user owns the form
//     const form = response.formId as any;
//     if (form.userId.toString() !== req.user!.userId) {
//       res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       data: { response }
//     });
//   } catch (error) {
//     console.error('Get response by ID error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Delete a response
// export const deleteResponse = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { responseId } = req.params;

//     const response = await FormResponse.findById(responseId)
//       .populate('formId', 'userId');

//     if (!response) {
//       res.status(404).json({
//         success: false,
//         message: 'Response not found'
//       });
//       return;
//     }

//     // Check if user owns the form
//     const form = response.formId as any;
//     if (form.userId.toString() !== req.user!.userId) {
//       res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//       return;
//     }

//     await FormResponse.findByIdAndDelete(responseId);

//     // Remove response reference from form
//     await Form.findByIdAndUpdate(
//       response.formId,
//       { $pull: { responses: responseId } }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Response deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete response error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get form analytics/statistics
// export const getFormAnalytics = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { formId } = req.params;

//     // Verify form ownership
//     const form = await Form.findOne({
//       _id: formId,
//       userId: req.user!.userId
//     });

//     if (!form) {
//       res.status(404).json({
//         success: false,
//         message: 'Form not found'
//       });
//       return;
//     }

//     // Get response statistics
//     const totalResponses = await FormResponse.countDocuments({ formId });
//     const completedResponses = await FormResponse.countDocuments({ 
//       formId, 
//       isCompleted: true 
//     });

//     // Get responses per day (last 30 days)
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//     const responsesPerDay = await FormResponse.aggregate([
//       {
//         $match: {
//           formId: form._id,
//           submittedAt: { $gte: thirtyDaysAgo }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
//           },
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $sort: { _id: 1 }
//       }
//     ]);

//     // Get recent responses
//     const recentResponses = await FormResponse.find({ formId })
//       .select('respondentInfo submittedAt isCompleted')
//       .sort({ submittedAt: -1 })
//       .limit(10);

//     res.status(200).json({
//       success: true,
//       data: {
//         formTitle: form.formHeader.title,
//         questionCount: form.questions.length,
//         analytics: {
//           totalResponses,
//           completedResponses,
//           completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
//           responsesPerDay,
//           recentResponses
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get form analytics error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };
