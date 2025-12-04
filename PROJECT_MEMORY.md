# Prize Wheel Project Memory

## Project Overview
A chicken-themed slot machine application built with Next.js and AWS Amplify. Users can spin a slot machine every 2 hours to win prizes.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: AWS Amplify (Auth + Data)
- **Database**: DynamoDB (managed by Amplify)
- **Authentication**: AWS Cognito (email-based)

## Key Features

### 1. Chicken Slot Machine
- 3 reels with 7 chicken-themed emojis: 🐔, 🐓, 🐣, 🐤, 🐥, 🥚, 🍗
- 10% chance to win (must match all 3 chickens)
- Animated reels that stop sequentially for suspense
- Located at: `components/ChickenSlotMachine.tsx`

### 2. Spin Timing System
- Users can spin every **2 hours**
- Countdown timer shows HH:MM:SS until next spin
- Timer component: `components/CountdownTimer.tsx`
- Cooldown constant: `SPIN_COOLDOWN_HOURS = 2` in `app/page.tsx`

### 3. Admin Panel (`/admin`)
- **Prize Management**:
  - Add prizes (name, description, redirect URL, color)
  - Activate/deactivate prizes
  - Delete prizes
  - Color picker for wheel segments

- **User Management**:
  - View all users who have spun
  - See last spin time (date + time)
  - See prizes won count
  - Reset spin timer (sets to 3 hours ago)
  - "Can Spin Now?" status indicator

### 4. Authorization
- **Regular users**: Can read prizes and manage their own spins
- **Admin users**: Full CRUD on prizes, can view/reset all user spins
- Admin access requires being in "admins" group in AWS Cognito

## Database Schema

### Prize Model
```typescript
{
  id: string (auto-generated)
  name: string (required)
  description: string (optional)
  redirectUrl: string (required) // Where winners are redirected
  color: string (hex color for display)
  isActive: boolean (default: true) // Only active prizes appear in slot machine
}
```

### UserSpin Model
```typescript
{
  id: string (auto-generated)
  userId: string (required) // Cognito user ID
  lastSpinTime: datetime (required) // Exact timestamp of last spin
  prizesWon: string[] (array of prize IDs)
  owner: string (Cognito username for authorization)
}
```

## Important Files

### Components
- `components/ChickenSlotMachine.tsx` - Main slot machine with 3 reels
- `components/CountdownTimer.tsx` - HH:MM:SS countdown timer
- `components/ConfigureAmplify.tsx` - Amplify configuration wrapper

### Pages
- `app/page.tsx` - Main page with slot machine
- `app/admin/page.tsx` - Admin panel for prize and user management
- `app/layout.tsx` - Root layout with Amplify config

### Backend
- `amplify/backend.ts` - Main Amplify backend definition
- `amplify/auth/resource.ts` - Email-based authentication config
- `amplify/data/resource.ts` - DynamoDB schema definition
- `amplify/package.json` - ES module config (`"type": "module"`)

## Design & Styling
- Inspired by pocketmacro.com aesthetic
- Purple/pink gradient theme
- Clean, modern UI with responsive design
- Slot machine has yellow/gold cabinet with red header
- Reels are centered and fill the width of the header

## Game Mechanics

### Spinning Flow
1. User clicks "PULL THE LEVER!"
2. `handleSpin()` is called immediately → records spin time in DB
3. Button is disabled (`canSpin = false`)
4. Slot machine determines win/loss (10% chance)
5. Reels spin and stop one by one
6. If win: `handleWin()` → adds prize to user's won list, deactivates prize, redirects to prize URL after 2 seconds
7. If loss: Shows "No luck this time!" message
8. Countdown timer appears showing time until next spin (2 hours)

### Win Logic
- Match all 3 chickens = WIN
- Random prize selected from active prizes
- Prize is marked as `isActive: false` (removed from future spins)
- User redirected to `prize.redirectUrl` after 2-second delay

## Development Notes

### Amplify Sandbox
- Run: `npx ampx sandbox` (in prize-wheel directory)
- Watches for file changes and auto-deploys
- Generates `amplify_outputs.json` with backend config
- Must be running for the app to work

### Running the App
```bash
cd prize-wheel
npx ampx sandbox  # Terminal 1
npm run dev       # Terminal 2
```

### Adding Users to Admin Group
1. Go to AWS Console → Cognito → User Pools
2. Find user pool with ID from `amplify_outputs.json`
3. Create "admins" group if it doesn't exist
4. Add users to the group
5. Users must sign out and sign back in for group membership to take effect

## Known Issues & Fixes

### Issue: Infinite Spinning Bug
**Fixed**: Originally only recorded spins on wins, allowing infinite spins if you lost. Now records every spin attempt via `handleSpin()` callback.

### Issue: Module Resolution Error
**Fixed**: Added `amplify/package.json` with `"type": "module"` to enable ES modules for Amplify backend.

### Issue: Amplify Not Configured
**Fixed**: Moved `Amplify.configure()` to `useEffect` in `ConfigureAmplify.tsx` component.

## Future Enhancements (Not Implemented)
- Email notifications when users win
- Prize history/leaderboard
- Customizable spin cooldown per user
- Sound effects for spinning
- Analytics dashboard
- Bulk prize import

## Logo
- Pocket Macro logo should be added to header
- File location: `public/pocket-macro-logo.png`
- Display in navigation bar

## Environment
- Windows development environment (MSYS_NT)
- Git repository (not pushed to remote)
- Package manager: npm
- Node.js 18+

## Last Session Work
- Changed from daily prize wheel to 2-hour slot machine
- Added countdown timer component
- Updated database schema from Date to DateTime
- Fixed admin panel to show time + date
- Implemented chicken-themed slot machine (10% win chance)
- Fixed infinite spin bug
- Added user management to admin panel
