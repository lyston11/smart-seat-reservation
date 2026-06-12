import { Button, Empty, Segmented, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { Area } from '../types/seat';
import {
  byMapPositionThenName,
  connectorZoneAriaLabels,
  connectorZoneLabels,
  connectorZones,
  formatConnectorAreaName,
  getVisibleConnectorAreasForFloor,
  inferConnectorZone,
  isConnectorFloor,
  normalizeAreaFloor,
  sortFloors,
  type CampusConnectorZone,
} from '../utils/campusConnectors';

type CampusIndoorMapProps = {
  areas: Area[];
  selectedAreaId: number;
  selectedFloor?: string | null;
  areaOccupancy?: Record<number, CampusAreaOccupancy>;
  embedded?: boolean;
  onFloorChange?: (floor: string, visibleAreas: Area[]) => void;
  onSelectArea: (area: Area) => void;
};

type CampusMapRow = {
  ariaLabel: string;
  key: string;
  zones: CampusConnectorZone[];
};

const zoneRows: CampusMapRow[] = [
  { ariaLabel: '连廊学习区', key: 'connectors', zones: connectorZones },
];

type CampusAreaOccupancy = {
  total: number;
  occupied: number;
};

function getZoneClassName(zone: CampusConnectorZone) {
  return zone.toLowerCase().replace('_', '-');
}

function getOccupancyRate(stat?: CampusAreaOccupancy) {
  if (!stat || stat.total <= 0) {
    return null;
  }
  return Math.round((stat.occupied / stat.total) * 100);
}

export default function CampusIndoorMap({
  areas,
  selectedAreaId,
  selectedFloor: controlledFloor,
  areaOccupancy = {},
  embedded = false,
  onFloorChange,
  onSelectArea,
}: CampusIndoorMapProps) {
  const activeAreas = useMemo(() => areas.filter((area) => area.status === 'ACTIVE'), [areas]);
  const connectorAreas = useMemo(
    () => activeAreas.filter((area) => inferConnectorZone(area) !== null && isConnectorFloor(normalizeAreaFloor(area))),
    [activeAreas],
  );
  const floors = useMemo(
    () => Array.from(new Set(connectorAreas.map(normalizeAreaFloor))).sort(sortFloors),
    [connectorAreas],
  );
  const selectedArea = useMemo(
    () => connectorAreas.find((area) => area.id === selectedAreaId),
    [connectorAreas, selectedAreaId],
  );
  const selectedAreaFloor = selectedArea ? normalizeAreaFloor(selectedArea) : null;
  const [manualFloor, setManualFloor] = useState<string | null>(null);
  const selectedFloor = controlledFloor && floors.includes(controlledFloor)
    ? controlledFloor
    : manualFloor && floors.includes(manualFloor)
    ? manualFloor
    : selectedAreaFloor && floors.includes(selectedAreaFloor)
      ? selectedAreaFloor
      : floors[0] ?? '未标注楼层';

  const visibleFloorAreas = useMemo(
    () => getVisibleConnectorAreasForFloor(connectorAreas, selectedFloor),
    [connectorAreas, selectedFloor],
  );
  const groupedAreas = useMemo(
    () =>
      connectorZones.reduce<Record<CampusConnectorZone, Area[]>>(
        (nextGroups, zone) => ({
          ...nextGroups,
          [zone]: visibleFloorAreas.filter((area) => inferConnectorZone(area) === zone).sort(byMapPositionThenName),
        }),
        { CONNECTOR: [], CONNECTOR_CD: [] },
      ),
    [visibleFloorAreas],
  );

  function changeFloor(nextFloor: string) {
    setManualFloor(nextFloor);
    onFloorChange?.(nextFloor, getVisibleConnectorAreasForFloor(connectorAreas, nextFloor));
  }

  const renderZone = (zone: CampusConnectorZone) => (
    <section
      className={`campus-map-zone campus-map-zone-${getZoneClassName(zone)}`}
      key={zone}
      aria-label={connectorZoneAriaLabels[zone]}
    >
      <div className="campus-map-zone-title">
        <strong>{connectorZoneLabels[zone]}</strong>
        <Tag>{groupedAreas[zone].length} 个区域</Tag>
      </div>
      <div className="campus-map-area-list">
        {groupedAreas[zone].length > 0 ? (
          groupedAreas[zone].map((area) => {
            const occupancy = areaOccupancy[area.id];
            const occupancyRate = getOccupancyRate(occupancy);
            return (
              <Button
                className={`campus-map-area ${area.id === selectedAreaId ? 'campus-map-area-selected' : ''}`}
                key={area.id}
                aria-pressed={area.id === selectedAreaId}
                onClick={() => onSelectArea(area)}
              >
                <span>{formatConnectorAreaName(area)}</span>
                <small>
                  {normalizeAreaFloor(area)} · {area.openTime.slice(0, 5)}-{area.closeTime.slice(0, 5)}
                </small>
                <span className="campus-map-occupancy">
                  {occupancyRate === null ? '占用率 暂无数据' : `占用率 ${occupancyRate}%`}
                </span>
              </Button>
            );
          })
        ) : (
          <span className="campus-map-empty-zone">暂无开放区域</span>
        )}
      </div>
    </section>
  );

  return (
    <section
      className={`campus-indoor-map${embedded ? ' campus-indoor-map-embedded' : ' student-seat-adaptive-frame'}`}
      aria-label={embedded ? undefined : '室内导航'}
    >
      <div className="campus-map-header">
        {!embedded ? (
          <div>
            <h3>室内导航</h3>
            <p>当前开放教学楼连廊学习座位</p>
          </div>
        ) : null}
        {floors.length > 0 ? (
          <Segmented<string>
            value={selectedFloor}
            options={floors.map((floor) => ({ label: floor, value: floor }))}
            onChange={changeFloor}
          />
        ) : null}
      </div>

      {visibleFloorAreas.length > 0 ? (
        <div className="campus-map-stage">
          {zoneRows.map((row) => (
            <div className={`campus-map-row campus-map-row-${row.key}`} key={row.key} aria-label={row.ariaLabel}>
              {row.zones.map(renderZone)}
            </div>
          ))}
        </div>
      ) : (
        <div className="campus-map-empty">
          <Empty description="当前暂无开放的连廊学习区域" />
        </div>
      )}
    </section>
  );
}
