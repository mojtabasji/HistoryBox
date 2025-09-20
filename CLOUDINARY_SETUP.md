# Cloudinary Image Upload Setup Guide

## 🖼️ Cloudinary Configuration

Cloudinary is now integrated for handling image uploads in your History Box application.

## 📋 Setup Instructions

### 1. Create Cloudinary Account

1. **Sign up for Cloudinary**
   - Visit [Cloudinary.com](https://cloudinary.com/)
   - Create a free account (includes generous free tier)

2. **Get Your Credentials**
   - Go to your Cloudinary Dashboard
   - Find your credentials in the "Account Details" section:
     - Cloud Name
     - API Key
     - API Secret

### 2. Configure Environment Variables

Add your Cloudinary credentials to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 3. Set Up Upload Preset (Recommended)

1. **Go to Settings > Upload**
2. **Create Upload Preset**
   - Name: `history_box_preset`
   - Signing Mode: `Unsigned` (for client-side uploads)
   - Folder: `history_box`
   - Transformations:
     - Width: 1200 (max)
     - Height: 800 (max)
     - Crop: Limit
     - Quality: Auto
     - Format: Auto

### 4. Test the Integration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Add Memory**
   - Go to `http://localhost:3000/add-memory`
   - Try uploading an image
   - Check that it appears in your Cloudinary media library

## 🚀 Features Implemented

### **Image Upload Component** (`src/components/ImageUpload.tsx`)
- ✅ **Drag & Drop** support
- ✅ **Click to Upload** functionality
- ✅ **Image Preview** with editing options
- ✅ **File Validation** (type, size limits)
- ✅ **Upload Progress** indicator
- ✅ **Error Handling** with user feedback

### **API Route** (`src/app/api/upload/route.ts`)
- ✅ **Secure Server-side Upload** to Cloudinary
- ✅ **Image Optimization** (auto format, quality)
- ✅ **Error Handling** with detailed responses
- ✅ **Environment Validation**

### **Add Memory Page** (`src/app/add-memory/page.tsx`)
- ✅ **Complete Form** for creating memories
- ✅ **Image Upload Integration**
- ✅ **Location Picker Integration**
- ✅ **Form Validation** and user experience

## 📁 Files Created/Updated

```
src/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts         # Cloudinary upload API
│   ├── add-memory/
│   │   └── page.tsx             # Add memory form page
│   └── dashboard/
│       └── page.tsx             # Updated with Add Memory link
├── components/
│   └── ImageUpload.tsx          # Drag & drop image upload
├── lib/
│   └── config.js                # Added Cloudinary helpers
├── .env.local                   # Updated with Cloudinary vars
└── .env.example                 # Updated template
```

## 🔒 Security Features

- **Server-side Upload**: API key never exposed to client
- **File Validation**: Type and size checks
- **Upload Presets**: Controlled transformations
- **Environment Variables**: Sensitive data protected

## 📊 Image Optimization

Your images are automatically optimized with:
- **Format**: Auto-converted to best format (WebP, AVIF)
- **Quality**: Automatically optimized
- **Size**: Resized to max 1200x800 (configurable)
- **Compression**: Reduced file sizes

## 💰 Cloudinary Free Tier

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited uploads

Perfect for development and small applications!

## 🛠️ Usage Examples

### **Basic Upload:**
```jsx
import ImageUpload from '../components/ImageUpload';

function MyComponent() {
  const handleImageUpload = (imageUrl) => {
    console.log('Image uploaded:', imageUrl);
  };

  return (
    <ImageUpload onImageUpload={handleImageUpload} />
  );
}
```

### **With Current Image:**
```jsx
<ImageUpload 
  onImageUpload={handleImageUpload}
  currentImage="https://res.cloudinary.com/..."
/>
```

## 🔧 Troubleshooting

### **Upload Fails**
- Check Cloudinary credentials in `.env.local`
- Verify upload preset exists and is unsigned
- Check browser console for error details

### **Images Not Optimized**
- Verify transformations in upload preset
- Check Cloudinary dashboard settings

### **Large File Sizes**
- Client-side limit: 10MB (configurable)
- Cloudinary limits: Check your plan limits

## 🎯 Next Steps

1. **Test Image Uploads** with your Cloudinary account
2. **Customize Upload Preset** for your needs
3. **Integrate with Database** to save memory data
4. **Add Image Editing** features if needed
5. **Set up CDN** for global image delivery

Your image upload system is now ready for production use! 📸✨
