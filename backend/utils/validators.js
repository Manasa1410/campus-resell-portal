// utils/validators.js

//
// 📧 Validate Email
//
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

//
// 🔐 Validate Password
//
export const validatePassword = (password) => {
  // Minimum 6 characters
  return password && password.length >= 6;
};

//
// 📝 Validate Register Input
//
export const validateRegisterInput = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return "All fields are required";
  }

  if (!validateEmail(email)) {
    return "Use a valid college email (.edu or .ac.in)";
  }

  if (!validatePassword(password)) {
    return "Password must be at least 6 characters";
  }

  return null; // ✅ valid
};

//
// 🔑 Validate Login Input
//
export const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    return "Email and password are required";
  }

  return null;
};