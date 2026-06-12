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
  it('renders only A-B and B-C teaching building connector study areas with occupancy for the selected floor', () => {
    const onSelectArea = vi.fn();

    render(
      <CampusIndoorMap
        areas={[
          makeArea({ id: 1, name: 'A 楼北自习区', floor: '1F' }),
          makeArea({ id: 2, name: 'B 楼南自习区', floor: '1F' }),
          makeArea({ id: 3, name: 'A/B 连廊学习区', floor: '2F', description: 'connector' }),
          makeArea({ id: 4, name: 'B/C 连廊学习区', floor: '2F', description: 'B/C connector' }),
          makeArea({ id: 5, name: 'A 楼二层讨论区', floor: '2F' }),
        ]}
        selectedAreaId={3}
        areaOccupancy={{
          3: { total: 4, occupied: 2 },
          4: { total: 5, occupied: 1 },
        }}
        onSelectArea={onSelectArea}
      />,
    );

    expect(screen.getByText('室内导航')).toBeTruthy();
    expect(screen.getByRole('radio', { name: '2F' })).toBeTruthy();
    expect(screen.queryByText('A 楼')).toBeNull();
    expect(screen.queryByText('B 楼')).toBeNull();
    expect(screen.queryByText('C 楼')).toBeNull();
    expect(screen.queryByText('D 楼')).toBeNull();
    expect(screen.queryByRole('button', { name: /A 楼北自习区/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /B 楼南自习区/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /A 楼二层讨论区/ })).toBeNull();

    const connector = screen.getByLabelText('A-B教学楼连廊区域');
    const bcConnector = screen.getByLabelText('B-C教学楼连廊区域');
    const selectedArea = within(connector).getByRole('button', { name: /A-B教学楼连廊学习区/ });
    expect(selectedArea.getAttribute('aria-pressed')).toBe('true');
    expect(within(connector).getByRole('button', { name: /A-B教学楼连廊学习区/ })).toBeTruthy();
    expect(within(bcConnector).getByRole('button', { name: /B-C教学楼连廊学习区/ })).toBeTruthy();
    expect(within(connector).getByText('占用率 50%')).toBeTruthy();
    expect(within(bcConnector).getByText('占用率 20%')).toBeTruthy();

    fireEvent.click(within(bcConnector).getByRole('button', { name: /B-C教学楼连廊学习区/ }));
    expect(onSelectArea).toHaveBeenCalledWith(expect.objectContaining({ id: 4, name: 'B/C 连廊学习区' }));
  });

  it('shows connector zones only on 2F and 3F, including A-B and B-C connectors', () => {
    render(
      <CampusIndoorMap
        areas={[
          makeArea({ id: 1, name: 'A 楼一层自习区', floor: '1F' }),
          makeArea({ id: 2, name: 'B 楼一层自习区', floor: '1F' }),
          makeArea({ id: 3, name: 'C 楼一层自习区', floor: '1F' }),
          makeArea({ id: 4, name: 'D 楼一层自习区', floor: '1F' }),
          makeArea({ id: 5, name: 'A/B 连廊一层误配区域', floor: '1F', description: 'connector' }),
          makeArea({ id: 6, name: 'A/B 连廊二层学习区', floor: '2F', description: 'A/B connector' }),
          makeArea({ id: 7, name: 'B/C 连廊二层学习区', floor: '2F', description: 'B/C connector' }),
          makeArea({ id: 8, name: 'B/C 连廊三层学习区', floor: '3F', description: 'B/C connector' }),
          makeArea({ id: 9, name: 'A/B 连廊四层误配区域', floor: '4F', description: 'A/B connector' }),
          makeArea({ id: 10, name: 'A 楼四层自习区', floor: '4F' }),
        ]}
        selectedAreaId={6}
        onSelectArea={vi.fn()}
      />,
    );

    expect(screen.queryByRole('radio', { name: '1F' })).toBeNull();
    expect(screen.getByRole('radio', { name: '2F' })).toHaveProperty('checked', true);
    expect(screen.getByLabelText('A-B教学楼连廊区域')).toBeTruthy();
    expect(screen.getByLabelText('B-C教学楼连廊区域')).toBeTruthy();
    expect(screen.getByRole('button', { name: /A-B教学楼连廊二层学习区/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /B-C教学楼连廊二层学习区/ })).toBeTruthy();
    expect(screen.queryByLabelText('A 楼区域')).toBeNull();
    expect(screen.queryByLabelText('B 楼区域')).toBeNull();
    expect(screen.queryByLabelText('C 楼区域')).toBeNull();
    expect(screen.queryByLabelText('D 楼区域')).toBeNull();
    expect(screen.queryByText('C/D 连廊')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: '3F' }));
    expect(screen.getByLabelText('B-C教学楼连廊区域')).toBeTruthy();
    expect(screen.getByRole('button', { name: /B-C教学楼连廊三层学习区/ })).toBeTruthy();
  });

  it('uses B-C teaching building connector wording for legacy CONNECTOR_CD metadata', () => {
    render(
      <CampusIndoorMap
        areas={[
          makeArea({ id: 1, name: 'A 楼一层自习区', floor: '1F', buildingCode: 'A' }),
          makeArea({ id: 2, name: 'B 楼一层自习区', floor: '1F', buildingCode: 'B' }),
          makeArea({ id: 3, name: 'A/B 连廊二层学习区', floor: '2F', buildingCode: 'CONNECTOR' }),
          makeArea({ id: 4, name: 'B/C 连廊二层学习区', floor: '2F', buildingCode: 'CONNECTOR_CD' }),
        ]}
        selectedAreaId={4}
        onSelectArea={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: '2F' })).toHaveProperty('checked', true);
    expect(screen.getByLabelText('B-C教学楼连廊区域')).toBeTruthy();
    expect(screen.getByRole('button', { name: /B-C教学楼连廊二层学习区/ })).toBeTruthy();
    expect(screen.queryByText('C/D 连廊')).toBeNull();
  });

  it('does not treat an ordinary teaching building area as an A/B connector', () => {
    render(
      <CampusIndoorMap
        areas={[
          makeArea({
            id: 1,
            name: 'Teaching Building Area B',
            floor: '2F',
            buildingCode: 'B',
            floorCode: '2F',
            areaType: 'STUDY_ROOM',
            description: 'Demo classroom study area',
          }),
        ]}
        selectedAreaId={1}
        onSelectArea={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Teaching Building Area B/ })).toBeNull();
    expect(screen.getByText('当前暂无开放的连廊学习区域')).toBeTruthy();
  });

  it('uses structured building and floor metadata before name inference', () => {
    render(
      <CampusIndoorMap
        areas={[
          makeArea({
            id: 1,
            name: 'A 楼命名但属于 B/C 连廊',
            floor: '1F',
            buildingCode: 'CONNECTOR_CD',
            floorCode: '3F',
            areaType: 'CONNECTOR',
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
    const bcConnector = screen.getByLabelText('B-C教学楼连廊区域');

    expect(within(bcConnector).getByRole('button', { name: /A 楼命名但属于 B-C教学楼连廊/ })).toBeTruthy();
    expect(screen.queryByLabelText('A 楼区域')).toBeNull();
  });

  it('reports visible floor areas when the parent controls floor selection', () => {
    const onFloorChange = vi.fn();

    render(
      <CampusIndoorMap
        areas={[
          makeArea({ id: 1, name: 'A 楼一层自习区', floor: '1F', buildingCode: 'A' }),
          makeArea({ id: 2, name: 'B 楼二层自习区', floor: '2F', buildingCode: 'B' }),
          makeArea({ id: 3, name: 'A/B 连廊二层学习区', floor: '2F', buildingCode: 'CONNECTOR' }),
          makeArea({ id: 4, name: 'B/C 连廊三层学习区', floor: '3F', buildingCode: 'CONNECTOR_CD' }),
        ]}
        selectedAreaId={4}
        selectedFloor="3F"
        onFloorChange={onFloorChange}
        onSelectArea={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: '3F' })).toHaveProperty('checked', true);

    fireEvent.click(screen.getByRole('radio', { name: '2F' }));

    expect(onFloorChange).toHaveBeenCalledWith(
      '2F',
      [expect.objectContaining({ id: 3, name: 'A/B 连廊二层学习区' })],
    );
  });
});
