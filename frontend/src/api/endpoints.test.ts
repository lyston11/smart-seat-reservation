import { describe, expect, it } from 'vitest';
import { apiPaths } from './endpoints';

describe('apiPaths', () => {
  it('keeps reservation rule path as a centralized constant', () => {
    expect(apiPaths.reservationRules).toBe('/api/reservations/rules');
  });
});
