import { LoginSecurityRepository } from "../repository.js";
import { LoginSecurityService } from "./login-security.service.js";

export { LoginSecurityService } from "./login-security.service.js";

export const loginSecurityService = new LoginSecurityService(
  new LoginSecurityRepository(),
);
