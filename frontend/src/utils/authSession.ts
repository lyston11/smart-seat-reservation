import { getStoredUser } from '../api/http';

export function isStudentSessionActive() {
  return getStoredUser()?.role === 'STUDENT';
}
