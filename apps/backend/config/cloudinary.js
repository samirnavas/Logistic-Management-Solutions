const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================
// Storage for Profile Pictures (Images only)
// ============================================
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
        ],
        public_id: (req, file) => `avatar_${req.params.userId}_${Date.now()}`,
    },
});

// ============================================
// Storage for Product Photos (Images only)
// ============================================
const productPhotoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
        ],
        public_id: (req, file) => `product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    },
});

// ============================================
// Storage for PDFs (Documents)
// ============================================
const pdfStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lms/documents',
        allowed_formats: ['pdf'],
        resource_type: 'raw',
        public_id: (req, file) => `doc_${Date.now()}_${file.originalname.replace('.pdf', '')}`,
    },
});

// ============================================
// Multer Upload Middleware
// ============================================
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('avatar');

const uploadProductPhotos = multer({
    storage: productPhotoStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).array('photos', 5); // Max 5 photos

const uploadPdf = multer({
    storage: pdfStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
}).single('document');

// ============================================
// Helper: Delete file from Cloudinary
// ============================================
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

// ============================================
// Helper: Extract public ID from Cloudinary URL
// ============================================
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{folder}/{public_id}.{format}
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathPart = parts[1];
    // Remove version (v1234567890/) if present
    const withoutVersion = pathPart.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
    return publicId;
};

module.exports = {
    cloudinary,
    uploadAvatar,
    uploadProductPhotos,
    uploadPdf,
    deleteFromCloudinary,
    getPublicIdFromUrl,
};
