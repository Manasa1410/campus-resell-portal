import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign(
    { id },                    // payload
    process.env.JWT_SECRET,    // secret key
    {
      expiresIn: "7d",         // token expiry
    }
  );
};

export default generateToken;