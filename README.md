# SpaceDash - Live ISS & News Dashboard

A complete web application for tracking the International Space Station, viewing the latest space news, and interacting with an AI assistant.

## Features
- **Live ISS Tracking**: Real-time position, speed calculation (Haversine formula), and 15-position trajectory path.
- **Astronaut Info**: See who is currently in space.
- **News Dashboard**: Latest news with search, sorting, and 15-minute caching.
- **AI Space Assistant**: A chatbot restricted to dashboard data (ISS stats + News) using Mistral-7B.
- **Data Visualization**: Interactive charts for ISS speed trends and news source distribution.
- **UI/UX**: Dark/Light mode support, responsive design, and toast notifications.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js (React-Leaflet)
- **Charts**: Chart.js (React-Chartjs-2)
- **AI**: Hugging Face Inference API
- **Icons**: Lucide-React
- **Animations**: Framer Motion

## Installation
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file in the root with:
   ```env
   VITE_NEWS_API_KEY=pub_353886c364ca459da285f35ad864b812
   VITE_AI_TOKEN=your_huggingface_token
   ```
4. Run `npm run dev`.

## Deployment
1. Push to GitHub.
2. Connect to Vercel.
3. Add environment variables (`VITE_NEWS_API_KEY`, `VITE_AI_TOKEN`).
4. Deploy.

## Notes
- ISS data is fetched every 15 seconds automatically.
- News is cached for 15 minutes to save API credits.
- The AI chatbot is context-aware and won't answer questions outside the dashboard's scope.
