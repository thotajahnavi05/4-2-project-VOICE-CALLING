import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import corsOptions from './config/cors.js';
import { errorHandler, userIdMiddleware, logger } from './middleware/index.js';
import { startAutoBookingPoller } from './services/autoBookingPoller.js';

// Route imports
import callRoutes from './routes/calls.js';
import assistantRoutes from './routes/assistants.js';
import campaignRoutes from './routes/campaigns.js';
import bookingRoutes from './routes/booking.js';
import bolnaWebhooks from './routes/bolna-webhooks.js';
import bolnaVoiceRoutes from './routes/bolna/voices.js';
import bolnaModelRoutes from './routes/bolna/models.js';
import bolnaKBRoutes from './routes/bolna/knowledgeBase.js';
import bolnaPhoneRoutes from './routes/bolna/phoneNumbers.js';
import bolnaExecutionRoutes from './routes/bolna/executions.js';
import bolnaTranscriptRoutes from './routes/bolna/transcripts.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(userIdMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Voice Calling India API is running',
    region: 'India',
    provider: 'Bolna',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/calls', callRoutes);
app.use('/api/assistants', assistantRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/booking', bookingRoutes);

// Bolna specific routes
app.use('/api/bolna/voices', bolnaVoiceRoutes);
app.use('/api/bolna/models', bolnaModelRoutes);
app.use('/api/bolna/knowledge-base', bolnaKBRoutes);
app.use('/api/bolna/phone-numbers', bolnaPhoneRoutes);
app.use('/api/bolna/executions', bolnaExecutionRoutes);
app.use('/api/bolna/transcripts', bolnaTranscriptRoutes);

// Webhooks
app.use('/webhooks/bolna', bolnaWebhooks);

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Voice Calling India Backend running on port ${PORT}`);
    console.log(`📍 Region: India | Provider: Bolna`);
    console.log(`🔗 API: http://localhost:${PORT}/api/health`);
    console.log(`📞 Webhook: http://localhost:${PORT}/webhooks/bolna\n`);
  });

  // Start auto booking poller
  startAutoBookingPoller(30000);
};

start().catch(console.error);
