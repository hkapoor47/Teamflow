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


const API_BASE_URL =
  "http://65.0.11.153:5001/api";


function getToken() {
  return localStorage.getItem("token");
}


export default function UserProfileProvider({
  children,
}) {
  const initialProfile = loadUserProfile();

  const [department, setDepartmentState] =
    useState(initialProfile.department || "");

  const [skills, setSkills] = useState(
    Array.isArray(initialProfile.skills)
      ? initialProfile.skills
      : []
  );

  const [history, setHistory] = useState(
    Array.isArray(initialProfile.history)
      ? initialProfile.history
      : []
  );

  const [loadingSkills, setLoadingSkills] =
    useState(false);

  const [skillError, setSkillError] =
    useState("");


  /* =====================================================
     SAVE PROFILE LOCALLY
  ===================================================== */

  useEffect(() => {
    saveUserProfile({
      department,
      skills,
      history,
    });
  }, [
    department,
    skills,
    history,
  ]);


  /* =====================================================
     GET SKILLS
     GET /api/users/skills
  ===================================================== */

  const fetchSkills = useCallback(
    async () => {
      const token = getToken();

      if (!token) {
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
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch skills"
          );
        }

        const backendSkills =
          Array.isArray(data?.skills)
            ? data.skills
            : [];

        setSkills(backendSkills);
      } catch (error) {
        console.error(
          "Fetch skills error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to load skills"
        );
      } finally {
        setLoadingSkills(false);
      }
    },
    []
  );


  /* =====================================================
     LOAD SKILLS WHEN PROVIDER STARTS
  ===================================================== */

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);


  /* =====================================================
     SET DEPARTMENT
  ===================================================== */

  const setDepartment = useCallback(
    (value) => {
      setDepartmentState(value);
    },
    []
  );


  /* =====================================================
     ADD SKILL
     POST /api/users/skills

     Body:
     {
       name: "React"
     }
  ===================================================== */

  const addSkill = useCallback(
    async (skillName) => {
      const cleanSkill =
        String(skillName || "").trim();

      if (!cleanSkill) {
        return null;
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const alreadyExists =
        skills.some(
          (skill) =>
            String(skill?.skill_name || "")
              .toLowerCase() ===
            cleanSkill.toLowerCase()
        );

      if (alreadyExists) {
        return null;
      }

      setSkillError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/users/skills`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name: cleanSkill,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to add skill"
          );
        }

        const newSkill =
          data?.skill;

        if (!newSkill) {
          throw new Error(
            "Skill was added but the server did not return the skill."
          );
        }

        setSkills(
          (currentSkills) => [
            ...currentSkills,
            newSkill,
          ]
        );

        return newSkill;
      } catch (error) {
        console.error(
          "Add skill error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to add skill"
        );

        throw error;
      }
    },
    [skills]
  );


  /* =====================================================
     UPDATE SKILL
     PATCH /api/users/skills/:skillId

     Body:
     {
       name: "React",
       proficiency: "Advanced"
     }
  ===================================================== */

  const updateSkill = useCallback(
    async (
      skillId,
      skillName,
      proficiency = null
    ) => {
      const cleanSkill =
        String(skillName || "").trim();

      if (!skillId || !cleanSkill) {
        return null;
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
          `${API_BASE_URL}/users/skills/${skillId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name: cleanSkill,
              proficiency,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to update skill"
          );
        }

        const updatedSkill =
          data?.skill;

        if (!updatedSkill) {
          throw new Error(
            "Skill was updated but the server did not return the skill."
          );
        }

        setSkills(
          (currentSkills) =>
            currentSkills.map(
              (skill) =>
                skill.id === skillId
                  ? updatedSkill
                  : skill
            )
        );

        return updatedSkill;
      } catch (error) {
        console.error(
          "Update skill error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to update skill"
        );

        throw error;
      }
    },
    []
  );


  /* =====================================================
     DELETE SKILL
     DELETE /api/users/skills/:skillId
  ===================================================== */

  const removeSkill = useCallback(
    async (skillId) => {
      if (!skillId) {
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
          `${API_BASE_URL}/users/skills/${skillId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to delete skill"
          );
        }

        setSkills(
          (currentSkills) =>
            currentSkills.filter(
              (skill) =>
                skill.id !== skillId
            )
        );

        return data;
      } catch (error) {
        console.error(
          "Delete skill error:",
          error
        );

        setSkillError(
          error.message ||
            "Failed to delete skill"
        );

        throw error;
      }
    },
    []
  );


  /* =====================================================
     ADD HISTORY
  ===================================================== */

  const addHistory = useCallback(
    (historyItem) => {
      setHistory(
        (currentHistory) => [
          ...currentHistory,
          historyItem,
        ]
      );
    },
    []
  );


  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = useMemo(
    () => ({
      department,
      skills,
      history,

      loadingSkills,
      skillError,

      setDepartment,

      addSkill,
      updateSkill,
      removeSkill,

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
      updateSkill,
      removeSkill,

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