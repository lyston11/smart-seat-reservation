import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CampusIndoorMap from './CampusIndoorMap';
import type { Area } from '../types/seat';

function makeArea(overrides: Partial<Area> & Record<string, unknown>): Area {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'A 楼自习区',
    floor: overrides.floor ?? '1F',
    buildingCode: overrides.buildingCode ?? null,
    floorCode: overrides.floorCode ?? null,
    areaType: overrides.areaType ?? null,
    mapX: overrides.mapX ?? null,
    mapY: overrides.mapY ?? null,
    description: overrides.description ?? null,
    status: overrides.status ?? 'ACTIVE',
    openTime: overrides.openTime ?? '08:00:00',
    closeTime: overrides.closeTime ?? '22:00:00',
    checkinIpCidrs: overrides.checkinIpCidrs ?? '127.0.0.1/32',
  } as Area;
}

afterEach(() => {
  cleanup();
});

describe('CampusIndoorMap', () => {
  it('renders A/B buildings and connector areas for the selected floor', () => {
    const onSelectArea = vi.fn();

    render(
      <CampusIndoorMap
        areas={[
          makeArea({ id: 1, name: 'A 楼北自习区', floor: '1F' }),
          makeArea({ id: 2, name: 'B 楼南自习区', floor: '1F' }),
          makeArea({ id: 3, name: 'A/B 连廊学习区', floor: '1F', description: 'connector' }),
          makeArea({ id: 4, name: 'A 楼二层讨论区', floor: '2F' }),
        ]}
        selectedAreaId={2}
        onSelectArea={onSelectArea}
      />,
    );

    expect(screen.getByText('室内导航')).toBeTruthy();
    expect(screen.getByRole('radio', { name: '1F' })).toHaveProperty('checked', true);
    expect(screen.getByRole('radio', { name: '2F' })).toBeTruthy();
    expect(screen.getByText('A 楼')).toBeTruthy();
    expect(screen.getByText('A/B 连廊')).toBeTruthy();
    expect(screen.getByText('B 楼')).toBeTruthy();

    const buildingA = screen.getByLabelText('A 楼区域');
    const connector = screen.getByLabelText('A/B 连廊区域');
    const buildingB = screen.getByLabelText('B 楼区域');
    expect(within(buildingA).getByRole('button', { name: /A 楼北自习区/ })).toBeTruthy();
    expect(within(connector).getByRole('button', { name: /A\/B 连廊学习区/ })).toBeTruthy();
    const selectedArea = within(buildingB).getByRole('button', { name: /B 楼南自习区/ });
    expect(selectedArea.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(within(buildingA).getByRole('button', { name: /A 楼北自习区/ }));
    expect(onSelectArea).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'A 楼北自习区' }));

    fireEvent.click(screen.getByRole('radio', { name: '2F' }));
    expect(screen.getByRole('button', { name: /A 楼二层讨论区/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /B 楼南自习区/ })).toBeNull();
  });

  it('uses structured building and floor metadata before name inference', () => {
    render(
      <CampusIndoorMap
        areas={[
          makeArea({
            id: 1,
            name: 'A 楼命名但属于 B 楼',
            floor: '1F',
            buildingCode: 'B',
            floorCode: '3F',
            areaType: 'STUDY_ROOM',
            mapX: 80,
            mapY: 10,
          }),
          makeArea({
            id: 2,
            name: '普通 A 楼区域',
            floor: '3F',
            buildingCode: 'A',
            floorCode: '3F',
            areaType: 'STUDY_ROOM',
          }),
        ]}
        selectedAreaId={1}
        onSelectArea={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: '3F' })).toHaveProperty('checked', true);
    const buildingA = screen.getByLabelText('A 楼区域');
    const buildingB = screen.getByLabelText('B 楼区域');

    expect(within(buildingB).getByRole('button', { name: /A 楼命名但属于 B 楼/ })).toBeTruthy();
    expect(within(buildingA).queryByRole('button', { name: /A 楼命名但属于 B 楼/ })).toBeNull();
  });
});
