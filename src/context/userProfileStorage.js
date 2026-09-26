const STORAGE_KEY = "teamflow_user_profiles";

export function getStoredProfiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {};
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to read user profiles:", error);
    return {};
  }
}

export function getStoredProfile(userId) {
  const profiles = getStoredProfiles();

  return profiles[userId] || null;
}

export function saveStoredProfile(userId, profile) {
  try {
    const profiles = getStoredProfiles();

    profiles[userId] = profile;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));

    return profile;
  } catch (error) {
    console.error("Failed to save user profile:", error);
    return profile;
  }
}