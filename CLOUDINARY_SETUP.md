# Cloudinary Setup Instructions

## 1. Get Cloudinary Credentials

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up for a free account if you don't have one
3. Once logged in, you'll see your Dashboard with:
   - **Cloud Name**
   - **API Key** 
   - **API Secret**

## 2. Update Environment Variables

Update the `.env` file in both locations:
- `/functions/.env`
- `/.env` (root directory)

Replace the placeholder values:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

## 3. Example Configuration

```env
CLOUDINARY_CLOUD_NAME=my-app-demo
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## 4. Test Your Setup

1. Start your server: `npm run dev`
2. Test upload endpoint: `POST http://localhost:3000/api/upload`
3. Test get endpoint: `GET http://localhost:3000/api/uploads`

## 5. API Endpoints

- **Upload File**: `POST /api/upload`
  - Form-data with field name: `file`
  - Supported formats: CSV, XLSX, XLS
  - Max file size: 50MB

- **Get Latest File**: `GET /api/uploads`
  - Returns file metadata and parsed content

## 6. Response Format

```json
{
  "message": "File uploaded successfully",
  "fileUrl": "https://res.cloudinary.com/...",
  "cloudinaryPublicId": "excel_uploads/latest_uploaded_file",
  "content": [
    {"column1": "value1", "column2": "value2"}
  ],
  "metadata": {
    "filename": "data.xlsx",
    "size": 12345,
    "format": "xlsx"
  }
}
```

## 7. Features

- ✅ Automatic file replacement (same filename)
- ✅ CSV and Excel file parsing
- ✅ Cloud storage with CDN
- ✅ File validation
- ✅ Error handling
- ✅ Temporary file cleanup

## 8. Security Notes

- Never commit your `.env` file to version control
- Keep your API secret secure
- The `.env` files are already in `.gitignore`