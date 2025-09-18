export const config = () => {
  try {
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    if (!user) {
      // Redirect to login page if user is not found
      window.location.href = "/auth/sign-in";
      return {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };
    }

    const token = user?.data?.token || "";

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    return { headers };
  } catch (error) {
    console.error("Error getting user from localStorage:", error);
    return {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
  }
};
