# 🚀 Deploying Digital Menu to Vercel (Only Menu Section)

Ab aapka project completely **Digital Menu Only** mode me configure ho gaya hai. Aap jab is project ko Vercel par upload/deploy karenge, to sirf aur sirf Digital Menu customer visible hoga.

---

## 🛠️ Step 1: Connect your Database (MongoDB Atlas)

Ensure your `.env.local` or Vercel Environment Variables contain your MongoDB URI:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/regalia?retryWrites=true&w=majority
```

*(Note: Agar aap bina Database setup ke test kar rahe hain, to menu empty state show karega, dynamic menu ke liye MongoDB URI zaroori hai)*.

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

Run the following command in terminal:

```bash
npx vercel --prod
```

1. **Set up and deploy?** Press `y`
2. **Which scope?** Select your Vercel account
3. **Link to existing project?** Press `n` (if new)
4. **Project name?** Type `regalia-digital-menu` (or your preferred name)
5. **In which directory is your code located?** Press `Enter` (default `./`)
6. **Want to override settings?** Press `n`

### Option B: Deploying via GitHub (Automatic Updates)

1. Push your repository to GitHub (`git push origin main`).
2. Open [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: `<Your MongoDB Connection String>`
5. Click **Deploy**.

---

## 🎉 Result

Once deployed:
- **`https://<your-project>.vercel.app/`** -> Directly opens the **Digital Menu**!
- **Table QR Menu**: `https://<your-project>.vercel.app/?type=table&location=T1`
- **Room QR Menu**: `https://<your-project>.vercel.app/?type=room&location=R101`
- Admin, Login, Kitchen, and Cashier routes are automatically disabled & redirected to the Digital Menu home page.
