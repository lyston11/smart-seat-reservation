import { useEffect } from 'react';
import { App as AntApp } from 'antd';
import { getStoredUser } from '../api/http';
import { listUserReservations, markReservationWifiPresence } from '../api/reservations';
import { isStudentSessionActive } from '../utils/authSession';

const WIFI_HEARTBEAT_INTERVAL_MS = 60_000;

export default function WifiPresenceGuard() {
  const { message } = AntApp.useApp();
  const user = getStoredUser();

  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      return undefined;
    }

    let stopped = false;
    async function sendWifiHeartbeats() {
      if (!isStudentSessionActive()) {
        return;
      }
      try {
        const reservations = await listUserReservations(20);
        const usingReservations = reservations.filter((reservation) => reservation.status === 'CHECKED_IN');
        await Promise.all(
          usingReservations.map((reservation) => markReservationWifiPresence(reservation.reservationId)),
        );
      } catch (error) {
        if (!stopped) {
          message.warning(error instanceof Error ? error.message : 'WiFi 在线检测失败');
        }
      }
    }

    void sendWifiHeartbeats();
    const timer = window.setInterval(() => {
      void sendWifiHeartbeats();
    }, WIFI_HEARTBEAT_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [message, user?.role]);

  return null;
}
