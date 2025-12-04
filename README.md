# Prize Wheel

A modern prize wheel application built with Next.js and AWS Amplify. Users can spin a prize wheel once per day, and administrators can manage prizes through an admin panel.

## Features

- **Daily Prize Wheel**: Users can spin the wheel once every 24 hours
- **User Authentication**: Powered by AWS Amplify Auth with email login
- **Prize Management**: Admin panel at `/admin` to add, edit, and manage prizes
- **Auto-Redirect**: Winners are automatically redirected to prize-specific URLs
- **Prize Removal**: Won prizes are automatically removed from the wheel
- **Responsive Design**: Clean, modern UI inspired by pocketmacro.com

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript**
- **Tailwind CSS**
- **AWS Amplify** for backend (Auth + Data)
- **DynamoDB** for database (managed by Amplify)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- AWS Account
- AWS CLI configured (optional, but recommended)

### Installation

1. Navigate to the project directory:
```bash
cd prize-wheel
```

2. Install dependencies:
```bash
npm install
```

3. Start the Amplify sandbox:
```bash
npx ampx sandbox
```

This will:
- Deploy your backend to AWS
- Create DynamoDB tables
- Set up authentication
- Generate the `amplify_outputs.json` file

4. In a new terminal, start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### For Users

1. Sign up or log in with your email
2. Spin the wheel once per day
3. If you win, you'll be redirected to the prize URL after 2 seconds

### For Admins

1. Navigate to `/admin`
2. Add new prizes with:
   - Prize name
   - Description (optional)
   - Redirect URL (where winners will be sent)
   - Color for the wheel segment
3. Activate/deactivate prizes
4. Delete prizes as needed

## Database Schema

### Prize Table
- `id`: String (auto-generated)
- `name`: String (required)
- `description`: String (optional)
- `redirectUrl`: String (required)
- `color`: String (hex color for wheel segment)
- `isActive`: Boolean (determines if prize appears on wheel)

### UserSpin Table
- `id`: String (auto-generated)
- `userId`: String (required, linked to authenticated user)
- `lastSpinDate`: Date (required, tracks last spin)
- `prizesWon`: Array of strings (prize IDs)

## Security

- User authentication required for all operations
- Users can only read prizes and manage their own spin records
- Admin group required for prize management (you'll need to add users to the "admins" group in AWS Cognito)

## Deployment

To deploy to production:

1. Deploy the backend:
```bash
npx ampx sandbox delete
npx ampx generate outputs --branch main
```

2. Deploy to your preferred hosting (Vercel, AWS Amplify Hosting, etc.)

For Vercel:
```bash
npm run build
vercel --prod
```

## Environment Variables

The `amplify_outputs.json` file is auto-generated and contains all necessary configuration. Do not commit this file to version control in production - use environment-specific configurations instead.

## Customization

### Changing the Wheel Animation
Edit `components/PrizeWheel.tsx` and adjust the `spinWheel` function's timing and easing.

### Styling
- Global styles: `app/globals.css`
- Component-specific: Inline Tailwind classes
- Colors: Update the gradient colors in `app/page.tsx` and `app/admin/page.tsx`

## Troubleshooting

**Amplify sandbox not starting:**
- Make sure you're in the project directory
- Check that the `amplify` folder exists
- Run `npm install @aws-amplify/backend @aws-amplify/backend-cli`

**Authentication errors:**
- Make sure the sandbox is running
- Check that `amplify_outputs.json` exists
- Clear browser cache and try again

**Can't access admin panel:**
- Make sure you're logged in
- Add your user to the "admins" group in AWS Cognito User Pools
- The admin panel requires group-based authorization

## License

MIT
