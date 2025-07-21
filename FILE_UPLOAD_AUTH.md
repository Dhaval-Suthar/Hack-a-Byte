# File Upload Authentication

The admin panel now uses a simple file upload authentication system instead of WebAuthn security keys.

## How it works

1. **Authentication Key**: The system expects a text file containing the exact string: `hackabyte-admin-key-2024`
2. **File Requirements**:
   - File type: `.txt` or `.key` or any text file
   - Maximum size: 1KB
   - Content: Must contain exactly `hackabyte-admin-key-2024` (case-sensitive)

## Usage

1. Navigate to `/admin`
2. You'll see the file upload authentication screen
3. Either drag and drop your authentication key file, or click to browse and select it
4. The system will validate the file content
5. If the key matches, you'll be granted access to the admin panel

## Authentication Key File

A sample authentication key file (`admin-key.txt`) has been created in the project root for testing purposes.

## Features

- **Drag & Drop**: Drag your authentication file directly onto the upload area
- **File Validation**: Checks file type, size, and content
- **Visual Feedback**: Shows upload progress and success/error states
- **Modern UI**: Beautiful gradient background with animations
- **Mobile Friendly**: Responsive design that works on all devices

## Security Notes

- The authentication key can be easily changed by modifying the `EXPECTED_AUTH_KEY` constant in the `FileUploadAuth` component
- For production use, consider storing the authentication key in environment variables
- The file size limit prevents large files from being uploaded
- Only text files are accepted to prevent malicious file uploads

## Changing the Authentication Key

To change the authentication key:

1. Open `/components/admin/FileUploadAuth.tsx`
2. Modify the `EXPECTED_AUTH_KEY` constant:
   ```typescript
   const EXPECTED_AUTH_KEY = 'your-new-authentication-key';
   ```
3. Create a new authentication key file with the new key
4. Distribute the new key file to authorized administrators
