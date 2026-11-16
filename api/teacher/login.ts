import { handleTeacherLogin } from '../../src/server/teacherAuthRoutes.js';

export function POST(request: Request): Promise<Response> {
  return handleTeacherLogin(request);
}
