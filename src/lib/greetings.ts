export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 22) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

export const getMotivationalMessage = (streak: number, progressPercentage: number): string => {
  // Milestone messages
  if (streak === 3) return "3 days strong! You're building a habit! 🔥";
  if (streak === 7) return "One week complete! You're unstoppable! 🎉";
  if (streak === 14) return "Two weeks! This is becoming your lifestyle! 💪";
  if (streak === 30) return "30 days! You're a fitness champion! 🏆";
  
  // Progress-based messages
  if (progressPercentage === 0) {
    return "Ready to crush today's goals? Let's start! 💪";
  } else if (progressPercentage < 50) {
    return "Great start! Keep that momentum going! 🌟";
  } else if (progressPercentage < 100) {
    return "You're so close! Finish strong! 🔥";
  } else {
    return "Perfect! You crushed every goal today! 🎉";
  }
};

export const getWeeklyEncouragement = (workouts: number, goalPercentage: number): string => {
  if (goalPercentage >= 100) {
    return "Amazing week! You hit all your targets! 🏆";
  } else if (goalPercentage >= 75) {
    return "Fantastic effort this week! Keep it up! 💪";
  } else if (goalPercentage >= 50) {
    return "Good progress! You're halfway there! 🌟";
  } else if (workouts > 0) {
    return "Every workout counts! Keep building! 🔥";
  } else {
    return "New week, new opportunities! Let's start strong! 💫";
  }
};
