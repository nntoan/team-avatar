import { join } from "node:path";

const UPLOAD_DIR = "/var/app/uploads";

export function uploadPath(filename) {
  return join(UPLOAD_DIR, filename);
}
