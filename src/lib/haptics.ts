import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const isNativePlatform = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const triggerHaptic = async (type: HapticType = "light") => {
  if (!isNativePlatform()) return;
  
  try {
    switch (type) {
      case "light":
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case "medium":
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case "heavy":
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case "success":
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case "warning":
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case "error":
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } catch (error) {
    // Haptics not available (web browser), silently fail
    console.debug("Haptics not available:", error);
  }
};

export const triggerSelectionHaptic = async () => {
  if (!isNativePlatform()) return;
  
  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch (error) {
    console.debug("Selection haptic not available:", error);
  }
};
