import express, { Request, Response } from "express";
import { pool } from "../db/db";
import { hashPassword } from "./auth";

const router = express.Router();

router.post("/api/rehash-passwords", async (req: Request, res: Response) => {
  try {
    console.log("Rehashing passwords route hit");

    const users = await pool.query("SELECT id, password FROM users");
    for (const user of users.rows) {
      console.log(`Rehashing password for user ID: ${user.id}`);
      const hashedPassword = await hashPassword(user.password);
      console.log(
        `New hashed password for user ID ${user.id}: ${hashedPassword}`
      );
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        user.id,
      ]);
    }

    console.log("Passwords rehashed successfully");
    res.status(200).json({ message: "Passwords rehashed successfully" });
  } catch (error) {
    console.error("Error rehashing passwords:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error rehashing passwords", error: errorMessage });
  }
});

export default router;
