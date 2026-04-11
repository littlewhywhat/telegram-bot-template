// Vercel only discovers serverless handlers under root `api/`; implementation lives in `src/backend/api/`.
export { default } from '../src/backend/api/[[...route]].js';
