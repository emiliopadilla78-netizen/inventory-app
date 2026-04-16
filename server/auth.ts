import express from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (result.length === 0) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    const user = result[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Password incorrecto" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login" });
  }
});

export default router;