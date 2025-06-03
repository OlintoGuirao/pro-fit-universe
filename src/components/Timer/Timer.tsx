import React, { useState, useEffect } from 'react';

interface TimerProps {
  onComplete?: (time: number) => void;
  autoStart?: boolean;
}

const Timer = ({ onComplete, autoStart = true }: TimerProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center">
      <div className="text-sm font-mono font-medium">
        {formatTime(time)}
      </div>
    </div>
  );
};

export default Timer; 