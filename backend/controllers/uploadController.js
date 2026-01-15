const User = require('../models/User');
const Quotation = require('../models/Quotation');
const {
    uploadAvatar,
    uploadProductPhotos,
    uploadPdf,
    deleteFromCloudinary,
    getPublicIdFromUrl,
} = require('../config/cloudinary');

// ============================================
// Upload Avatar (Profile Picture)
// ============================================
exports.uploadAvatar = (req, res) => {
    uploadAvatar(req, res, async (err) => {
        if (err) {
            console.error('Avatar upload error:', err);
            return res.status(400).json({
                message: 'Failed to upload avatar',
                error: err.message,
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const { userId } = req.params;

            // Find user and get old avatar URL for cleanup
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const oldAvatarUrl = user.avatarUrl;

            // Update user with new avatar URL
            user.avatarUrl = req.file.path;
            await user.save({ validateBeforeSave: false });

            // Delete old avatar from Cloudinary (if exists)
            if (oldAvatarUrl) {
                const oldPublicId = getPublicIdFromUrl(oldAvatarUrl);
                if (oldPublicId) {
                    try {
                        await deleteFromCloudinary(oldPublicId);
                    } catch (deleteErr) {
                        console.warn('Failed to delete old avatar:', deleteErr);
                    }
                }
            }

            res.json({
                message: 'Avatar uploaded successfully',
                avatarUrl: req.file.path,
                user: user,
            });

        } catch (error) {
            console.error('Avatar save error:', error);
            res.status(500).json({
                message: 'Failed to save avatar',
                error: error.message,
            });
        }
    });
};

// ============================================
// Upload Product Photos (Multiple)
// ============================================
exports.uploadProductPhotos = (req, res) => {
    uploadProductPhotos(req, res, async (err) => {
        if (err) {
            console.error('Product photos upload error:', err);
            return res.status(400).json({
                message: 'Failed to upload photos',
                error: err.message,
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        try {
            // Extract URLs from uploaded files
            const photoUrls = req.files.map(file => file.path);

            res.json({
                message: 'Photos uploaded successfully',
                photos: photoUrls,
                count: photoUrls.length,
            });

        } catch (error) {
            console.error('Product photos save error:', error);
            res.status(500).json({
                message: 'Failed to process uploaded photos',
                error: error.message,
            });
        }
    });
};

// ============================================
// Upload PDF Document (Managers Only)
// ============================================
exports.uploadPdf = (req, res) => {
    uploadPdf(req, res, async (err) => {
        if (err) {
            console.error('PDF upload error:', err);
            return res.status(400).json({
                message: 'Failed to upload PDF',
                error: err.message,
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const { quotationId } = req.params;

            // If quotationId provided, update the quotation with PDF URL
            if (quotationId) {
                const quotation = await Quotation.findById(quotationId);
                if (!quotation) {
                    return res.status(404).json({ message: 'Quotation not found' });
                }

                // Delete old PDF if exists
                if (quotation.pdfUrl) {
                    const oldPublicId = getPublicIdFromUrl(quotation.pdfUrl);
                    if (oldPublicId) {
                        try {
                            await deleteFromCloudinary(oldPublicId, 'raw');
                        } catch (deleteErr) {
                            console.warn('Failed to delete old PDF:', deleteErr);
                        }
                    }
                }

                quotation.pdfUrl = req.file.path;
                await quotation.save();

                return res.json({
                    message: 'PDF uploaded and linked to quotation',
                    pdfUrl: req.file.path,
                    quotation: quotation,
                });
            }

            // If no quotationId, just return the URL
            res.json({
                message: 'PDF uploaded successfully',
                pdfUrl: req.file.path,
            });

        } catch (error) {
            console.error('PDF save error:', error);
            res.status(500).json({
                message: 'Failed to process uploaded PDF',
                error: error.message,
            });
        }
    });
};

// ============================================
// Delete File from Cloudinary
// ============================================
exports.deleteFile = async (req, res) => {
    try {
        const { publicId, resourceType = 'image' } = req.body;

        if (!publicId) {
            return res.status(400).json({ message: 'publicId is required' });
        }

        const result = await deleteFromCloudinary(publicId, resourceType);

        res.json({
            message: 'File deleted successfully',
            result,
        });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            message: 'Failed to delete file',
            error: error.message,
        });
    }
};
