---
name: regalia-secrets-rotation
description: Regalia secrets were committed to git; .env now untracked but history still leaks — rotation still owed
metadata:
  type: project
---

`.env` and `.env.local` were committed to git with live secrets (Mongo `regalia:regalia`, `AUTH_SECRET=killshot`, Cloudinary secret, VAPID key). On 2026-06-21 both were `git rm --cached` and added to `.gitignore`, and `.env.example` was added.

**Still owed (user action, not done):** the secrets remain in git HISTORY. Untracking only stops future commits. Real fix = ROTATE all of them: new Mongo password, new `AUTH_SECRET` (`openssl rand -base64 32`), new Cloudinary secret, regenerate VAPID, then set them in the Vercel dashboard env vars (not in any committed file). Until rotated, treat all four as compromised.

Related: [[ordering-model-and-txns]].
