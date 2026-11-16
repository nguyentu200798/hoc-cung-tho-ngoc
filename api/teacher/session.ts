import { handleTeacherSession } from '../../src/server/teacherAuthRoutes.js';

export function GET(request: Request): Response {
  return handleTeacherSession(request);
}
