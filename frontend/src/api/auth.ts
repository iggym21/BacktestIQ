import client from "./client";
import type { User, AuthTokens } from "../types";

export const register = (email: string, password: string) =>
  client.post<User>("/auth/register", { email, password });

export const login = (email: string, password: string) => {
  const form = new FormData();
  form.append("username", email);
  form.append("password", password);
  return client.post<AuthTokens>("/auth/login", form);
};

export const getMe = () => client.get<User>("/auth/me");
