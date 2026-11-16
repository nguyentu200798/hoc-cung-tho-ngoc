import { handleTeacherLogout } from '../../src/server/teacherAuthRoutes.js';

export function POST(request: Request): Response {
  return handleTeacherLogout(request);
}
