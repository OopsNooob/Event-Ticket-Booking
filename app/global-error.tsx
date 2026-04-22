// app/global-error.tsx
'use client';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    // Gọi API gửi email cảnh báo cho Dev theo đúng yêu cầu ASR
    fetch('/api/notify-devs', {
      method: 'POST',
      body: JSON.stringify({ message: error.message, stack: error.stack }),
    });
  }, [error]);

  return <html><body><h2>Hệ thống đang bảo trì, vui lòng quay lại sau!</h2></body></html>;
}