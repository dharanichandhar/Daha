# DAHA Clothing Store

A production-oriented MERN stack e-commerce application for DAHA Clothing Store, Trichy, Tamil Nadu, India.

## Tech Stack

- **Frontend**: React 19, React Router v7 (Framework Mode with SSR), Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod
- **Backend**: Node.js, Express.js, Mongoose, MongoDB Atlas
- **External Services**: Cloudinary (images), Google Identity Services (auth), Nodemailer (emails)
- **Orders**: WhatsApp click-to-chat checkout (no online payment provider)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Cloudinary account
- Google Cloud Console project

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd daha

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### Environment Setup

```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit server/.env with your credentials
# Edit client/.env with public credentials
```

### Database Setup

```bash
# Create/refresh only the base categories (Men, Women, Kids)
npm run seed:categories

# Create the first admin from environment variables
npm run seed:admin

# Optional one-time cleanup for databases used with an older DAHA build.
# This removes ONLY products marked seedSource=development.
# Men/Women/Kids categories and Admin-created products are preserved.
npm run seed:clear
```

## Project Structure

```
daha/
├── client/          # React Router v7 SSR frontend
├── server/          # Express.js API server
├── client/.env.example  # Public frontend environment template
├── server/.env.example  # Backend environment template
├── package.json     # Root workspace scripts
└── README.md
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start client + server in development mode |
| `npm run build` | Build both client and server |
| `npm start` | Start production server |
| `npm run seed:categories` | Seed only categories |
| `npm run seed:admin` | Seed first admin user |
| `npm run seed:clear` | Clear only development seed products |
| `npm run catalogue:clear-demo` | Clear development demo products and legacy starter category images |

## Admin Access

Admin users have `role = "admin"`. To create the first admin:

1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `server/.env`
2. Run `npm run seed:admin`
3. Login at `/admin/login` with the configured credentials

## Environment Variables

See `server/.env.example` for backend variables and `client/.env.example` for public frontend variables. Key variables:

- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Authentication token secret
- `GOOGLE_CLIENT_ID` - Google Sign-In client ID
- `CLOUDINARY_*` - Cloudinary image hosting credentials
- `SMTP_*` - Email sending credentials

## License

Private - DAHA Clothing Store

### Demo catalogue note

Demo product seeding is intentionally removed. The storefront has no hardcoded product catalogue. Products appear only after they exist in MongoDB, normally after an Admin creates them. The homepage also has no hardcoded Men/Women/Kids clothing artwork. If an older database still contains development demo data, run `npm run catalogue:clear-demo` once.
