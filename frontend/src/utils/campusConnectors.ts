import type { Area } from '../types/seat';

export type CampusConnectorZone = 'CONNECTOR' | 'CONNECTOR_CD';

export const connectorFloorNumbers = new Set([2, 3]);
export const connectorZones: CampusConnectorZone[] = ['CONNECTOR', 'CONNECTOR_CD'];

export const connectorZoneLabels: Record<CampusConnectorZone, string> = {
  CONNECTOR: 'A-B教学楼连廊',
  CONNECTOR_CD: 'B-C教学楼连廊',
};

export const connectorZoneAriaLabels: Record<CampusConnectorZone, string> = {
  CONNECTOR: 'A-B教学楼连廊区域',
  CONNECTOR_CD: 'B-C教学楼连廊区域',
};

const connectorAreaNameReplacements: Record<CampusConnectorZone, Array<[RegExp, string]>> = {
  CONNECTOR: [
    [/A\s*[/／]\s*B\s*连廊/g, connectorZoneLabels.CONNECTOR],
    [/A\s*-\s*B\s*连廊/g, connectorZoneLabels.CONNECTOR],
    [/AB\s*连廊/gi, connectorZoneLabels.CONNECTOR],
  ],
  CONNECTOR_CD: [
    [/B\s*[/／]\s*C\s*连廊/g, connectorZoneLabels.CONNECTOR_CD],
    [/B\s*-\s*C\s*连廊/g, connectorZoneLabels.CONNECTOR_CD],
    [/BC\s*连廊/gi, connectorZoneLabels.CONNECTOR_CD],
  ],
};

export function normalizeFloor(floor: string | null) {
  return floor?.trim() || '未标注楼层';
}

export function normalizeAreaFloor(area: Area) {
  const structuredFloor = area.floorCode?.trim();
  return normalizeFloor(structuredFloor || area.floor);
}

export function getFloorNumber(floor: string) {
  const match = floor.match(/\d+/);
  if (!match) {
    return null;
  }
  const floorNumber = Number.parseInt(match[0], 10);
  return Number.isFinite(floorNumber) ? floorNumber : null;
}

export function isConnectorFloor(floor: string) {
  const floorNumber = getFloorNumber(floor);
  return floorNumber !== null && connectorFloorNumbers.has(floorNumber);
}

export function getAreaSearchText(area: Area) {
  return `${area.name} ${area.floor ?? ''} ${area.description ?? ''}`.toLowerCase();
}

function hasPair(text: string, left: string, right: string) {
  return (
    text.includes(`${left}/${right}`) ||
    text.includes(`${left}／${right}`) ||
    text.includes(`${left}-${right}`) ||
    text.includes(`${left}楼${right}楼`) ||
    text.includes(`${left}栋${right}栋`) ||
    text.includes(`${left}与${right}`) ||
    text.includes(`${left}和${right}`) ||
    text.includes(`${left}至${right}`)
  );
}

export function inferConnectorZone(area: Area): CampusConnectorZone | null {
  const structuredZone = area.buildingCode?.trim().toUpperCase();
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

  if (!isConnector) {
    return null;
  }
  if (hasPair(text, 'b', 'c') || text.includes('bc连廊') || text.includes('b-c连廊')) {
    return 'CONNECTOR_CD';
  }
  if (hasPair(text, 'a', 'b') || text.includes('ab连廊') || text.includes('a-b连廊')) {
    return 'CONNECTOR';
  }
  if (isConnector) {
    return 'CONNECTOR';
  }
  return null;
}

export function formatConnectorAreaName(area: Area) {
  const zone = inferConnectorZone(area);
  if (!zone) {
    return area.name;
  }
  return formatConnectorAreaNameText(area.name, zone);
}

export function formatConnectorAreaNameText(name: string, zone?: CampusConnectorZone | null) {
  const nextZone =
    zone ??
    (connectorAreaNameReplacements.CONNECTOR_CD.some(([pattern]) => new RegExp(pattern).test(name))
      ? 'CONNECTOR_CD'
      : connectorAreaNameReplacements.CONNECTOR.some(([pattern]) => new RegExp(pattern).test(name))
        ? 'CONNECTOR'
        : null);
  if (!nextZone) {
    return name;
  }
  return connectorAreaNameReplacements[nextZone].reduce(
    (name, [pattern, replacement]) => name.replace(pattern, replacement),
    name,
  );
}

export function isCampusConnectorArea(area: Area) {
  return inferConnectorZone(area) !== null && isConnectorFloor(normalizeAreaFloor(area));
}

export function sortFloors(left: string, right: string) {
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

export function byMapPositionThenName(left: Area, right: Area) {
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

export function getVisibleConnectorAreasForFloor(areas: Area[], floor: string) {
  if (!isConnectorFloor(floor)) {
    return [];
  }
  return areas
    .filter((area) => normalizeAreaFloor(area) === floor)
    .filter((area) => inferConnectorZone(area) !== null)
    .sort(byMapPositionThenName);
}
