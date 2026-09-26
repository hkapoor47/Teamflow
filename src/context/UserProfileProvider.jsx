import { useEffect, useMemo, useState } from "react";
import UserProfileContext from "./userProfileContext";
import {
  getStoredProfile,
  saveStoredProfile,
} from "./userProfileStorage";

const DEFAULT_PROFILE = {
  department: "",
  skills: [],
  interests: [],
  history: [],
};

function getCurrentUserId() {
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      return (
        user?.id ||
        user?.userId ||
        user?.email ||
        "current-user"
      );
    } catch {
      return "current-user";
    }
  }

  return localStorage.getItem("userId") || "current-user";
}

export default function UserProfileProvider({ children }) {
  const userId = getCurrentUserId();

  const [profile, setProfile] = useState(() => {
    const storedProfile = getStoredProfile(userId);

    return storedProfile || DEFAULT_PROFILE;
  });

  useEffect(() => {
    saveStoredProfile(userId, profile);
  }, [userId, profile]);

  const setDepartment = (department) => {
    setProfile((previous) => ({
      ...previous,
      department,
    }));
  };

  const addSkill = (skill) => {
    const cleanSkill = skill.trim();

    if (!cleanSkill) return;

    setProfile((previous) => {
      const alreadyExists = previous.skills.some(
        (existingSkill) =>
          existingSkill.toLowerCase() === cleanSkill.toLowerCase()
      );

      if (alreadyExists) {
        return previous;
      }

      return {
        ...previous,
        skills: [...previous.skills, cleanSkill],
      };
    });
  };

  const removeSkill = (skill) => {
    setProfile((previous) => ({
      ...previous,
      skills: previous.skills.filter(
        (existingSkill) => existingSkill !== skill
      ),
    }));
  };

  const addInterest = (interest) => {
    const cleanInterest = interest.trim();

    if (!cleanInterest) return;

    setProfile((previous) => {
      const alreadyExists = previous.interests.some(
        (existingInterest) =>
          existingInterest.toLowerCase() === cleanInterest.toLowerCase()
      );

      if (alreadyExists) {
        return previous;
      }

      return {
        ...previous,
        interests: [...previous.interests, cleanInterest],
      };
    });
  };

  const removeInterest = (interest) => {
    setProfile((previous) => ({
      ...previous,
      interests: previous.interests.filter(
        (existingInterest) => existingInterest !== interest
      ),
    }));
  };

  const addHistory = (historyItem) => {
    setProfile((previous) => ({
      ...previous,
      history: [
        historyItem,
        ...previous.history,
      ],
    }));
  };

  const clearHistory = () => {
    setProfile((previous) => ({
      ...previous,
      history: [],
    }));
  };

  const value = useMemo(
    () => ({
      department: profile.department,
      skills: profile.skills,
      interests: profile.interests,
      history: profile.history,

      setDepartment,
      addSkill,
      removeSkill,
      addInterest,
      removeInterest,
      addHistory,
      clearHistory,
    }),
    [profile]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}