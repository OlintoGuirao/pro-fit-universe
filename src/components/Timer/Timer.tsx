import React, { useState, useEffect } from 'react';

interface TimerProps {
  onComplete?: (time: number) => void;
  autoStart?: boolean;
  initialTime?: number;
}

const Timer = ({ onComplete, autoStart = true, initialTime = 0 }: TimerProps) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Recupera o tempo do localStorage ao montar o componente
  useEffect(() => {
    const savedTime = localStorage.getItem('workoutTimer');
    if (savedTime) {
      const { startTime } = JSON.parse(savedTime);
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setTime(elapsedTime);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      // Salva o tempo inicial no localStorage
      localStorage.setItem('workoutTimer', JSON.stringify({
        startTime: Date.now() - (time * 1000)
      }));

      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, time]);

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