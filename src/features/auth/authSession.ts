import type { CurrentUser } from "./auth.types";

let accessToken: string | null = null;
let currentUser: CurrentUser | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function setCurrentUser(user: CurrentUser) {
  currentUser = user;
}

export function getCurrentUser() {
  return currentUser;
}

export function clearCurrentUser() {
  currentUser = null;
}
