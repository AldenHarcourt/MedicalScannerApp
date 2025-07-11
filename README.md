# Medical Device Scanner - Web Application

A professional web application for scanning medical device barcodes and managing inventory, built with Next.js and Tailwind CSS.

## Features

- 🔐 **Secure Authentication**: Access code-based login system with Supabase
- 📱 **Barcode Scanning**: Real-time QR code and barcode scanning using device camera
- 📊 **Device Lookup**: Automatic device information retrieval from GUDID API
- 📋 **Inventory Management**: Add, review, and manage scanned devices
- 📁 **CSV Export**: Export inventory data as CSV files for further processing
- 🎨 **Professional UI**: Dark theme with cyan/aqua accents for medical environments
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Barcode Scanning**: react-qr-reader
- **Authentication**: Supabase
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for authentication)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp env.local.example .env.local
```

Then update the `.env.local` file with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. **Push to GitHub**: Commit and push your code to a GitHub repository

2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

3. **Environment Variables**: 
   - In your Vercel project settings, add the environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**: Vercel will automatically deploy your application

## Supabase Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and anon key

### 2. Create Access Codes Table
Run this SQL in your Supabase SQL editor:

```sql
-- Create the access_codes table
CREATE TABLE access_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to only allow valid, non-expired codes
CREATE POLICY "Valid access codes only" ON access_codes
  FOR SELECT USING (
    expires_at > NOW()
  );

-- Insert a test access code (replace 'YOUR_CODE' with your desired code)
INSERT INTO access_codes (code) VALUES ('YOUR_CODE');
```

## Usage

1. **Login**: Enter your access code to unlock the application
2. **Scan**: Click "Start Scanning" and point your camera at a medical device barcode
3. **Review**: The scanned device information will populate the form
4. **Add**: Click "Add to List" to add the device to your inventory
5. **Export**: Click "Export as CSV" to download your inventory as a CSV file

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support (requires HTTPS for camera access)
- Mobile browsers: Full support

## Security Notes

- Access codes are validated against Supabase with Row Level Security
- Camera access requires HTTPS in production
- No sensitive data is stored locally
- CSV exports are generated client-side

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS in production
- Check browser permissions for camera access
- Try refreshing the page

### Login Issues
- Verify your Supabase credentials in `.env.local`
- Check that your access code exists in the database
- Ensure the access code hasn't expired

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## License

This project is licensed under the MIT License. 