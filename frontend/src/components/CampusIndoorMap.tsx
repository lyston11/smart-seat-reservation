import { Button, Empty, Segmented, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { Area } from '../types/seat';

type CampusIndoorMapProps = {
  areas: Area[];
  selectedAreaId: number;
  onSelectArea: (area: Area) => void;
};

type BuildingZone = 'A' | 'CONNECTOR' | 'B' | 'C' | 'CONNECTOR_CD' | 'D';

type CampusMapRow = {
  ariaLabel: string;
  key: string;
  zones: BuildingZone[];
};

const zoneLabels: Record<BuildingZone, string> = {
  A: 'A 楼',
  CONNECTOR: 'A/B 连廊',
  B: 'B 楼',
  C: 'C 楼',
  CONNECTOR_CD: 'C/D 连廊',
  D: 'D 楼',
};

const zoneAriaLabels: Record<BuildingZone, string> = {
  A: 'A 楼区域',
  CONNECTOR: 'A/B 连廊区域',
  B: 'B 楼区域',
  C: 'C 楼区域',
  CONNECTOR_CD: 'C/D 连廊区域',
  D: 'D 楼区域',
};

const zones: BuildingZone[] = ['A', 'CONNECTOR', 'B', 'C', 'CONNECTOR_CD', 'D'];
const zoneRows: CampusMapRow[] = [
  { ariaLabel: 'A/B 教学楼组', key: 'ab', zones: ['A', 'CONNECTOR', 'B'] },
  { ariaLabel: 'C/D 教学楼组', key: 'cd', zones: ['C', 'CONNECTOR_CD', 'D'] },
];
const connectorZones: BuildingZone[] = ['CONNECTOR', 'CONNECTOR_CD'];
const connectorFloorNumbers = new Set([2, 3]);

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
  if (structuredZone === 'A' || structuredZone === 'B' || structuredZone === 'C' || structuredZone === 'D') {
    return structuredZone;
  }
  if (structuredZone === 'CONNECTOR' || structuredZone === 'CONNECTOR_AB') {
    return 'CONNECTOR';
  }
  if (structuredZone === 'CONNECTOR_CD') {
    return 'CONNECTOR_CD';
  }

  const text = getAreaSearchText(area);
  const isConnector =
    text.includes('连廊') ||
    text.includes('走廊') ||
    text.includes('connector') ||
    text.includes('corridor') ||
    text.includes('skybridge') ||
    text.includes('bridge');
  if (isConnector && (text.includes('c/d') || text.includes('c-d') || text.includes('c d') || text.includes('c楼d楼'))) {
    return 'CONNECTOR_CD';
  }
  if (isConnector || text.includes('a/b') || text.includes('a-b')) {
    return 'CONNECTOR';
  }
  if (/(^|[\s·\-_/])d($|[\s·\-_/楼区])/.test(text) || text.includes('d楼') || text.includes('d 楼') || text.includes('d区') || text.includes('d 区')) {
    return 'D';
  }
  if (/(^|[\s·\-_/])c($|[\s·\-_/楼区])/.test(text) || text.includes('c楼') || text.includes('c 楼') || text.includes('c区') || text.includes('c 区')) {
    return 'C';
  }
  if (/(^|[\s·\-_/])b($|[\s·\-_/楼区])/.test(text) || text.includes('b楼') || text.includes('b 楼') || text.includes('b区') || text.includes('b 区')) {
    return 'B';
  }
  return 'A';
}

function getFloorNumber(floor: string) {
  const match = floor.match(/\d+/);
  if (!match) {
    return null;
  }
  const floorNumber = Number.parseInt(match[0], 10);
  return Number.isFinite(floorNumber) ? floorNumber : null;
}

function isConnectorZone(zone: BuildingZone) {
  return connectorZones.includes(zone);
}

function isConnectorFloor(floor: string) {
  const floorNumber = getFloorNumber(floor);
  return floorNumber !== null && connectorFloorNumbers.has(floorNumber);
}

function getZoneClassName(zone: BuildingZone) {
  return zone.toLowerCase().replace('_', '-');
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
  const showConnectors = isConnectorFloor(selectedFloor);
  const visibleFloorAreas = useMemo(
    () => floorAreas.filter((area) => showConnectors || !isConnectorZone(inferAreaZone(area))),
    [floorAreas, showConnectors],
  );
  const visibleZones = useMemo(
    () => zones.filter((zone) => showConnectors || !isConnectorZone(zone)),
    [showConnectors],
  );
  const groupedAreas = useMemo(
    () =>
      visibleZones.reduce<Record<BuildingZone, Area[]>>(
        (nextGroups, zone) => ({
          ...nextGroups,
          [zone]: visibleFloorAreas.filter((area) => inferAreaZone(area) === zone).sort(byMapPositionThenName),
        }),
        { A: [], CONNECTOR: [], B: [], C: [], CONNECTOR_CD: [], D: [] },
      ),
    [visibleFloorAreas, visibleZones],
  );
  const visibleZoneSet = useMemo(() => new Set(visibleZones), [visibleZones]);

  const renderZone = (zone: BuildingZone) => (
    <section className={`campus-map-zone campus-map-zone-${getZoneClassName(zone)}`} key={zone} aria-label={zoneAriaLabels[zone]}>
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

      {visibleFloorAreas.length > 0 ? (
        <div className="campus-map-stage">
          {zoneRows.map((row) => (
            <div className={`campus-map-row campus-map-row-${row.key}`} key={row.key} aria-label={row.ariaLabel}>
              {row.zones.filter((zone) => visibleZoneSet.has(zone)).map(renderZone)}
            </div>
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
