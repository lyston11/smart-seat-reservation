import { Button, Empty, Segmented, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { Area } from '../types/seat';

type CampusIndoorMapProps = {
  areas: Area[];
  selectedAreaId: number;
  onSelectArea: (area: Area) => void;
};

type BuildingZone = 'A' | 'CONNECTOR' | 'B';

const zoneLabels: Record<BuildingZone, string> = {
  A: 'A 楼',
  CONNECTOR: 'A/B 连廊',
  B: 'B 楼',
};

const zoneAriaLabels: Record<BuildingZone, string> = {
  A: 'A 楼区域',
  CONNECTOR: 'A/B 连廊区域',
  B: 'B 楼区域',
};

const zones: BuildingZone[] = ['A', 'CONNECTOR', 'B'];

function normalizeFloor(floor: string | null) {
  return floor?.trim() || '未标注楼层';
}

function normalizeAreaFloor(area: Area) {
  const structuredFloor = area.floorCode?.trim();
  return normalizeFloor(structuredFloor || area.floor);
}

function getAreaSearchText(area: Area) {
  return `${area.name} ${area.floor ?? ''} ${area.description ?? ''}`.toLowerCase();
}

function inferAreaZone(area: Area): BuildingZone {
  const structuredZone = area.buildingCode?.trim().toUpperCase();
  if (structuredZone === 'A' || structuredZone === 'B' || structuredZone === 'CONNECTOR') {
    return structuredZone;
  }

  const text = getAreaSearchText(area);
  if (
    text.includes('连廊') ||
    text.includes('走廊') ||
    text.includes('connector') ||
    text.includes('corridor') ||
    text.includes('skybridge') ||
    text.includes('bridge') ||
    text.includes('a/b') ||
    text.includes('a-b')
  ) {
    return 'CONNECTOR';
  }
  if (/(^|[\s·\-_/])b($|[\s·\-_/楼区])/.test(text) || text.includes('b楼') || text.includes('b 楼') || text.includes('b区') || text.includes('b 区')) {
    return 'B';
  }
  return 'A';
}

function sortFloors(left: string, right: string) {
  const leftNumber = Number.parseInt(left, 10);
  const rightNumber = Number.parseInt(right, 10);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return left.localeCompare(right);
}

function byAreaName(left: Area, right: Area) {
  return left.name.localeCompare(right.name);
}

function byMapPositionThenName(left: Area, right: Area) {
  const leftY = left.mapY ?? Number.MAX_SAFE_INTEGER;
  const rightY = right.mapY ?? Number.MAX_SAFE_INTEGER;
  if (leftY !== rightY) {
    return leftY - rightY;
  }

  const leftX = left.mapX ?? Number.MAX_SAFE_INTEGER;
  const rightX = right.mapX ?? Number.MAX_SAFE_INTEGER;
  if (leftX !== rightX) {
    return leftX - rightX;
  }

  return byAreaName(left, right);
}

export default function CampusIndoorMap({ areas, selectedAreaId, onSelectArea }: CampusIndoorMapProps) {
  const activeAreas = useMemo(() => areas.filter((area) => area.status === 'ACTIVE'), [areas]);
  const floors = useMemo(
    () => Array.from(new Set(activeAreas.map(normalizeAreaFloor))).sort(sortFloors),
    [activeAreas],
  );
  const selectedArea = useMemo(
    () => activeAreas.find((area) => area.id === selectedAreaId),
    [activeAreas, selectedAreaId],
  );
  const selectedAreaFloor = selectedArea ? normalizeAreaFloor(selectedArea) : null;
  const [manualFloor, setManualFloor] = useState<string | null>(null);
  const selectedFloor = manualFloor && floors.includes(manualFloor)
    ? manualFloor
    : selectedAreaFloor && floors.includes(selectedAreaFloor)
      ? selectedAreaFloor
      : floors[0] ?? '未标注楼层';

  const floorAreas = useMemo(
    () => activeAreas.filter((area) => normalizeAreaFloor(area) === selectedFloor),
    [activeAreas, selectedFloor],
  );
  const groupedAreas = useMemo(
    () =>
      zones.reduce<Record<BuildingZone, Area[]>>(
        (nextGroups, zone) => ({
          ...nextGroups,
          [zone]: floorAreas.filter((area) => inferAreaZone(area) === zone).sort(byMapPositionThenName),
        }),
        { A: [], CONNECTOR: [], B: [] },
      ),
    [floorAreas],
  );

  return (
    <section className="campus-indoor-map" aria-label="室内导航">
      <div className="campus-map-header">
        <div>
          <h3>室内导航</h3>
          <p>按楼栋、楼层和连廊定位公共学习区域</p>
        </div>
        <Segmented<string>
          value={selectedFloor}
          options={floors.map((floor) => ({ label: floor, value: floor }))}
          onChange={setManualFloor}
        />
      </div>

      {floorAreas.length > 0 ? (
        <div className="campus-map-stage">
          {zones.map((zone) => (
            <section className={`campus-map-zone campus-map-zone-${zone.toLowerCase()}`} key={zone} aria-label={zoneAriaLabels[zone]}>
              <div className="campus-map-zone-title">
                <strong>{zoneLabels[zone]}</strong>
                <Tag>{groupedAreas[zone].length} 个区域</Tag>
              </div>
              <div className="campus-map-area-list">
                {groupedAreas[zone].length > 0 ? (
                  groupedAreas[zone].map((area) => (
                    <Button
                      className={`campus-map-area ${area.id === selectedAreaId ? 'campus-map-area-selected' : ''}`}
                      key={area.id}
                      aria-pressed={area.id === selectedAreaId}
                      onClick={() => onSelectArea(area)}
                    >
                      <span>{area.name}</span>
                      <small>
                        {normalizeAreaFloor(area)} · {area.openTime.slice(0, 5)}-{area.closeTime.slice(0, 5)}
                      </small>
                    </Button>
                  ))
                ) : (
                  <span className="campus-map-empty-zone">暂无开放区域</span>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="campus-map-empty">
          <Empty description="当前楼层暂无开放学习区域" />
        </div>
      )}
    </section>
  );
}
