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
    expect(tableButton.className).toContain('table-layout-item-selected');
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
});
