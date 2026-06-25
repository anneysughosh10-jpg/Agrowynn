# Agrowynn — Expo (React Native) app

Farmer for every family. Organic, farm-to-consumer ordering for Hyderabad.

This is the real, buildable app project (not the web prototype). It runs on Android/iOS
via Expo and can be published to the Play Store with EAS.

## What's inside
- `App.js` — the whole app: splash, login (phone/email + OTP), location, home,
  shop + categories, product detail with farmer provenance, cart + coupons,
  checkout + payment options, order placed + tracking, orders, profile, search.
- `assets/` — your Agrowynn logo, app icon, adaptive icon, and splash image.
- `app.json`, `package.json`, `babel.config.js`, `index.js` — Expo config.

## Run it on your phone (5 minutes)
1. Install Node.js (LTS) and the Expo Go app on your phone.
2. In this folder:
   ```
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go. The app opens live on your phone.

## Build an installable Android app (APK / Play Store .aab)
1. Install the builder: `npm install -g eas-cli`
2. `eas login` (create a free Expo account first at expo.dev)
3. `eas build:configure`
4. APK to test on a phone:  `eas build -p android --profile preview`
   Play Store bundle:        `eas build -p android --profile production`
5. Submit to Play:           `eas submit -p android`
   (You'll need a Google Play Developer account — one-time $25.)

## IMPORTANT — what is real vs. simulated
To keep this runnable today, two things are **simulated** and need your own accounts
before they handle real users/money:

1. **Login / OTP** — right now any 4 digits log you in. For real accounts, plug in an
   auth provider. Easiest: Firebase Authentication (phone OTP + email).
   - Create a Firebase project, add the Expo SDK, replace the OTP step in `App.js`
     (the `authStep === 'otp'` block) with Firebase phone auth.

2. **Payments** — the checkout shows UPI/Card/COD and a "Processing payment" screen,
   but no money moves. For real payments in India, integrate **Razorpay**
   (`react-native-razorpay` or the Razorpay web checkout) or a UPI gateway.
   - Replace the `placeOrder()` function in `App.js` with a Razorpay order call,
     and confirm the order only after the payment success callback.

3. **Products & orders** — products are a fixed list in `App.js`, and orders live only
   in app memory. For a live catalogue, farmer listings, and saved orders, connect a
   backend (Firebase Firestore or Supabase are the quickest for a solo builder).

## Suggested next steps
- Connect Firebase (Auth + Firestore) so login, the product catalogue, and orders are real.
- Add Razorpay for payments.
- Wire the "Sell on Agrowynn" farmer flow to the same database (your Route Map Option 2).
- Add delivery-partner assignment and order notifications.

Built to match your logo and brand. Replace the data in `App.js` with your real
farmers and produce as you onboard them.
