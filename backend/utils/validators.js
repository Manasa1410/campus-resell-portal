export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~\\-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\.)+[a-z]{2,}(?:\.[a-z]{2,})*$/i;

export const validateEmail = (email) => EMAIL_REGEX.test(String(email || "").trim());

export const getAllowedCollegeDomains = () => {
  const configured = process.env.COLLEGE_EMAIL_DOMAINS || "@college.edu";
  return configured
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .map((domain) => (domain.startsWith("@") ? domain : `@${domain}`));
};

export const validateCollegeEmailDomain = (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const parts = normalizedEmail.split("@");
  if (parts.length < 2) return false;
  const domain = parts[parts.length - 1];

  // Match .edu, .edu.[country_code] (e.g., .edu.in), and .ac.[country_code] (e.g., .ac.in)
  const eduRegex = /(\.edu|\.edu\.[a-z]{2,}|\.ac\.[a-z]{2,})$/i;
  if (eduRegex.test(domain)) {
    return true;
  }

  const allowedDomains = getAllowedCollegeDomains();
  return allowedDomains.some((allowed) => {
    const cleanAllowed = allowed.startsWith("@") ? allowed.slice(1) : allowed;
    return domain === cleanAllowed || domain.endsWith("." + cleanAllowed);
  });
};

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
