# Student Seat Mobile Flow Design Notes

## Goal

Improve the student reservation page so building, floor, area, date, time, and concrete seat selection feel like one continuous workflow on desktop and mobile.

## User Problem

- Students can see the indoor map and the form, but floor switching can feel separate from the selected area and seat map.
- Time selection is currently easiest to discover after choosing a seat, while students should be able to choose the desired time window before deciding which seat is suitable.
- Mobile users need the same page to collapse into a clear top-to-bottom flow without hiding the selected seat details.

## Scope

- Student reservation page only.
- Keep existing APIs, reservation rules, and check-in validation unchanged.
- Keep the existing `CampusIndoorMap` and `SeatMap` components, extending their props only where needed.
- Do not modify the teammate-owned check-in state machine, WiFi/IP validation, QR validation, or reservation expiration rules.

## Interaction Direction

1. The indoor map owns spatial navigation visually, but the page owns the selected floor state.
2. Switching floors automatically aligns the selected area to the first visible area on that floor when the previous area is no longer on the selected floor.
3. The top filter panel exposes area, date, start time, end time, and refresh together.
4. The seat map always reflects the currently selected area and time range.
5. The side panel focuses on the selected concrete seat and current reservation, with mobile stacking below the map.

## Stable Behaviors

- Today can always be selected.
- Tomorrow is still gated by the configured reservation open hour.
- Start/end options continue to be derived from published seat slots and area opening time.
- Unpublished seats remain visible but cannot be reserved.
- Locked/using/reserved/abnormal states remain distinct in the seat map.
