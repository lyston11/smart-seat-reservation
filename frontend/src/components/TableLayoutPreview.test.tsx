import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TableLayoutPreview from './TableLayoutPreview';
import type { StudyTable } from '../types/seat';

function makeTable(overrides: Partial<StudyTable>): StudyTable {
  return {
    id: overrides.id ?? 1,
    areaId: overrides.areaId ?? 1,
    tableNo: overrides.tableNo ?? 'T01',
    name: overrides.name ?? null,
    status: overrides.status ?? 'ACTIVE',
    rowNo: overrides.rowNo ?? null,
    columnNo: overrides.columnNo ?? null,
    displayOrder: overrides.displayOrder ?? null,
    positionX: overrides.positionX ?? 80,
    positionY: overrides.positionY ?? 80,
    widthPx: overrides.widthPx ?? 260,
    heightPx: overrides.heightPx ?? 96,
    rotationDeg: overrides.rotationDeg ?? 0,
  };
}

afterEach(() => {
  cleanup();
});

describe('TableLayoutPreview', () => {
  it('renders active tables by coordinate and emits selection', () => {
    const onSelectTable = vi.fn();
    render(
      <TableLayoutPreview
        selectedTableId={2}
        onSelectTable={onSelectTable}
        seatCounts={{ 1: 4, 2: 2 }}
        tables={[
          makeTable({ id: 1, tableNo: 'T01', positionX: 120, positionY: 80 }),
          makeTable({ id: 2, tableNo: 'T02', name: '靠窗桌', positionX: 360, positionY: 80 }),
          makeTable({ id: 3, tableNo: 'T03', status: 'INACTIVE' }),
        ]}
      />,
    );

    const tableButton = screen.getByRole('button', { name: '编辑 T02' });
    expect((tableButton as HTMLElement).style.left).toBe('360px');
    expect((tableButton as HTMLElement).style.top).toBe('80px');
    expect((tableButton as HTMLElement).style.width).toBe('180px');
    expect(tableButton.className).toContain('table-layout-item-selected');
    expect(tableButton.className).toContain('table-layout-item-two');
    expect(screen.getByText('2人桌')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '编辑 T03' })).toBeNull();

    fireEvent.click(tableButton);
    expect(onSelectTable).toHaveBeenCalledWith(expect.objectContaining({ id: 2, tableNo: 'T02' }));
  });

  it('hides legacy fallback tables from the room preview', () => {
    render(
      <TableLayoutPreview
        tables={[
          makeTable({ id: 1, tableNo: 'LEGACY', positionX: 80, positionY: 80 }),
          makeTable({ id: 2, tableNo: 'T01', positionX: 120, positionY: 90 }),
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: '编辑 LEGACY' })).toBeNull();
    expect(screen.getByRole('button', { name: '编辑 T01' })).toBeTruthy();
  });

  it('moves tables by pointer drag in editable mode', () => {
    const onMoveTable = vi.fn();
    render(
      <TableLayoutPreview
        editable
        seatCounts={{ 1: 4 }}
        onMoveTable={onMoveTable}
        tables={[makeTable({ id: 1, tableNo: 'T01', positionX: 120, positionY: 80 })]}
      />,
    );

    const tableButton = screen.getByRole('button', { name: '编辑 T01' }) as HTMLElement;
    tableButton.setPointerCapture = vi.fn();
    tableButton.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(tableButton, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(tableButton, {
      clientX: 135,
      clientY: 128,
      pointerId: 1,
    });

    expect(onMoveTable).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, tableNo: 'T01' }),
      { positionX: 160, positionY: 110 },
    );
  });

  it('moves tables with keyboard arrows in editable mode', () => {
    const onMoveTable = vi.fn();
    render(
      <TableLayoutPreview
        editable
        seatCounts={{ 1: 4 }}
        onMoveTable={onMoveTable}
        tables={[makeTable({ id: 1, tableNo: 'T01', positionX: 120, positionY: 80 })]}
      />,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: '编辑 T01' }), { key: 'ArrowRight' });
    expect(onMoveTable).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, tableNo: 'T01' }),
      { positionX: 130, positionY: 80 },
    );
  });

  it('does not render fake room features in the admin layout preview', () => {
    render(
      <TableLayoutPreview
        seatCounts={{ 1: 4 }}
        tables={[makeTable({ id: 1, tableNo: 'T01', positionX: 120, positionY: 80 })]}
      />,
    );

    expect(screen.queryByText('入口')).toBeNull();
    expect(screen.queryByText('采光窗')).toBeNull();
    expect(screen.queryByText('服务台')).toBeNull();
  });
});
