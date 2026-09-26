import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import UserProfileContext from "./userProfileContext.js";

import {
  loadUserProfile,
  saveUserProfile,
} from "./userProfileStorage.js";


/* =========================================================
   API
========================================================= */

const API_BASE_URL =
  "http://65.0.11.153:5001/api";


/* =========================================================
   HELPERS
========================================================= */

function getToken() {
  return localStorage.getItem("token");
}


/*
 * Backend response can differ slightly depending on the
 * API implementation.
 *
 * These helpers allow:
 *
 * {
 *   skills: [...]
 * }
 *
 * or
 *
 * {
 *   data: [...]
 * }
 *
 * or directly:
 *
 * [...]
 */

function extractSkills(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.skills)) {
    return data.skills;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}


function getSkillId(skill) {
  return (
    skill?.id ??
    skill?.skillId ??
    skill?._id ??
    null
  );
}


function getSkillName(skill) {
  if (typeof skill === "string") {
    return skill;
  }

  return (
    skill?.skill ??
    skill?.name ??
    skill?.skill_name ??
    ""
  );
}


/*
 * Convert backend skill objects into the simple strings
 * currently expected by Profile.jsx.
 *
 * Example:
 *
 * [
 *   { id: 1, skill: "React" },
 *   { id: 2, skill: "Python" }
 * ]
 *
 * becomes:
 *
 * ["React", "Python"]
 */

function normalizeSkillNames(skills) {
  return skills
    .map(getSkillName)
    .filter(Boolean);
}


/* =========================================================
   PROVIDER
========================================================= */

export default function UserProfileProvider({
  children,
}) {
  const initialProfile = loadUserProfile();

  const [department, setDepartmentState] =
    useState(initialProfile.department || "");

  const [skills, setSkills] =
    useState(initialProfile.skills || []);

  const [history, setHistory] =
    useState(initialProfile.history || []);


  const [loadingSkills, setLoadingSkills] =
    useState(false);

  const [skillError, setSkillError] =
    useState("");


  /* =======================================================
     SAVE LOCAL PROFILE
  ======================================================= */

  const saveProfile = useCallback(
    (
      nextDepartment = department,
      nextSkills = skills,
      nextHistory = history
    ) => {
      saveUserProfile({
        department: nextDepartment,
        skills: nextSkills,
        history: nextHistory,
      });
    },
    [department, skills, history]
  );


  /* =======================================================
     GET SKILLS
     
     GET /api/users/skills
  ======================================================= */

  const fetchSkills = useCallback(async () => {
    const token = getToken();

    if (!token) {
      console.warn(
        "UserProfileProvider: no authentication token."
      );

      return;
    }

    setLoadingSkills(true);
    setSkillError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/skills`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "USER PROFILE - SKILLS RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch skills"
        );
      }

      const backendSkills =
        extractSkills(data);

      const skillNames =
        normalizeSkillNames(backendSkills);

      setSkills(skillNames);

      /*
       * Keep local cache synchronized with backend.
       */
      setHistory((currentHistory) => {
        saveUserProfile({
          department,
          skills: skillNames,
          history: currentHistory,
        });

        return currentHistory;
      });
    } catch (error) {
      console.error(
        "UserProfileProvider - fetch skills error:",
        error
      );

      setSkillError(
        error.message ||
          "Failed to load skills"
      );
    } finally {
      setLoadingSkills(false);
    }
  }, [department]);


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);


  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const setDepartment = useCallback(
    (value) => {
      setDepartmentState(value);

      saveUserProfile({
        department: value,
        skills,
        history,
      });
    },
    [skills, history]
  );


  /* =======================================================
     ADD SKILL
     
     POST /api/users/skills
  ======================================================= */

  const addSkill = useCallback(
    async (skillName) => {
      const cleanSkill =
        String(skillName || "").trim();

      if (!cleanSkill) {
        return;
      }

      /*
       * Prevent duplicates on frontend.
       */
      const alreadyExists = skills.some(
        (skill) =>
          skill.toLowerCase() ===
          cleanSkill.toLowerCase()
      );

      if (alreadyExists) {
        return;
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      setSkillError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/users/skills`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              skill: cleanSkill,
            }),
          }
        );

        const data = await response.json();

        console.log(
          "USER PROFILE - ADD SKILL RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to add skill"
          );
        }

        /*
         * If backend returns the newly created skill,
         * use it. Otherwise refresh the complete list.
         */
        const returnedSkills =
          extractSkills(data);

        if (returnedSkills.length > 0) {
          const skillNames =
            normalizeSkillNames(
              returnedSkills
            );

          setSkills(skillNames);

          saveUserProfile({
            department,
            skills: skillNames,
            history,
          });
        } else {
          /*
           * Safest fallback: reload from backend.
           */
          await fetchSkills();
        }

        return data;
      } catch (error) {
        console.error(
          "UserProfileProvider - add skill error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to add skill"
        );

        throw error;
      }
    },
    [
      skills,
      department,
      history,
      fetchSkills,
    ]
  );


  /* =======================================================
     DELETE SKILL
     
     DELETE /api/users/skills/:skillId
  ======================================================= */

  const removeSkill = useCallback(
    async (skillName) => {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      /*
       * First fetch the backend skills so we can
       * find the database ID corresponding to the
       * displayed skill name.
       */
      try {
        setSkillError("");

        const response = await fetch(
          `${API_BASE_URL}/users/skills`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch skills"
          );
        }

        const backendSkills =
          extractSkills(data);

        const matchingSkill =
          backendSkills.find(
            (skill) =>
              getSkillName(skill)
                .toLowerCase() ===
              String(skillName)
                .toLowerCase()
          );

        const skillId =
          getSkillId(matchingSkill);

        if (!skillId) {
          throw new Error(
            `Could not find skill ID for "${skillName}".`
          );
        }

        /*
         * DELETE /users/skills/:skillId
         */
        const deleteResponse =
          await fetch(
            `${API_BASE_URL}/users/skills/${skillId}`,
            {
              method: "DELETE",

              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const deleteData =
          await deleteResponse.json();

        console.log(
          "USER PROFILE - DELETE SKILL RESPONSE:",
          deleteData
        );

        if (!deleteResponse.ok) {
          throw new Error(
            deleteData?.message ||
              "Failed to delete skill"
          );
        }

        /*
         * Remove it from UI immediately.
         */
        setSkills((currentSkills) => {
          const updatedSkills =
            currentSkills.filter(
              (skill) =>
                skill.toLowerCase() !==
                String(skillName).toLowerCase()
            );

          saveUserProfile({
            department,
            skills: updatedSkills,
            history,
          });

          return updatedSkills;
        });

        return deleteData;
      } catch (error) {
        console.error(
          "UserProfileProvider - remove skill error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to delete skill"
        );

        throw error;
      }
    },
    [department, history]
  );


  /* =======================================================
     UPDATE SKILL
     
     PATCH /api/users/skills/:skillId
     
     Not currently used by Profile.jsx, but exposed
     for future editing functionality.
  ======================================================= */

  const updateSkill = useCallback(
    async (
      skillId,
      newSkillName
    ) => {
      const cleanSkill =
        String(newSkillName || "").trim();

      if (!skillId || !cleanSkill) {
        return;
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/users/skills/${skillId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              skill: cleanSkill,
            }),
          }
        );

        const data = await response.json();

        console.log(
          "USER PROFILE - UPDATE SKILL RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to update skill"
          );
        }

        await fetchSkills();

        return data;
      } catch (error) {
        console.error(
          "UserProfileProvider - update skill error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to update skill"
        );

        throw error;
      }
    },
    [fetchSkills]
  );


  /* =======================================================
     HISTORY
     
     Still local for now.
     We can connect this to backend later when the
     task-history API is available.
  ======================================================= */

  const addHistory = useCallback(
    (historyItem) => {
      setHistory((currentHistory) => {
        const updatedHistory = [
          ...currentHistory,
          historyItem,
        ];

        saveUserProfile({
          department,
          skills,
          history: updatedHistory,
        });

        return updatedHistory;
      });
    },
    [department, skills]
  );


  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo(
    () => ({
      department,
      skills,
      history,

      loadingSkills,
      skillError,

      setDepartment,

      addSkill,
      removeSkill,
      updateSkill,

      fetchSkills,

      addHistory,
    }),
    [
      department,
      skills,
      history,
      loadingSkills,
      skillError,
      setDepartment,
      addSkill,
      removeSkill,
      updateSkill,
      fetchSkills,
      addHistory,
    ]
  );


  return (
    <UserProfileContext.Provider
      value={value}
    >
      {children}
    </UserProfileContext.Provider>
  );
}