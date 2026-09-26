import { useContext } from "react";
import UserProfileContext from "./userProfileContext";

export default function useUserProfile() {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error(
      "useUserProfile must be used inside UserProfileProvider"
    );
  }

  return context;
}