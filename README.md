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

Required environment variables:

```env
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="detickovo"
ADMIN_SECRET="your-admin-password"
```

`MONGODB_DB` defaults to `detickovo`, but set it explicitly in Vercel. Add the same variables in Vercel project settings for production.
