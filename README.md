# Detickovo

Astro website for Detickovo. Most content is file-backed through Sveltia CMS, while `Akcie` Facebook posts are stored in MongoDB Atlas and rendered at runtime.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Akcie Admin

Facebook event posts are managed at `/admin/akcie`, not in Sveltia CMS. The admin writes directly to MongoDB, so new entries appear on `/akcie` and the homepage without creating Markdown or JSON files.

The default Facebook card height is `550`. Individual posts can override it in the admin when Facebook content is taller or shorter.

Required environment variables:

```env
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="detickovo"
ADMIN_SECRET="your-admin-password"
```

`MONGODB_DB` defaults to `detickovo`, but set it explicitly in Vercel. Add the same variables in Vercel project settings for production.

## Booking Form

Booking requests are handled by the Vercel endpoint at `/api/objednavka`. Set these environment variables in Vercel (and in `.env.local` for local testing); do not commit any secret values:

```env
PUBLIC_RECAPTCHA_SITE_KEY="XXX"
RECAPTCHA_SECRET_KEY="..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
RATE_LIMIT_SALT="a-long-random-secret"
SMTP_HOST="smtp.forpsi.com"
SMTP_PORT="465"
SMTP_USER="info@detickovoakcie.sk"
SMTP_PASSWORD="..."
SMTP_FROM="Detičkovo <info@detickovoakcie.sk>"
ORDER_RECIPIENT="info@detickovoakcie.sk"
```

Create a Google reCAPTCHA v2 Checkbox key for the production and preview domains used by the form. Create an Upstash Redis database and use its REST credentials for rate limiting. The SMTP credentials are the FORPSI mailbox credentials; test a preview deployment to confirm mail delivery before relying on the form in production.
