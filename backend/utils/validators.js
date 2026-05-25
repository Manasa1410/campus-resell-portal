export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-z]{2,}(?:\.[a-z]{2,})*$/i;

export const validateEmail = (email) => EMAIL_REGEX.test(String(email || "").trim());

export const validatePassword = (password) => password && password.length >= 6;

export const validateRegisterInput = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return "All fields are required";
  }

  if (!validateEmail(email)) {
    return "Use a valid email address, including public or institutional domains such as .edu, .in, .edu.in, .ac.in, or .res.in";
  }

  if (!validatePassword(password)) {
    return "Password must be at least 6 characters";
  }

  return null;
};

export const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    return "Email and password are required";
  }

  if (!validateEmail(email)) {
    return "Use a valid email address";
  }

  return null;
};
