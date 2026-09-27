const STORAGE_KEY =
  "teamflow_user_profile";


const DEFAULT_PROFILE = {
  department: "",
  skills: [],
  history: [],
};


/* =====================================================
   LOAD PROFILE
===================================================== */

export function loadUserProfile() {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return DEFAULT_PROFILE;
    }

    const parsed =
      JSON.parse(stored);

    return {
      department:
        parsed?.department || "",

      skills:
        Array.isArray(parsed?.skills)
          ? parsed.skills
          : [],

      history:
        Array.isArray(parsed?.history)
          ? parsed.history
          : [],
    };
  } catch (error) {
    console.error(
      "Failed to load TeamFlow user profile:",
      error
    );

    return DEFAULT_PROFILE;
  }
}


/* =====================================================
   SAVE PROFILE
===================================================== */

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        department:
          profile?.department || "",

        skills:
          Array.isArray(profile?.skills)
            ? profile.skills
            : [],

        history:
          Array.isArray(profile?.history)
            ? profile.history
            : [],
      })
    );
  } catch (error) {
    console.error(
      "Failed to save TeamFlow user profile:",
      error
    );
  }
}


/* =====================================================
   CLEAR PROFILE
===================================================== */

export function clearUserProfile() {
  localStorage.removeItem(
    STORAGE_KEY
  );
}