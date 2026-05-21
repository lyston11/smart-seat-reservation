import type { Area, SeatSlot } from '../types/seat';

export type StudentTimeOption = {
  label: string;
  value: string;
};

export type StudentTimeOptions = {
  startOptions: StudentTimeOption[];
  endOptions: StudentTimeOption[];
};

export function buildStudentTimeOptions(
  slots: SeatSlot[],
  selectedArea: Area | undefined,
  startTime = '08:00',
  minStartTime = selectedArea?.openTime ?? '08:00:00',
): StudentTimeOptions {
  const availableOptions = buildPublishedTimeOptions(slots, startTime, minStartTime, true);
  if (availableOptions.startOptions.length > 0) {
    return availableOptions;
  }

  const publishedOptions = buildPublishedTimeOptions(slots, startTime, minStartTime, false);
  if (publishedOptions.startOptions.length > 0) {
    return publishedOptions;
  }

  return buildHalfHourTimeOptions(
    selectedArea?.openTime,
    selectedArea?.closeTime,
    startTime,
    minStartTime,
  );
}

function buildHalfHourTimeOptions(
  openTime = '08:00:00',
  closeTime = '22:00:00',
  startTime = '08:00',
  minStartTime = openTime,
): StudentTimeOptions {
  const startBoundary = toMinutes(toHalfHourCeil(openTime.slice(0, 5)));
  const endBoundary = toMinutes(toHalfHourFloor(closeTime.slice(0, 5)));
  const minStartBoundary = Math.max(startBoundary, toMinutes(toHalfHourCeil(minStartTime.slice(0, 5))));
  const selectedStart = Math.max(toMinutes(startTime), minStartBoundary);
  const startOptions: StudentTimeOption[] = [];
  const endOptions: StudentTimeOption[] = [];

  for (let minutes = minStartBoundary; minutes < endBoundary; minutes += 30) {
    const value = toTimeText(minutes);
    startOptions.push({ label: value, value });
  }

  for (let minutes = minStartBoundary + 30; minutes <= endBoundary; minutes += 30) {
    if (minutes > selectedStart) {
      const value = toTimeText(minutes);
      endOptions.push({ label: value, value });
    }
  }

  return { startOptions, endOptions };
}

function buildPublishedTimeOptions(
  slots: SeatSlot[],
  startTime: string,
  minStartTime: string,
  onlyAvailable: boolean,
): StudentTimeOptions {
  const minStartBoundary = toMinutes(toHalfHourCeil(minStartTime.slice(0, 5)));
  const sourceSlots = onlyAvailable ? slots.filter((slot) => slot.status === 'AVAILABLE') : slots;
  const mergedWindows = mergeContinuousWindows(sourceSlots);
  const startSeatIdsByTime = new Map<string, Set<number>>();

  mergedWindows.forEach((window) => {
    const windowStart = Math.max(toMinutes(toHalfHourCeil(window.startTime.slice(0, 5))), minStartBoundary);
    const windowEnd = toMinutes(toHalfHourFloor(window.endTime.slice(0, 5)));
    for (let minutes = windowStart; minutes < windowEnd; minutes += 30) {
      const startValue = toTimeText(minutes);
      const seatIds = startSeatIdsByTime.get(startValue) ?? new Set<number>();
      window.seatIds.forEach((seatId) => seatIds.add(seatId));
      startSeatIdsByTime.set(startValue, seatIds);
    }
  });

  const startOptions = Array.from(startSeatIdsByTime.entries())
    .sort(([left], [right]) => toMinutes(left) - toMinutes(right))
    .map(([value]) => ({
      label: value,
      value,
    }));

  const selectedStart = pickValidTime(startTime, startOptions);
  const selectedStartMinutes = toMinutes(selectedStart);
  const endSeatIdsByTime = new Map<string, Set<number>>();

  mergedWindows.forEach((window) => {
    const windowStart = toMinutes(toHalfHourCeil(window.startTime.slice(0, 5)));
    const windowEnd = toMinutes(toHalfHourFloor(window.endTime.slice(0, 5)));
    if (windowStart > selectedStartMinutes || windowEnd <= selectedStartMinutes) {
      return;
    }
    for (let minutes = selectedStartMinutes + 30; minutes <= windowEnd; minutes += 30) {
      const endValue = toTimeText(minutes);
      const seatIds = endSeatIdsByTime.get(endValue) ?? new Set<number>();
      window.seatIds.forEach((seatId) => seatIds.add(seatId));
      endSeatIdsByTime.set(endValue, seatIds);
    }
  });

  const endOptions = Array.from(endSeatIdsByTime.entries())
    .sort(([left], [right]) => toMinutes(left) - toMinutes(right))
    .map(([value]) => ({
      label: value,
      value,
    }));

  return { startOptions, endOptions };
}

type ContinuousWindow = {
  seatIds: Set<number>;
  startTime: string;
  endTime: string;
};

function mergeContinuousWindows(slots: SeatSlot[]): ContinuousWindow[] {
  const slotsBySeat = new Map<number, SeatSlot[]>();
  slots.forEach((slot) => {
    slotsBySeat.set(slot.seatId, [...(slotsBySeat.get(slot.seatId) ?? []), slot]);
  });

  return Array.from(slotsBySeat.entries()).flatMap(([seatId, seatSlots]) => {
    const sortedSlots = seatSlots
      .slice()
      .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));
    const windows: ContinuousWindow[] = [];

    sortedSlots.forEach((slot) => {
      const latest = windows[windows.length - 1];
      if (latest && latest.endTime === slot.startTime) {
        latest.endTime = slot.endTime;
        return;
      }
      windows.push({
        seatIds: new Set([seatId]),
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    });

    return windows;
  });
}

function pickValidTime(value: string, options: StudentTimeOption[]) {
  if (options.some((option) => option.value === value)) {
    return value;
  }
  return options[0]?.value ?? value;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimeText(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toHalfHourFloor(value: string) {
  const minutes = toMinutes(value);
  return toTimeText(Math.floor(minutes / 30) * 30);
}

function toHalfHourCeil(value: string) {
  const minutes = toMinutes(value);
  return toTimeText(Math.ceil(minutes / 30) * 30);
}
