import confetti from 'canvas-confetti';

export const triggerCelebration = (type: 'workout' | 'streak' | 'milestone' = 'workout') => {
  const duration = type === 'milestone' ? 3000 : 2000;
  const animationEnd = Date.now() + duration;

  const colors = {
    workout: ['#10b981', '#3b82f6', '#8b5cf6'],
    streak: ['#f59e0b', '#ef4444', '#f97316'],
    milestone: ['#f59e0b', '#ef4444', '#f97316', '#10b981', '#3b82f6']
  };

  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    colors: colors[type]
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = type === 'milestone' ? 100 : 50;
    
    // Fire confetti from random positions
    confetti({
      ...defaults,
      particleCount: particleCount * (timeLeft / duration),
      origin: { 
        x: randomInRange(0.1, 0.9), 
        y: Math.random() - 0.2 
      }
    });
  }, type === 'milestone' ? 150 : 250);
};

export const triggerStreakCelebration = (streak: number) => {
  if (streak === 3 || streak === 7 || streak === 14 || streak === 30) {
    triggerCelebration('milestone');
  } else {
    triggerCelebration('streak');
  }
};
