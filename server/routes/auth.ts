import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../db/storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const parts = stored.split(".");
  if (parts.length !== 2) {
    throw new Error(
      "Stored password is not in the correct format (hashedPassword.salt)"
    );
  }

  const [hashed, salt] = parts;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

  return timingSafeEqual(hashedBuf, suppliedBuf);
}
export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    console.log("Deserializing user with id:", id);
    const user = await storage.getUser(id);
    console.log("Deserialized user:", user);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request body:", req.body);

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(
        req.body.username
      );
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create the user with a hashed password
      const hashedPassword = await hashPassword(req.body.password);
      console.log("Creating user with hashed password");

      try {
        const user = await storage.createUser({
          ...req.body,
          password: hashedPassword,
        });

        console.log("User created successfully:", user);

        // Log in the user automatically after registration
        req.login(user, (err) => {
          if (err) {
            console.error("Login error after registration:", err);
            return next(err);
          }

          console.log("User logged in automatically after registration");

          // Create log entry for registration
          storage
            .createLog({
              userId: user.id,
              code: "USER_REG",
              action: "REGISTER",
              description: `User ${user.fullname} registered an account`,
              data: { userId: user.id },
            })
            .then(() => {
              console.log("Registration log created");
              res.status(201).json(user);
            })
            .catch((logErr) => {
              console.error("Error creating registration log:", logErr);
              // Still return the user even if log creation fails
              res.status(201).json(user);
            });
        });
      } catch (createErr: any) {
        console.error("Error creating user:", createErr);
        return res.status(500).json({
          message: "Failed to create user",
          error: createErr.message || String(createErr),
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  // Custom authentication middleware for better debugging
  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);

    passport.authenticate(
      "local",
      (err: any, user: SelectUser | false, info: any) => {
        if (err) {
          console.error("Login authentication error:", err);
          return next(err);
        }

        if (!user) {
          console.log("Login failed: Invalid username or password");
          return res
            .status(401)
            .json({ message: "Invalid username or password" });
        }

        console.log("User authenticated:", user);

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login session error:", loginErr);
            return next(loginErr);
          }

          console.log("User logged in successfully");

          // Create log entry for login
          storage
            .createLog({
              userId: user.id,
              code: "USER_LOGIN",
              action: "LOGIN",
              description: `User ${user.fullname} logged in`,
              data: { userId: user.id },
            })
            .then(() => {
              console.log("Login log created");
              res.status(200).json(user);
            })
            .catch((logErr) => {
              console.error("Error creating login log:", logErr);
              // Still return the user even if log creation fails
              res.status(200).json(user);
            });
        });
      }
    )(req, res, next);
  });
  app.post("/api/logout", (req, res, next) => {
    // Create log entry for logout (if user is authenticated)
    if (req.isAuthenticated()) {
      const user = req.user as SelectUser;
      storage.createLog({
        userId: user.id,
        code: "USER_LOGOUT",
        action: "LOGOUT",
        description: `User ${user.fullname} logged out`,
        data: { userId: user.id },
      });
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - isAuthenticated:", req.isAuthenticated());
    console.log("Session:", req.session);

    if (!req.isAuthenticated()) {
      console.log("User not authenticated, returning 401");
      return res.sendStatus(401);
    }

    console.log("Authenticated user:", req.user);
    res.json(req.user);
  });
}
