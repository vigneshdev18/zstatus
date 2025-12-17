# ZStatus - Service Monitoring Platform

A comprehensive service monitoring platform built with Next.js, MongoDB, and intelligent incident detection.

## Features

### Phase 0 - Project Bootstrap ✓

- ✅ Next.js 15 with App Router
- ✅ TypeScript configuration
- ✅ TailwindCSS v4
- ✅ MongoDB integration
- ✅ Server-side scheduler (runs every minute)
- ✅ Heartbeat monitoring

### Upcoming Phases

- **Phase 1**: Service Configuration & Health Checks
- **Phase 2**: Incident Detection & Lifecycle
- **Phase 3**: Incident History & UI Visibility
- **Phase 4**: Service Dependencies & Correlation
- **Phase 5**: Alerting & Noise Reduction

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

### Installation

1. **Clone and navigate to the project**

```bash
cd ZStatus
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file (or update the existing one):

```bash
MONGODB_URI=mongodb://localhost:27017
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

MONGODB_DB=zstatus
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ZStatus/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── scheduler/     # Scheduler initialization
│   │   └── status/        # System status endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── lib/                   # Core utilities
│   ├── jobs/             # Scheduled jobs
│   │   └── heartbeat.ts  # Heartbeat job
│   ├── mongodb.ts        # MongoDB connection
│   └── scheduler.ts      # Job scheduler
├── .env.local            # Environment variables
└── package.json          # Dependencies
```

## Verification

### 1. Check Application Status

Visit http://localhost:3000 - you should see:

- Database status (connected/disconnected)
- Scheduler status
- Last heartbeat timestamp

### 2. Test API Endpoints

```bash
# Check system status
curl http://localhost:3000/api/status

# Check scheduler status
curl http://localhost:3000/api/scheduler
```

### 3. Verify Scheduler

Check your terminal console - you should see heartbeat logs every 60 seconds:

```
[Heartbeat] 2025-12-15T18:00:00.000Z
[Heartbeat] 2025-12-15T18:01:00.000Z
```

### 4. Verify Database

The heartbeats are stored in MongoDB. You can check with:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/zstatus

# Query heartbeats
db.heartbeats.find().sort({timestamp: -1}).limit(5)
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Scheduler

- Runs server-side using Node.js `setInterval`
- Initializes on Next.js server startup
- Supports multiple concurrent jobs
- Graceful shutdown handling

### Database

- MongoDB with singleton connection pattern
- Connection pooling in production
- Preserved connections in development (HMR)

## Next Steps

See `implementation_plan.md` for details on upcoming phases.

## Environment Variables

| Variable      | Description               | Default   |
| ------------- | ------------------------- | --------- |
| `MONGODB_URI` | MongoDB connection string | Required  |
| `MONGODB_DB`  | Database name             | `zstatus` |

## Troubleshooting

### MongoDB Connection Issues

1. **Local MongoDB**: Make sure MongoDB is running locally

```bash
# macOS with Homebrew
brew services start mongodb-community
```

2. **MongoDB Atlas**: Ensure your IP is whitelisted and credentials are correct

3. **Check connection string format**:
   - Local: `mongodb://localhost:27017`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`

### Scheduler Not Running

- Check console logs for "Scheduler initialized" message
- Visit `/api/scheduler` to verify scheduler status
- Ensure the development server fully restarted after code changes

## License

MIT

## Support

For issues and questions, please refer to the implementation plan and documentation.
