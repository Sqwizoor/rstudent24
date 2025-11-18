# 🎉 Referral & Voucher System - Student24

## Overview
Complete "Invite a Friend and Get a Voucher" promotional system that incentivizes users to refer friends to the platform. Both the referrer and the referred friend receive R500 vouchers when the friend completes their first booking.

## Features

### 🎁 For Users
- **Unique Referral Codes**: Each user gets a personalized referral code (e.g., `JOH4X7Y2`)
- **R500 Vouchers**: Both parties receive R500 vouchers when the referral completes
- **Unlimited Referrals**: No cap on how many friends you can refer
- **Referral Dashboard**: Track all referrals and vouchers in one place
- **Easy Sharing**: Share via WhatsApp, Email, or copy the code
- **Voucher Management**: View active, used, and expired vouchers

### 📊 For Business
- **Growth Tracking**: Monitor referral success rates
- **User Acquisition**: Cost-effective customer acquisition channel
- **Engagement**: Keeps users actively involved with the platform
- **Data Analytics**: Track referral patterns and conversion rates

## System Architecture

### Database Schema

#### Referral Model
```prisma
model Referral {
  id                  Int       @id @default(autoincrement())
  referralCode        String    @unique
  referrerCognitoId   String    // Person who refers
  referredCognitoId   String?   // Person who was referred
  referredEmail       String?   // Email tracking before signup
  createdAt           DateTime  @default(now())
  completedAt         DateTime?
  isCompleted         Boolean   @default(false)
  voucherGenerated    Boolean   @default(false)
}
```

#### Voucher Model
```prisma
model Voucher {
  id              Int           @id @default(autoincrement())
  code            String        @unique
  ownerCognitoId  String
  discountAmount  Float         // R500
  discountPercent Float?        // Optional %
  status          VoucherStatus @default(Active)
  expiresAt       DateTime      // 90 days validity
  usedAt          DateTime?
  createdAt       DateTime      @default(now())
  referralId      Int?
}
```

#### Voucher Status Enum
- `Active`: Can be used
- `Used`: Already redeemed
- `Expired`: Past expiry date

### API Endpoints

#### GET /api/referrals
**Purpose**: Fetch user's referral information

**Response**:
```json
{
  "referralCode": "JOH4X7Y2",
  "referrals": [
    {
      "id": 1,
      "referralCode": "JOH4X7Y2",
      "referred": {
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "isCompleted": true,
      "completedAt": "2025-01-05T10:30:00Z"
    }
  ],
  "vouchers": [
    {
      "id": 1,
      "code": "REFER4X7Y2ABC",
      "discountAmount": 500,
      "status": "Active",
      "expiresAt": "2025-04-05T10:30:00Z"
    }
  ],
  "stats": {
    "totalReferrals": 5,
    "completedReferrals": 3,
    "pendingReferrals": 2,
    "totalVouchers": 3,
    "activeVouchers": 2
  }
}
```

#### POST /api/referrals
**Purpose**: Handle referral actions (validate, apply, complete)

**Actions**:

1. **Validate Referral Code**
```json
{
  "action": "validate",
  "referralCode": "JOH4X7Y2"
}
```

2. **Apply Referral Code** (during signup)
```json
{
  "action": "apply",
  "referralCode": "JOH4X7Y2"
}
```

3. **Complete Referral** (after booking)
```json
{
  "action": "complete",
  "referralId": 123
}
```

#### GET /api/vouchers
**Purpose**: Fetch user's vouchers

#### POST /api/vouchers
**Purpose**: Validate or use a voucher

**Actions**:

1. **Validate Voucher**
```json
{
  "action": "validate",
  "voucherCode": "REFER4X7Y2ABC"
}
```

2. **Use Voucher**
```json
{
  "action": "use",
  "voucherCode": "REFER4X7Y2ABC"
}
```

## Frontend Components

### 1. ReferralSection (Landing Page)
**Location**: `/src/app/(nondashboard)/landing/ReferralSection.tsx`

**Features**:
- Eye-catching gradient background (purple → pink → orange)
- Animated floating elements
- "How It Works" 3-step guide
- Social proof statistics
- WhatsApp & Email sharing buttons
- Responsive design

**Design Elements**:
- Framer Motion animations
- Gradient voucher card mockup
- Floating badges (🎉 R500 OFF, 💰 Easy Money)
- Stats counter (10K+ Students, R2M+ Earned)

### 2. ReferralDashboard
**Location**: `/src/components/ReferralDashboard.tsx`

**Features**:
- Stats overview cards:
  - Total Referrals
  - Completed Referrals
  - Active Vouchers
  - Total Earned
- Referral code display with copy functionality
- Share via WhatsApp/Email buttons
- Tabbed interface:
  - **Referrals Tab**: List of all referrals with status
  - **Vouchers Tab**: List of all vouchers with status
- Real-time status updates
- Dark mode support

### 3. User Access
**Route**: `/tenants/referrals`

Accessible from the tenant dashboard navigation.

## User Flow

### Scenario 1: User A Refers User B

1. **User A signs up** → Automatically gets referral code `ABC123`
2. **User A shares code** with User B via WhatsApp/Email
3. **User B signs up** using code `ABC123`
4. **User B books a room** → Triggers referral completion
5. **System generates vouchers**:
   - User A gets `REFERXXX1` (R500)
   - User B gets `REFERXXX2` (R500)
6. **Both users receive notifications** about their vouchers
7. **Users can use vouchers** on future bookings

### Referral Code Generation
Format: `[FIRST_3_LETTERS][6_RANDOM_CHARS]`
- Example: `JOH4X7Y2` (for John)
- Ensures uniqueness and personalization

### Voucher Code Generation
Format: `REFER[8_RANDOM_CHARS]`
- Example: `REFER4X7Y2ABC`
- Ensures uniqueness

## Integration Points

### Signup Process
When a user signs up with a referral code:
```typescript
// During signup
await fetch('/api/referrals', {
  method: 'POST',
  body: JSON.stringify({
    action: 'apply',
    referralCode: 'ABC123'
  })
});
```

### Booking Process
After a user completes their first booking:
```typescript
// In booking completion handler
await fetch('/api/referrals', {
  method: 'POST',
  body: JSON.stringify({
    action: 'complete',
    referralId: referralId
  })
});
```

### Payment Process
When applying a voucher to a payment:
```typescript
// Before payment
const validation = await fetch('/api/vouchers', {
  method: 'POST',
  body: JSON.stringify({
    action: 'validate',
    voucherCode: 'REFERXXX1'
  })
});

if (validation.valid) {
  // Apply discount to total
  const newTotal = originalTotal - validation.voucher.discountAmount;
  
  // After successful payment
  await fetch('/api/vouchers', {
    method: 'POST',
    body: JSON.stringify({
      action: 'use',
      voucherCode: 'REFERXXX1'
    })
  });
}
```

## Installation & Setup

### 1. Database Migration
Run the migration to add the necessary tables:

```bash
cd "c:\Users\Mr Ness\Documents\Project\Rental App\client"
npx prisma migrate dev --name add_referral_voucher_system
```

Or manually run the SQL file:
```bash
psql -h your-host -d student24 -U your-user -f prisma/migrations/manual_add_referral_voucher_system.sql
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Verify Installation
```bash
npm run dev
```

Visit:
- Homepage: See the referral section
- Tenant Dashboard: `/tenants/referrals` to view referral dashboard

## Configuration

### Voucher Settings
Edit in `/src/app/api/referrals/route.ts`:

```typescript
// Voucher amount
discountAmount: 500, // R500

// Voucher expiry
expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
```

### Referral Completion Trigger
Decide when a referral is "completed":
- First booking
- First payment
- Account verification
- Custom milestone

Update the logic in your booking/payment flow to call:
```typescript
POST /api/referrals { action: 'complete', referralId }
```

## Analytics & Monitoring

### Key Metrics to Track
1. **Referral Rate**: % of users who refer others
2. **Conversion Rate**: % of referred users who sign up
3. **Completion Rate**: % of referred users who complete bookings
4. **Voucher Redemption Rate**: % of vouchers used
5. **Average Referrals per User**: Growth metric
6. **Cost per Acquisition**: Voucher value vs customer LTV

### Example Query
```sql
-- Referral performance
SELECT 
  COUNT(*) as total_referrals,
  SUM(CASE WHEN "isCompleted" THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN "voucherGenerated" THEN 1 ELSE 0 END) as vouchers_generated
FROM "Referral"
WHERE "createdAt" >= NOW() - INTERVAL '30 days';
```

## Future Enhancements

### Phase 2 Ideas
- [ ] Tiered rewards (Bronze/Silver/Gold referrers)
- [ ] Limited-time bonus campaigns (2x vouchers week)
- [ ] Referral leaderboard
- [ ] Social media integration (share on Facebook, Twitter)
- [ ] Email notifications for referral milestones
- [ ] Push notifications
- [ ] Referral contests
- [ ] Ambassador program for top referrers
- [ ] Custom referral landing pages
- [ ] A/B testing different voucher amounts

### Integration Ideas
- [ ] Track referral source (WhatsApp, Email, Direct)
- [ ] UTM parameters for marketing attribution
- [ ] CRM integration
- [ ] Analytics dashboard for admins
- [ ] Automated fraud detection
- [ ] Referral code in QR format
- [ ] Referral widgets for partners

## Support & Troubleshooting

### Common Issues

**Issue**: Referral code not generating
- **Solution**: Ensure user has a Tenant record with a name
- Check: `SELECT * FROM "Tenant" WHERE "cognitoId" = 'user-id';`

**Issue**: Voucher not applying to payment
- **Solution**: Check voucher status and expiry date
- Verify: `SELECT * FROM "Voucher" WHERE "code" = 'voucher-code';`

**Issue**: Referral not completing after booking
- **Solution**: Ensure booking completion triggers the complete action
- Add logging to track the flow

### Debug Mode
Enable API logging in the route handlers:
```typescript
console.log("Referral action:", { userId, action, referralCode });
```

## Marketing Copy

### Email Template
```
Subject: 🎉 Get R500 OFF Your Next Booking!

Hey [Name],

Great news! Your friend [Referrer Name] wants you to join Student24.

Use code: [REFERRAL_CODE]

When you sign up and book your first room, you BOTH get R500 vouchers!

[Sign Up Now Button]
```

### Social Media Post
```
🏠 Looking for student accommodation?

Use my Student24 referral code: [CODE]

We BOTH get R500 vouchers! 💰

👉 [Link]

#Student24 #StudentAccommodation #Referral
```

## License & Credits
Part of the Student24 platform referral system.

---

**Questions?** Contact the development team.
**Last Updated**: January 2025
