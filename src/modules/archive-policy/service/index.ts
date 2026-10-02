import { ArchivePolicyRepository } from "../repository.js";
import { ArchivePolicyService } from "./archive-policy.service.js";

export { ArchivePolicyService } from "./archive-policy.service.js";
export {
  ArchiveExecutorService,
  archiveExecutorService,
} from "./archive-executor.service.js";

export const archivePolicyService = new ArchivePolicyService(
  new ArchivePolicyRepository(),
);
